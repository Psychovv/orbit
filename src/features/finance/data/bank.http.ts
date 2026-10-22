import type { BankAccount, BankConnection, BankSyncResult, CardBill } from "../domain/bank.schema";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const bankApi = {
  listConnections: () => fetchJson<BankConnection[]>("/api/finance/bank/connections"),

  listBills: () => fetchJson<CardBill[]>("/api/finance/bank/bills"),

  listAccounts: () => fetchJson<BankAccount[]>("/api/finance/bank/accounts"),

  addConnection: (itemId: string) =>
    fetchJson<{ connection: BankConnection; sync: BankSyncResult }>("/api/finance/bank/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    }),

  removeConnection: (itemId: string) =>
    fetchJson<void>(`/api/finance/bank/connections/${encodeURIComponent(itemId)}`, { method: "DELETE" }),

  syncAll: () => fetchJson<BankSyncResult[]>("/api/finance/bank/sync", { method: "POST" }),
};
