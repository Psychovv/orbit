import { describe, expect, it } from "vitest";
import type { FinanceCategory, Transaction } from "./finance.schema";
import {
  computeBudgetUsage,
  computeMonthlyMetrics,
  computeSpendingBreakdown,
  netBalance,
  projectMonthSpend,
} from "./metrics";

const ts = "2026-09-01T12:00:00.000Z";
const tx = (partial: Partial<Transaction> & Pick<Transaction, "id" | "amountCents" | "type">): Transaction => ({
  description: "x",
  categoryId: null,
  date: "2026-09-10",
  paymentMethod: "pix",
  createdAt: ts,
  updatedAt: ts,
  ...partial,
});

const transactions = [
  tx({ id: "1", amountCents: 620000, type: "income", categoryId: "salario" }),
  tx({ id: "2", amountCents: 140000, type: "expense", categoryId: "moradia", paymentMethod: "boleto" }),
  tx({ id: "3", amountCents: 50000, type: "expense", categoryId: "alimentacao", paymentMethod: "cartao" }),
  tx({ id: "4", amountCents: 40000, type: "expense", categoryId: "alimentacao", paymentMethod: "cartao", pending: true }),
  tx({ id: "5", amountCents: 90000, type: "expense", paymentMethod: "transferencia", countsInBalance: false }),
  tx({ id: "6", amountCents: 90000, type: "income", paymentMethod: "cartao", countsInBalance: false }),
  tx({ id: "7", amountCents: 20000, type: "expense", paymentMethod: "pix" }),
];

const categories: FinanceCategory[] = [
  { id: "moradia", name: "Moradia", type: "expense", color: "#000", icon: "🏠", monthlyBudgetCents: 160000 },
  { id: "alimentacao", name: "Comida", type: "expense", color: "#000", icon: "🍔", monthlyBudgetCents: 85000 },
  { id: "lazer", name: "Lazer", type: "expense", color: "#000", icon: "🎮" },
  { id: "salario", name: "Salário", type: "income", color: "#000", icon: "💰" },
];

describe("finance metrics", () => {
  it("ignores bill settlement so income and expenses are real money", () => {
    expect(computeMonthlyMetrics(transactions)).toMatchObject({
      incomeCents: 620000,
      incomeCount: 1,
      expenseCents: 250000,
      expenseCount: 4,
      savedCents: 370000,
      cardSpendCents: 90000,
      accountSpendCents: 160000,
      pendingCardCents: 40000,
      uncategorizedCents: 20000,
      uncategorizedCount: 1,
      billPaymentCents: 90000,
    });
    expect(computeMonthlyMetrics(transactions).savingsRate).toBeCloseTo((370000 / 620000) * 100);
  });

  it("keeps the balance when only one side of a bill payment was imported", () => {
    const withoutCardCredit = transactions.filter((item) => item.id !== "6");
    expect(netBalance(withoutCardCredit)).toBe(370000);
    expect(netBalance(transactions)).toBe(370000);
  });

  it("projects the month from the pace so far", () => {
    expect(projectMonthSpend(30000, 10, 30)).toEqual({ dailyCents: 3000, projectedCents: 90000 });
    expect(projectMonthSpend(0, 10, 30)).toBeNull();
  });

  it("computes budget usage and flags overspending", () => {
    const usage = computeBudgetUsage(categories, transactions);

    expect(usage.items.map((i) => i.category.id)).toEqual(["moradia", "alimentacao"]);
    expect(usage.items[0]).toMatchObject({ spentCents: 140000, isWarning: true, isOver: false });
    expect(usage.items[1]).toMatchObject({ spentCents: 90000, isOver: true });
    expect(usage.totalBudgetCents).toBe(245000);
    expect(usage.totalSpentCents).toBe(230000);
  });

  it("does not let a categorized bill payment consume the budget", () => {
    const withBill = [
      ...transactions,
      tx({
        id: "8",
        amountCents: 50000,
        type: "expense",
        categoryId: "moradia",
        countsInBalance: false,
      }),
    ];
    const usage = computeBudgetUsage(categories, withBill);
    expect(usage.items[0].spentCents).toBe(140000);
  });

  it("lists where the money went, including uncategorized spend and unused budgets", () => {
    const breakdown = computeSpendingBreakdown(
      [
        ...categories,
        { id: "transporte", name: "Transporte", type: "expense", color: "#000", icon: "🚗", monthlyBudgetCents: 35000 },
      ],
      transactions
    );

    expect(breakdown.expenseCents).toBe(250000);
    expect(breakdown.uncategorizedCents).toBe(20000);
    expect(breakdown.slices.map((slice) => slice.id)).toEqual([
      "moradia",
      "alimentacao",
      "uncategorized",
      "transporte",
    ]);
    expect(breakdown.slices[0]).toMatchObject({ spentCents: 140000, isWarning: true });
    expect(breakdown.slices[1]).toMatchObject({ spentCents: 90000, isOver: true });
    expect(breakdown.slices[2].share).toBeCloseTo(8);
    expect(breakdown.slices[3]).toMatchObject({ spentCents: 0, budgetCents: 35000 });
    expect(breakdown.totalBudgetCents).toBe(280000);
    expect(breakdown.budgetedSpentCents).toBe(230000);
  });
});
