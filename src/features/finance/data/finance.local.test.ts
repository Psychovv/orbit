import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalTransactionsRepository,
  FINANCE_STORAGE_KEYS,
  migrateLegacyFinanceCategory,
  migrateLegacyTransaction,
} from "./finance.local";

function installLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

describe("finance legacy migration", () => {
  it("converts amounts in reais to cents", () => {
    const tx = migrateLegacyTransaction({
      id: "tx-1",
      description: "Mercado",
      amount: 495.2,
      type: "expense",
      categoryId: "alimentacao",
      date: "2026-08-12",
      paymentMethod: "cartao",
    });
    expect(tx).toMatchObject({ amountCents: 49520, categoryId: "alimentacao", createdAt: "2026-08-12T12:00:00.000Z" });
  });

  it("rejects transactions without a valid amount", () => {
    expect(migrateLegacyTransaction({ id: "x", description: "?", type: "expense", date: "2026-08-12" })).toBeNull();
  });

  it("converts monthly budgets to cents", () => {
    expect(
      migrateLegacyFinanceCategory({ id: "moradia", name: "Moradia", type: "expense", color: "#000", icon: "🏠", monthlyBudget: 1600 })
    ).toMatchObject({ monthlyBudgetCents: 160000 });
  });
});

describe("local transactions repository", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
    store.set(FINANCE_STORAGE_KEYS.transactions, "[]");
  });

  it("updates fields and clears notes", async () => {
    const repo = createLocalTransactionsRepository();
    const created = await repo.create({
      description: "Mercado",
      amountCents: 1000,
      type: "expense",
      categoryId: "alimentacao",
      date: "2026-09-24",
      paymentMethod: "pix",
      notes: "parcela",
    });

    const updated = await repo.update(created.id, {
      description: "Feira",
      amountCents: 2500,
      notes: null,
    });

    expect(updated).toMatchObject({
      id: created.id,
      description: "Feira",
      amountCents: 2500,
      createdAt: created.createdAt,
    });
    expect(updated.notes).toBeUndefined();
    expect(await repo.list()).toEqual([updated]);
  });

  it("throws when the transaction does not exist", async () => {
    const repo = createLocalTransactionsRepository();
    await expect(repo.update("missing", { description: "x" })).rejects.toThrow(/not found/);
  });
});
