"use client";

import { useMemo } from "react";
import { computeBudgetUsage } from "@/features/finance/domain/metrics";
import { useFinanceCategories, useTransactions } from "@/features/finance/hooks/use-finance";
import { useHabitsSummary } from "@/features/habits/hooks/use-habits-summary";
import { isCompleted } from "@/features/tasks/domain/task.selectors";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useTodayTasksSummary } from "@/features/tasks/hooks/use-today-tasks";
import {
  addDays,
  formatDateKey,
  getYearMonthKey,
  monthRange,
  parseDateKey,
  todayKey,
} from "@/shared/lib/date-utils";
import { buildHomeAlerts, type HomeAlert } from "../domain/home-alerts";

/** Alertas do hub (tarefas, orçamento e hábitos). Lista vazia enquanto carrega. */
export function useHomeAlerts(): HomeAlert[] {
  const today = todayKey();
  const monthKey = getYearMonthKey(new Date());
  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const overdueRange = useMemo(
    () => ({
      from: formatDateKey(addDays(parseDateKey(today), -60)),
      to: formatDateKey(addDays(parseDateKey(today), -1)),
    }),
    [today]
  );

  const transactionsQuery = useTransactions(range);
  const categoriesQuery = useFinanceCategories();
  const habits = useHabitsSummary();
  const todayTasks = useTodayTasksSummary();
  const overdueQuery = useTasks(overdueRange);

  const tasks = useMemo(() => {
    if (!todayTasks || !overdueQuery.data) return null;
    return {
      pendingToday: todayTasks.total - todayTasks.completed,
      overdue: overdueQuery.data.filter((task) => !isCompleted(task)).length,
    };
  }, [todayTasks, overdueQuery.data]);

  return useMemo(() => {
    if (!transactionsQuery.data || !categoriesQuery.data) {
      return buildHomeAlerts({ habits, tasks });
    }

    const { items } = computeBudgetUsage(categoriesQuery.data, transactionsQuery.data);
    return buildHomeAlerts({ budgetItems: items, habits, tasks });
  }, [transactionsQuery.data, categoriesQuery.data, habits, tasks]);
}
