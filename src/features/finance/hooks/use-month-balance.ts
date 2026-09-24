"use client";

import { useMemo } from "react";
import { getYearMonthKey, monthRange } from "@/shared/lib/date-utils";
import { netBalance } from "../domain/metrics";
import { useTransactions } from "./use-finance";

/** Saldo (receitas − despesas) do mês, em centavos. Padrão: mês atual. `null` enquanto carrega. */
export function useMonthBalance(monthKey = getYearMonthKey(new Date())): number | null {
  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const { data } = useTransactions(range);
  return data ? netBalance(data) : null;
}
