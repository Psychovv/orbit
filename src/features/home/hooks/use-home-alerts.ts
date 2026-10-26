"use client";

import { useMemo } from "react";
import { computeBudgetUsage } from "@/features/finance/domain/metrics";
import { useFinanceCategories, useTransactions } from "@/features/finance/hooks/use-finance";
import { useHabitsSummary } from "@/features/habits/hooks/use-habits-summary";
import { getYearMonthKey, monthRange } from "@/shared/lib/date-utils";
import { buildHomeAlerts, type HomeAlert } from "../domain/home-alerts";

/** Alertas do hub (orçamento e hábitos). Lista vazia enquanto carrega. */
export function useHomeAlerts(): HomeAlert[] {
  const monthKey = getYearMonthKey(new Date());
  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const transactionsQuery = useTransactions(range);
  const categoriesQuery = useFinanceCategories();
  const habits = useHabitsSummary();

  return useMemo(() => {
    if (!transactionsQuery.data || !categoriesQuery.data) {
      return buildHomeAlerts({ habits });
    }

    const { items } = computeBudgetUsage(categoriesQuery.data, transactionsQuery.data);
    return buildHomeAlerts({ budgetItems: items, habits });
  }, [transactionsQuery.data, categoriesQuery.data, habits]);
}
