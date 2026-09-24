import { isInRange } from "@/shared/lib/date-utils";
import { createId, nowIso } from "@/shared/lib/id";
import { loadVersionedList, withStoreLock, writeJson } from "@/shared/lib/local-store";
import {
  CreateTransactionSchema,
  FinanceCategorySchema,
  TransactionSchema,
  type FinanceCategory,
  type Transaction,
} from "../domain/finance.schema";
import { toCents } from "../domain/money";
import type { FinanceCategoriesRepository, TransactionsRepository } from "./finance.repository";

export const FINANCE_STORAGE_KEYS = {
  transactions: "orbit_transactions_v2",
  categories: "orbit_finance_categories_v2",
  legacyTransactions: "orbit_transactions_v1",
  legacyCategories: "orbit_finance_categories_v1",
} as const;

/** Converte uma transação do formato v1 (`amount` em reais, sem timestamps). */
export function migrateLegacyTransaction(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const date = typeof t.date === "string" ? t.date : "";
  const timestamp = `${date}T12:00:00.000Z`;

  const parsed = TransactionSchema.safeParse({
    id: String(t.id ?? createId()),
    description: t.description,
    amountCents: typeof t.amount === "number" ? toCents(t.amount) : undefined,
    type: t.type,
    categoryId: typeof t.categoryId === "string" && t.categoryId ? t.categoryId : null,
    date,
    paymentMethod: t.paymentMethod ?? "pix",
    notes: typeof t.notes === "string" && t.notes.trim() ? t.notes : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return parsed.success ? parsed.data : null;
}

export function migrateLegacyFinanceCategory(raw: unknown): FinanceCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const parsed = FinanceCategorySchema.safeParse({
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    icon: c.icon,
    monthlyBudgetCents:
      typeof c.monthlyBudget === "number" && c.monthlyBudget > 0 ? toCents(c.monthlyBudget) : undefined,
  });
  return parsed.success ? parsed.data : null;
}

const loadTransactions = () =>
  loadVersionedList({
    key: FINANCE_STORAGE_KEYS.transactions,
    legacyKey: FINANCE_STORAGE_KEYS.legacyTransactions,
    schema: TransactionSchema,
    migrate: migrateLegacyTransaction,
    seed: async () => (await import("./demo-data")).DEMO_TRANSACTIONS,
  });

const loadCategories = () =>
  loadVersionedList({
    key: FINANCE_STORAGE_KEYS.categories,
    legacyKey: FINANCE_STORAGE_KEYS.legacyCategories,
    schema: FinanceCategorySchema,
    migrate: migrateLegacyFinanceCategory,
    seed: async () => (await import("./demo-data")).DEMO_FINANCE_CATEGORIES,
  });

export function createLocalTransactionsRepository(): TransactionsRepository {
  return {
    list: (range) =>
      withStoreLock(async () => {
        const txs = await loadTransactions();
        return range ? txs.filter((tx) => isInRange(tx.date, range)) : txs;
      }),

    create: (input) =>
      withStoreLock(async () => {
        const now = nowIso();
        const tx: Transaction = {
          ...CreateTransactionSchema.parse(input),
          id: createId(),
          createdAt: now,
          updatedAt: now,
        };
        writeJson(FINANCE_STORAGE_KEYS.transactions, [tx, ...(await loadTransactions())]);
        return tx;
      }),

    remove: (id) =>
      withStoreLock(async () => {
        const txs = await loadTransactions();
        writeJson(
          FINANCE_STORAGE_KEYS.transactions,
          txs.filter((tx) => tx.id !== id)
        );
      }),
  };
}

export function createLocalFinanceCategoriesRepository(): FinanceCategoriesRepository {
  return { list: () => withStoreLock(loadCategories) };
}
