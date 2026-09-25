import type { TransactionsRepository, FinanceCategoriesRepository } from "./finance.repository";
import type { DateRange } from "@/shared/lib/date-utils";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function createHttpTransactionsRepository(): TransactionsRepository {
  return {
    async list(range?: DateRange) {
      const params = new URLSearchParams();
      if (range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      return fetchJson(`/api/finance/crud?${params}`);
    },
    async create(input) {
      return fetchJson("/api/finance/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    async update(id, patch) {
      return fetchJson(`/api/finance/crud/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    async remove(id) {
      const res = await fetch(`/api/finance/crud/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    },
    async restore(transaction) {
      return fetchJson(`/api/finance/crud/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
    },
  };
}

export function createHttpFinanceCategoriesRepository(): FinanceCategoriesRepository {
  return {
    async list() {
      return fetchJson("/api/finance/categories");
    },
    async create(input) {
      return fetchJson("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    async update(id, patch) {
      return fetchJson(`/api/finance/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    async remove(id) {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    },
  };
}
