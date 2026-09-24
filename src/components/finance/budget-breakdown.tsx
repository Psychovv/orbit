"use client";

import React from "react";
import { FinanceCategory, Transaction } from "@/types/orbit";
import { GlowCard } from "@/components/magic/glow-card";
import { Target, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetBreakdownProps {
  categories: FinanceCategory[];
  transactions: Transaction[];
}

export function BudgetBreakdown({ categories, transactions }: BudgetBreakdownProps) {
  // Filter only expense categories with a defined monthly budget
  const budgetedCategories = categories.filter(
    (c) => c.type === "expense" && c.monthlyBudget && c.monthlyBudget > 0
  );

  // Calculate total spent per category
  const categorySpentMap = new Map<string, number>();
  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const current = categorySpentMap.get(tx.categoryId) || 0;
      categorySpentMap.set(tx.categoryId, current + tx.amount);
    });

  const totalBudgeted = budgetedCategories.reduce((acc, c) => acc + (c.monthlyBudget || 0), 0);
  const totalBudgetSpent = budgetedCategories.reduce(
    (acc, c) => acc + (categorySpentMap.get(c.id) || 0),
    0
  );
  const totalProgress = totalBudgeted > 0 ? (totalBudgetSpent / totalBudgeted) * 100 : 0;

  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

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
              {formatBRL(totalBudgetSpent)} / {formatBRL(totalBudgeted)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-[#844DFE] dark:text-[#b494ff]">
            {Math.round(totalProgress)}%
          </div>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetedCategories.map((cat) => {
          const spent = categorySpentMap.get(cat.id) || 0;
          const budget = cat.monthlyBudget || 0;
          const ratio = (spent / budget) * 100;
          const isOver = spent > budget;
          const isWarning = ratio >= 80 && !isOver;

          return (
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
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {cat.name}
                  </span>
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
                    isOver
                      ? "bg-rose-500"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-[#844DFE]"
                  )}
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>

              {/* Spent / Target Info */}
              <div className="flex items-center justify-between text-xs font-mono mt-2">
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {formatBRL(spent)}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                  de {formatBRL(budget)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlowCard>
  );
}
