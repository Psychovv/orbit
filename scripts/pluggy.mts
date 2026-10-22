/**
 * Administração da integração Pluggy pela linha de comando.
 *
 *   pnpm pluggy webhook:list
 *   pnpm pluggy webhook:create https://seu-dominio/api/webhooks/pluggy
 *   pnpm pluggy webhook:update <webhookId> [url]   # reenvia o segredo atual (rotação)
 *   pnpm pluggy webhook:delete <webhookId>
 *   pnpm pluggy item <itemId>
 *
 * Lê PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET e PLUGGY_WEBHOOK_SECRET do ambiente (`--env-file=.env.local`).
 * O segredo do webhook nunca é aceito por argumento, para não ficar no histórico do shell,
 * e nenhum valor sensível é impresso.
 */

const BASE_URL = "https://api.pluggy.ai";
const WEBHOOK_PATH = "/api/webhooks/pluggy";
const SECRET_HEADER = "x-orbit-webhook-secret";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Webhook = { id: string; url: string; event: string; disabledAt?: string | null; headers?: Record<string, string> };

function fail(message: string): never {
  console.error(`erro: ${message}`);
  process.exit(1);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) fail(`${name} não definido. Rode com --env-file=.env.local ou exporte a variável.`);
  return value;
}

function requireUuid(value: string | undefined, label: string): string {
  if (!value || !UUID.test(value)) fail(`${label} inválido (esperado UUID).`);
  return value;
}

function webhookSecret(): string {
  const secret = requireEnv("PLUGGY_WEBHOOK_SECRET");
  if (secret.length < 32) fail("PLUGGY_WEBHOOK_SECRET precisa ter pelo menos 32 caracteres (use: openssl rand -hex 32).");
  return secret;
}

function validateWebhookUrl(raw: string | undefined): string {
  if (!raw) fail("informe a URL do webhook.");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail("URL inválida.");
  }
  if (url.protocol !== "https:") fail("a Pluggy só aceita HTTPS.");
  if (url.pathname !== WEBHOOK_PATH) fail(`o caminho precisa ser ${WEBHOOK_PATH}.`);
  if (url.search || url.hash || url.username || url.password) fail("a URL não pode ter query, fragmento ou credenciais.");
  return url.toString();
}

async function apiKey(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: requireEnv("PLUGGY_CLIENT_ID"), clientSecret: requireEnv("PLUGGY_CLIENT_SECRET") }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await res.json().catch(() => ({}))) as { apiKey?: string };
  if (!res.ok || !body.apiKey) fail(`autenticação na Pluggy falhou (HTTP ${res.status}).`);
  return body.apiKey;
}

async function api<T>(key: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-API-KEY": key },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    fail(`${init.method ?? "GET"} ${path.split("?")[0]} → HTTP ${res.status}${body.message ? `: ${body.message}` : ""}`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

function printWebhook(w: Webhook): void {
  const headerNames = Object.keys(w.headers ?? {});
  console.log(
    [
      w.id,
      w.event,
      w.url,
      w.disabledAt ? `DESATIVADO em ${w.disabledAt}` : "ativo",
      `cabeçalhos: ${headerNames.length ? headerNames.join(", ") : "nenhum"}`,
    ].join("  |  ")
  );
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "webhook:list": {
      const key = await apiKey();
      const { results } = await api<{ results: Webhook[] }>(key, "/webhooks");
      if (!results.length) console.log("Nenhum webhook cadastrado.");
      results.forEach(printWebhook);
      return;
    }

    case "webhook:create": {
      const url = validateWebhookUrl(args[0]);
      const secret = webhookSecret();
      const key = await apiKey();
      const { results } = await api<{ results: Webhook[] }>(key, "/webhooks");
      const existing = results.filter((w) => w.url === url);
      if (existing.length) fail(`já existe webhook para essa URL (${existing.map((w) => w.id).join(", ")}). Use webhook:update.`);

      const created = await api<Webhook>(key, "/webhooks", {
        method: "POST",
        body: JSON.stringify({ url, event: "all", headers: { [SECRET_HEADER]: secret } }),
      });
      printWebhook(created);
      return;
    }

    case "webhook:update": {
      const id = requireUuid(args[0], "webhookId");
      const body: Record<string, unknown> = { headers: { [SECRET_HEADER]: webhookSecret() } };
      if (args[1]) body.url = validateWebhookUrl(args[1]);
      const key = await apiKey();
      printWebhook(await api<Webhook>(key, `/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(body) }));
      return;
    }

    case "webhook:delete": {
      const id = requireUuid(args[0], "webhookId");
      const key = await apiKey();
      await api(key, `/webhooks/${id}`, { method: "DELETE" });
      console.log(`Webhook ${id} removido.`);
      return;
    }

    case "item": {
      const id = requireUuid(args[0], "itemId");
      const key = await apiKey();
      const item = await api<{
        connector?: { name?: string };
        status?: string;
        executionStatus?: string;
        consentExpiresAt?: string | null;
        lastUpdatedAt?: string | null;
        error?: { code?: string } | null;
      }>(key, `/items/${id}`);
      const { results: accounts } = await api<{ results: { type: string; subtype?: string }[] }>(
        key,
        `/accounts?${new URLSearchParams({ itemId: id })}`
      );
      console.log(`Instituição:   ${item.connector?.name ?? "?"}`);
      console.log(`Status:        ${item.status ?? "?"} (${item.executionStatus ?? "?"})`);
      console.log(`Atualizado em: ${item.lastUpdatedAt ?? "-"}`);
      console.log(`Autorização:   ${item.consentExpiresAt ?? "-"}`);
      if (item.error?.code) console.log(`Erro:          ${item.error.code}`);
      console.log(`Contas:        ${accounts.map((a) => a.subtype ?? a.type).join(", ") || "nenhuma"}`);
      return;
    }

    default:
      console.log("Comandos: webhook:list | webhook:create <url> | webhook:update <id> [url] | webhook:delete <id> | item <itemId>");
      process.exit(command ? 1 : 0);
  }
}

await main();
