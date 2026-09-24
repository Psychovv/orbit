"use client";

import { useMemo } from "react";
import { formatDateKey, isDateKey, parseDateKey, todayKey } from "@/shared/lib/date-utils";
import { buildHref, useSearchState } from "@/shared/lib/use-search-state";
import { ALL_CATEGORIES } from "../domain/task.selectors";

export type TasksViewMode = "week" | "month";

export const TASKS_PATH = "/tasks";

export function tasksHref(current: URLSearchParams | string, patch: { category?: string | null }): string {
  return buildHref(TASKS_PATH, current, {
    category: patch.category === ALL_CATEGORIES ? null : patch.category,
  });
}

/** Estado da tela de tarefas guardado na URL: `?view=month&date=2026-09-24&category=estudos`. */
export function useTasksViewState() {
  const { searchParams, update } = useSearchState();

  const view: TasksViewMode = searchParams.get("view") === "month" ? "month" : "week";
  const dateParam = searchParams.get("date");
  const baseDateKey = dateParam && isDateKey(dateParam) ? dateParam : todayKey();
  const baseDate = useMemo(() => parseDateKey(baseDateKey), [baseDateKey]);
  const categoryId = searchParams.get("category") ?? ALL_CATEGORIES;

  return {
    view,
    baseDate,
    categoryId,
    setView: (next: TasksViewMode) => update({ view: next === "week" ? null : next }),
    setBaseDate: (next: Date | null) => {
      const key = next ? formatDateKey(next) : null;
      update({ date: key === todayKey() ? null : key });
    },
    setCategory: (next: string) => update({ category: next === ALL_CATEGORIES ? null : next }),
    showWeekOf: (dateKey: string) => update({ view: null, date: dateKey === todayKey() ? null : dateKey }),
  };
}
