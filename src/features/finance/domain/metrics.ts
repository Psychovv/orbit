import type { FinanceCategory, Transaction } from "./finance.schema";

export interface MonthlyMetrics {
  /** Todas as entradas do mês (conta + cartão), como no Meu Pluggy. */
  totalIncome: number;
  /** Todas as saídas do mês (conta + cartão), como no Meu Pluggy. */
  totalExpenses: number;
  /** Entradas − saídas. */
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
  /** Compras no cartão no mês. */
  cardPurchases: number;
  cardCount: number;
  /** Compras de cartão ainda pendentes (fatura aberta). */
  pendingCardCents: number;
  pendingCardCount: number;
  /** Saídas da conta corrente. */
  accountExpenses: number;
  accountExpenseCount: number;
}

/**
 * Totais do mês no mesmo critério do Meu Pluggy: soma tudo que entrou e saiu,
 * inclusive liquidação de fatura nos dois lados (sai da conta e entra no cartão).
 */
export function computeMonthlyMetrics(transactions: Transaction[]): MonthlyMetrics {
  const m: MonthlyMetrics = {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0,
    cardPurchases: 0,
    cardCount: 0,
    pendingCardCents: 0,
    pendingCardCount: 0,
    accountExpenses: 0,
    accountExpenseCount: 0,
  };

  for (const tx of transactions) {
    if (tx.type === "income") {
      m.totalIncome += tx.amountCents;
      m.incomeCount++;
      continue;
    }

    m.totalExpenses += tx.amountCents;
    m.expenseCount++;

    if (tx.paymentMethod === "cartao") {
      m.cardPurchases += tx.amountCents;
      m.cardCount++;
      if (tx.pending) {
        m.pendingCardCents += tx.amountCents;
        m.pendingCardCount++;
      }
    } else {
      m.accountExpenses += tx.amountCents;
      m.accountExpenseCount++;
    }
  }

  m.netBalance = m.totalIncome - m.totalExpenses;
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
