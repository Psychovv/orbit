import type { FinanceCategory, Transaction } from "./finance.schema";

export interface MonthlyMetrics {
  totalIncome: number;
  dailyExpenses: number;
  creditCardExpenses: number;
  netBalance: number;
  incomeCount: number;
  dailyCount: number;
  cardCount: number;
}

/** Valores em centavos. Despesas no cartão contam como fatura; as demais, como despesas da conta. */
export function computeMonthlyMetrics(transactions: Transaction[]): MonthlyMetrics {
  const m: MonthlyMetrics = {
    totalIncome: 0,
    dailyExpenses: 0,
    creditCardExpenses: 0,
    netBalance: 0,
    incomeCount: 0,
    dailyCount: 0,
    cardCount: 0,
  };

  for (const tx of transactions) {
    if (tx.type === "income") {
      m.totalIncome += tx.amountCents;
      m.incomeCount++;
    } else if (tx.paymentMethod === "cartao") {
      m.creditCardExpenses += tx.amountCents;
      m.cardCount++;
    } else {
      m.dailyExpenses += tx.amountCents;
      m.dailyCount++;
    }
  }

  m.netBalance = m.totalIncome - m.dailyExpenses - m.creditCardExpenses;
  return m;
}

export function netBalance(transactions: Transaction[]): number {
  return transactions.reduce(
    (acc, tx) => (tx.type === "income" ? acc + tx.amountCents : acc - tx.amountCents),
    0
  );
}

export interface BudgetUsage {
  category: FinanceCategory;
  spentCents: number;
  budgetCents: number;
  ratio: number;
  isOver: boolean;
  isWarning: boolean;
}

export function computeBudgetUsage(categories: FinanceCategory[], transactions: Transaction[]) {
  const spentByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.categoryId) continue;
    spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amountCents);
  }

  const items: BudgetUsage[] = categories
    .filter((c) => c.type === "expense" && c.monthlyBudgetCents)
    .map((category) => {
      const budgetCents = category.monthlyBudgetCents ?? 0;
      const spentCents = spentByCategory.get(category.id) ?? 0;
      const ratio = (spentCents / budgetCents) * 100;
      const isOver = spentCents > budgetCents;
      return { category, spentCents, budgetCents, ratio, isOver, isWarning: ratio >= 80 && !isOver };
    });

  const totalBudgetCents = items.reduce((acc, i) => acc + i.budgetCents, 0);
  const totalSpentCents = items.reduce((acc, i) => acc + i.spentCents, 0);

  return {
    items,
    totalBudgetCents,
    totalSpentCents,
    totalProgress: totalBudgetCents > 0 ? (totalSpentCents / totalBudgetCents) * 100 : 0,
  };
}
