import { describe, expect, it } from "vitest";
import type { FinanceCategory, Transaction } from "./finance.schema";
import { computeBudgetUsage, computeMonthlyMetrics, netBalance } from "./metrics";

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
];

describe("finance metrics", () => {
  it("sums all movements like Meu Pluggy, including bill settlement on both sides", () => {
    expect(computeMonthlyMetrics(transactions)).toEqual({
      totalIncome: 710000,
      totalExpenses: 320000,
      netBalance: 390000,
      incomeCount: 2,
      expenseCount: 4,
      cardPurchases: 90000,
      cardCount: 2,
      pendingCardCents: 40000,
      pendingCardCount: 1,
      accountExpenses: 230000,
      accountExpenseCount: 2,
    });
  });

  it("computes the overall net balance", () => {
    expect(netBalance(transactions)).toBe(390000);
  });

  it("computes budget usage and flags overspending", () => {
    const categories: FinanceCategory[] = [
      { id: "moradia", name: "Moradia", type: "expense", color: "#000", icon: "🏠", monthlyBudgetCents: 160000 },
      { id: "alimentacao", name: "Comida", type: "expense", color: "#000", icon: "🍔", monthlyBudgetCents: 85000 },
      { id: "lazer", name: "Lazer", type: "expense", color: "#000", icon: "🎮" },
    ];
    const usage = computeBudgetUsage(categories, transactions);

    expect(usage.items.map((i) => i.category.id)).toEqual(["moradia", "alimentacao"]);
    expect(usage.items[0]).toMatchObject({ spentCents: 140000, isWarning: true, isOver: false });
    expect(usage.items[1]).toMatchObject({ spentCents: 90000, isOver: true });
    expect(usage.totalBudgetCents).toBe(245000);
    expect(usage.totalSpentCents).toBe(230000);
  });
});
