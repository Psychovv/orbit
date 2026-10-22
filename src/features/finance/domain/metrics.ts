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

/**
 * Valores em centavos.
 * Pagamentos de fatura (`countsInBalance === false`) ficam de fora.
 * Com `statementCents`, a fatura é o total fechado pelo banco; as compras importadas do cartão
 * não são somadas de novo. Sem esse total, a fatura volta a ser a soma das compras do mês.
 */
export function computeMonthlyMetrics(transactions: Transaction[], statementCents?: number): MonthlyMetrics {
  const m: MonthlyMetrics = {
    totalIncome: 0,
    dailyExpenses: 0,
    creditCardExpenses: 0,
    netBalance: 0,
    incomeCount: 0,
    dailyCount: 0,
    cardCount: 0,
  };

  let importedCard = 0;
  let manualCard = 0;

  for (const tx of transactions) {
    if (tx.countsInBalance === false) continue;

    if (tx.paymentMethod === "cartao") {
      const delta = tx.type === "expense" ? tx.amountCents : -tx.amountCents;
      if (tx.type === "expense") m.cardCount++;
      if (tx.externalId) importedCard += delta;
      else manualCard += delta;
      continue;
    }

    if (tx.type === "income") {
      m.totalIncome += tx.amountCents;
      m.incomeCount++;
    } else {
      m.dailyExpenses += tx.amountCents;
      m.dailyCount++;
    }
  }

  m.creditCardExpenses = (statementCents ?? importedCard) + manualCard;
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
