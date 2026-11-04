"use client";

import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatShortMonth } from "@/shared/lib/date-utils";
import { cn } from "@/shared/lib/utils";
import type { MonthTrendPoint } from "../domain/metrics";
import { formatBRL } from "../domain/money";

export function MonthlyTrend({
  points,
  activeMonthKey,
  onSelectMonth,
}: {
  points: MonthTrendPoint[];
  activeMonthKey: string;
  onSelectMonth?: (monthKey: string) => void;
}) {
  const maxBar = useMemo(() => {
    const peak = Math.max(0, ...points.flatMap((p) => [p.incomeCents, p.expenseCents]));
    return peak > 0 ? peak : 1;
  }, [points]);

  const hasActivity = points.some((p) => p.incomeCents > 0 || p.expenseCents > 0);
  if (!hasActivity) return null;

  return (
    <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-[#121020]/50 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Tendência dos últimos meses
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {points.map((point) => {
          const incomeH = Math.max(4, Math.round((point.incomeCents / maxBar) * 72));
          const expenseH = Math.max(4, Math.round((point.expenseCents / maxBar) * 72));
          const active = point.monthKey === activeMonthKey;
          const label = formatShortMonth(point.monthKey).split("/")[0];

          return (
            <button
              key={point.monthKey}
              type="button"
              onClick={() => onSelectMonth?.(point.monthKey)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl px-1.5 py-2 transition-colors cursor-pointer",
                active
                  ? "bg-brand/10 ring-1 ring-brand/30"
                  : "hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
              )}
              title={`${formatShortMonth(point.monthKey)} · entrou ${formatBRL(point.incomeCents)} · saiu ${formatBRL(point.expenseCents)} · ${point.savedCents >= 0 ? "sobrou" : "faltou"} ${formatBRL(Math.abs(point.savedCents))}`}
            >
              <div className="flex items-end gap-1 h-[76px]">
                <span
                  className="w-2.5 rounded-t-sm bg-emerald-500/80 dark:bg-emerald-400/70"
                  style={{ height: incomeH }}
                  aria-hidden
                />
                <span
                  className="w-2.5 rounded-t-sm bg-amber-500/80 dark:bg-amber-400/70"
                  style={{ height: expenseH }}
                  aria-hidden
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  active ? "text-brand" : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] font-bold",
                  point.savedCents >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {point.savedCents >= 0 ? "+" : "−"}
                {formatBRL(Math.abs(point.savedCents)).replace(/^R\$\s?/, "")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Entrou
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-amber-500/80" /> Saiu
        </span>
      </div>
    </section>
  );
}
