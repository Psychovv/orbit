import "server-only";
import {
  PluggyAccountSchema,
  PluggyAccountsPageSchema,
  PluggyBillSchema,
  PluggyBillsPageSchema,
  PluggyItemSchema,
  PluggyTransactionSchema,
  PluggyTransactionsPageSchema,
  type PluggyAccount,
  type PluggyBill,
  type PluggyItem,
  type PluggyTransaction,
} from "./types";

const BASE_URL = "https://api.pluggy.ai";
const REQUEST_TIMEOUT_MS = 20_000;
/** O apiKey vale 2h; renovamos antes para não expirar no meio de uma sincronização. */
const API_KEY_TTL_MS = 100 * 60 * 1000;
const MAX_PAGES = 200;

export class PluggyError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string
  ) {
    super(`Pluggy respondeu ${status}${code ? ` (${code})` : ""}`);
    this.name = "PluggyError";
  }
}

let cachedKey: { value: string; expiresAt: number } | null = null;
let pendingKey: Promise<string> | null = null;

export function isPluggyConfigured(): boolean {
  return Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
}

async function requestApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new PluggyError(500, "NOT_CONFIGURED");

  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new PluggyError(res.status, "AUTH_FAILED");

  const body = (await res.json().catch(() => ({}))) as { apiKey?: unknown };
  if (typeof body.apiKey !== "string" || !body.apiKey) throw new PluggyError(502, "AUTH_INVALID_RESPONSE");

  cachedKey = { value: body.apiKey, expiresAt: Date.now() + API_KEY_TTL_MS };
  return body.apiKey;
}

async function getApiKey(): Promise<string> {
  if (cachedKey && cachedKey.expiresAt > Date.now()) return cachedKey.value;
  pendingKey ??= requestApiKey().finally(() => {
    pendingKey = null;
  });
  return pendingKey;
}

async function pluggyRequest(path: string, init: RequestInit = {}, retried = false): Promise<unknown> {
  const apiKey = await getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, "Content-Type": "application/json", "X-API-KEY": apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (res.status === 401 && !retried) {
    cachedKey = null;
    return pluggyRequest(path, init, true);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: unknown };
    throw new PluggyError(res.status, typeof body.code === "string" ? body.code : undefined);
  }
  if (res.status === 204) return null;
  return res.json();
}

function encodeId(id: string): string {
  return encodeURIComponent(id);
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  return PluggyItemSchema.parse(await pluggyRequest(`/items/${encodeId(itemId)}`));
}

export async function getAccounts(itemId: string): Promise<PluggyAccount[]> {
  const page = PluggyAccountsPageSchema.parse(
    await pluggyRequest(`/accounts?${new URLSearchParams({ itemId })}`)
  );
  return page.results.flatMap((raw) => {
    const parsed = PluggyAccountSchema.safeParse(raw);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function getBills(accountId: string): Promise<PluggyBill[]> {
  const page = PluggyBillsPageSchema.parse(
    await pluggyRequest(`/bills?${new URLSearchParams({ accountId })}`)
  );
  return page.results.flatMap((raw) => {
    const parsed = PluggyBillSchema.safeParse(raw);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function getAccount(accountId: string): Promise<PluggyAccount> {
  return PluggyAccountSchema.parse(await pluggyRequest(`/accounts/${encodeId(accountId)}`));
}

type TransactionsFilter = { dateFrom: string } | { ids: string[] };

/** Percorre todas as páginas de `GET /v2/transactions`. */
export async function listTransactions(
  accountId: string,
  filter: TransactionsFilter
): Promise<PluggyTransaction[]> {
  const base = new URLSearchParams({ accountId });
  if ("dateFrom" in filter) base.set("dateFrom", filter.dateFrom);
  else base.set("ids", filter.ids.join(","));

  const all: PluggyTransaction[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams(base);
    if (after) params.set("after", after);

    const body = PluggyTransactionsPageSchema.parse(await pluggyRequest(`/v2/transactions?${params}`));
    for (const raw of body.results) {
      const parsed = PluggyTransactionSchema.safeParse(raw);
      if (parsed.success) all.push(parsed.data);
    }

    // `next` é uma query string pronta; só o cursor é aproveitado para a URL nunca sair do nosso controle.
    after = body.next ? new URLSearchParams(body.next.replace(/^\?/, "")).get("after") : null;
    if (!after) break;
  }

  return all;
}
