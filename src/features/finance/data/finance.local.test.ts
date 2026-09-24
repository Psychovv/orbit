import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalFinanceCategoriesRepository,
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

  it("restores a removed transaction with the same id", async () => {
    const repo = createLocalTransactionsRepository();
    const created = await repo.create({
      description: "Café",
      amountCents: 800,
      type: "expense",
      categoryId: null,
      date: "2026-09-24",
      paymentMethod: "pix",
    });

    await repo.remove(created.id);
    await repo.restore(created);
    expect(await repo.list()).toEqual([created]);
  });
});

describe("local finance categories repository", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
    store.set(FINANCE_STORAGE_KEYS.categories, "[]");
    store.set(FINANCE_STORAGE_KEYS.transactions, "[]");
  });

  it("creates, updates the budget and clears it", async () => {
    const repo = createLocalFinanceCategoriesRepository();
    const created = await repo.create({ name: "Pets", type: "expense", color: "#10b981", icon: "🐾" });

    const withBudget = await repo.update(created.id, { monthlyBudgetCents: 20000 });
    expect(withBudget.monthlyBudgetCents).toBe(20000);

    const cleared = await repo.update(created.id, { monthlyBudgetCents: null });
    expect(cleared.monthlyBudgetCents).toBeUndefined();
  });

  it("detaches transactions when a category is removed", async () => {
    const categories = createLocalFinanceCategoriesRepository();
    const transactions = createLocalTransactionsRepository();
    const category = await categories.create({ name: "Pets", type: "expense", color: "#10b981", icon: "🐾" });
    const tx = await transactions.create({
      description: "Ração",
      amountCents: 5000,
      type: "expense",
      categoryId: category.id,
      date: "2026-09-24",
      paymentMethod: "pix",
    });

    await categories.remove(category.id);

    expect(await categories.list()).toEqual([]);
    expect((await transactions.list()).find((item) => item.id === tx.id)?.categoryId).toBeNull();
  });
});
