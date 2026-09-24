"use client";

import React from "react";
import type { FinanceCategory, Transaction } from "../domain/finance.schema";
import { computeBudgetUsage } from "../domain/metrics";
import { formatBRL } from "../domain/money";
import { GlowCard } from "@/shared/effects/glow-card";
import { Target, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface BudgetBreakdownProps {
  categories: FinanceCategory[];
  transactions: Transaction[];
}

export function BudgetBreakdown({ categories, transactions }: BudgetBreakdownProps) {
  const { items, totalBudgetCents, totalSpentCents, totalProgress } = computeBudgetUsage(categories, transactions);

  return (
    <GlowCard className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#844DFE]" />
            <span>Planejamento Orçamentário por Categoria</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acompanhe o teto de gastos estipulado para cada área.
          </p>
        </div>

        {/* Total Budget Summary Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Planejado</div>
            <div className="text-sm font-mono font-bold text-[#844DFE] dark:text-[#b494ff]">
              {formatBRL(totalSpentCents)} / {formatBRL(totalBudgetCents)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-[#844DFE] dark:text-[#b494ff]">
            {Math.round(totalProgress)}%
          </div>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ category: cat, spentCents, budgetCents, ratio, isOver, isWarning }) => (
          <div
            key={cat.id}
            className={cn(
              "rounded-xl p-4 border transition-all duration-200",
              "bg-white/70 dark:bg-zinc-900/30",
              isOver
                ? "border-rose-400/80 bg-rose-500/5 dark:bg-rose-950/20"
                : isWarning
                ? "border-amber-400/80 bg-amber-500/5 dark:bg-amber-950/20"
                : "border-zinc-200/80 dark:border-zinc-800/80"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat.icon}</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{cat.name}</span>
              </div>
              {isOver ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Excedido
                </span>
              ) : (
                <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                  {Math.round(ratio)}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden my-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-[#844DFE]"
                )}
                style={{ width: `${Math.min(ratio, 100)}%` }}
              />
            </div>

            {/* Spent / Target Info */}
            <div className="flex items-center justify-between text-xs font-mono mt-2">
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{formatBRL(spentCents)}</span>
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">de {formatBRL(budgetCents)}</span>
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}
