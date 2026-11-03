import type { FinanceCategory, Transaction } from "./finance.schema";

/**
 * Pagamento de fatura entra nos dois lados do extrato (sai da conta e entra no cartão).
 * Não é receita nem gasto novo: a compra já foi contada no dia em que aconteceu.
 */
export function affectsBalance(tx: Pick<Transaction, "countsInBalance">): boolean {
  return tx.countsInBalance !== false;
}

export interface MonthlyMetrics {
  /** Receitas do mês, sem crédito de pagamento de fatura. */
  incomeCents: number;
  incomeCount: number;
  /** Gastos do mês. Compra no cartão entra uma vez; pagamento da fatura não entra. */
  expenseCents: number;
  expenseCount: number;
  /** Receitas − gastos. Positivo = sobrou. */
  savedCents: number;
  /** Parcela da receita que sobrou. `null` quando não houve receita. Pode ser negativa. */
  savingsRate: number | null;
  cardSpendCents: number;
  accountSpendCents: number;
  pendingCardCents: number;
  uncategorizedCents: number;
  uncategorizedCount: number;
  /** Saídas marcadas como pagamento de fatura. Não entram em `expenseCents`. */
  billPaymentCents: number;
}

export function computeMonthlyMetrics(transactions: Transaction[]): MonthlyMetrics {
  const m: MonthlyMetrics = {
    incomeCents: 0,
    incomeCount: 0,
    expenseCents: 0,
    expenseCount: 0,
    savedCents: 0,
    savingsRate: null,
    cardSpendCents: 0,
    accountSpendCents: 0,
    pendingCardCents: 0,
    uncategorizedCents: 0,
    uncategorizedCount: 0,
    billPaymentCents: 0,
  };

  for (const tx of transactions) {
    if (!affectsBalance(tx)) {
      if (tx.type === "expense") m.billPaymentCents += tx.amountCents;
      continue;
    }

    if (tx.type === "income") {
      m.incomeCents += tx.amountCents;
      m.incomeCount++;
      continue;
    }

    m.expenseCents += tx.amountCents;
    m.expenseCount++;

    if (!tx.categoryId) {
      m.uncategorizedCents += tx.amountCents;
      m.uncategorizedCount++;
    }

    if (tx.paymentMethod === "cartao") {
      m.cardSpendCents += tx.amountCents;
      if (tx.pending) m.pendingCardCents += tx.amountCents;
    } else {
      m.accountSpendCents += tx.amountCents;
    }
  }

  m.savedCents = m.incomeCents - m.expenseCents;
  m.savingsRate = m.incomeCents > 0 ? (m.savedCents / m.incomeCents) * 100 : null;
  return m;
}

export function netBalance(transactions: Transaction[]): number {
  return computeMonthlyMetrics(transactions).savedCents;
}

/** Projeta o gasto do mês pelo ritmo dos dias já passados. `null` sem gasto ou sem dia decorrido. */
export function projectMonthSpend(
  spentCents: number,
  elapsedDays: number,
  daysInMonth: number
): { dailyCents: number; projectedCents: number } | null {
  if (spentCents <= 0 || elapsedDays < 1 || daysInMonth < 1) return null;
  const dailyCents = Math.round(spentCents / elapsedDays);
  return { dailyCents, projectedCents: Math.round((spentCents / elapsedDays) * daysInMonth) };
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
  const spentByCategory = spentByCategoryId(transactions);

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

export interface SpendSlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  spentCents: number;
  /** Percentual do gasto do mês. 0 quando não houve gasto. */
  share: number;
  budgetCents: number | null;
  ratio: number | null;
  isOver: boolean;
  isWarning: boolean;
}

const UNCATEGORIZED_ID = "uncategorized";

export function computeSpendingBreakdown(categories: FinanceCategory[], transactions: Transaction[]) {
  const spentByCategory = spentByCategoryId(transactions);
  const expenseCents = [...spentByCategory.values()].reduce((acc, value) => acc + value, 0);
  const uncategorizedCents = spentByCategory.get(UNCATEGORIZED_ID) ?? 0;

  const slices: SpendSlice[] = [];

  for (const category of categories) {
    if (category.type !== "expense") continue;
    const spentCents = spentByCategory.get(category.id) ?? 0;
    const budgetCents = category.monthlyBudgetCents ?? null;
    if (spentCents === 0 && budgetCents == null) continue;
    slices.push(toSlice(category.id, category.name, category.icon, category.color, spentCents, budgetCents, expenseCents));
  }

  if (uncategorizedCents > 0) {
    slices.push(
      toSlice(UNCATEGORIZED_ID, "Sem categoria", "?", "#a1a1aa", uncategorizedCents, null, expenseCents)
    );
  }

  slices.sort((a, b) => {
    if (a.spentCents === 0 && b.spentCents > 0) return 1;
    if (b.spentCents === 0 && a.spentCents > 0) return -1;
    if (a.spentCents !== b.spentCents) return b.spentCents - a.spentCents;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const budgeted = slices.filter((slice) => slice.budgetCents != null);
  const totalBudgetCents = budgeted.reduce((acc, slice) => acc + (slice.budgetCents ?? 0), 0);
  const budgetedSpentCents = budgeted.reduce((acc, slice) => acc + slice.spentCents, 0);

  return { slices, expenseCents, uncategorizedCents, totalBudgetCents, budgetedSpentCents };
}

function spentByCategoryId(transactions: Transaction[]): Map<string, number> {
  const spent = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense" || !affectsBalance(tx)) continue;
    const key = tx.categoryId ?? UNCATEGORIZED_ID;
    spent.set(key, (spent.get(key) ?? 0) + tx.amountCents);
  }
  return spent;
}

function toSlice(
  id: string,
  name: string,
  icon: string,
  color: string,
  spentCents: number,
  budgetCents: number | null,
  expenseCents: number
): SpendSlice {
  const ratio = budgetCents ? (spentCents / budgetCents) * 100 : null;
  const isOver = budgetCents != null && spentCents > budgetCents;
  return {
    id,
    name,
    icon,
    color,
    spentCents,
    share: expenseCents > 0 ? (spentCents / expenseCents) * 100 : 0,
    budgetCents,
    ratio,
    isOver,
    isWarning: ratio != null && ratio >= 80 && !isOver,
  };
}
