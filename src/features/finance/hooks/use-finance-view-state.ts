"use client";

import { getYearMonthKey, isYearMonthKey } from "@/shared/lib/date-utils";
import { useSearchState } from "@/shared/lib/use-search-state";

/** Mês exibido em Finanças, guardado na URL: `?month=2026-09`. */
export function useFinanceViewState() {
  const { searchParams, update } = useSearchState();
  const currentMonthKey = getYearMonthKey(new Date());
  const monthParam = searchParams.get("month");
  const monthKey = monthParam && isYearMonthKey(monthParam) ? monthParam : currentMonthKey;

  return {
    monthKey,
    isCurrentMonth: monthKey === currentMonthKey,
    setMonthKey: (next: string) => update({ month: next === currentMonthKey ? null : next }),
  };
}
