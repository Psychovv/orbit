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
  tx({ id: "4", amountCents: 40000, type: "expense", categoryId: "alimentacao", paymentMethod: "cartao" }),
];

describe("finance metrics", () => {
  it("splits card expenses from account expenses", () => {
    expect(computeMonthlyMetrics(transactions)).toEqual({
      totalIncome: 620000,
      dailyExpenses: 140000,
      creditCardExpenses: 90000,
      netBalance: 390000,
      incomeCount: 1,
      dailyCount: 1,
      cardCount: 2,
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
