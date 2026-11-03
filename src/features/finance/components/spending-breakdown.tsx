"use client";

import React, { useMemo } from "react";
import type { FinanceCategory, Transaction } from "../domain/finance.schema";
import { computeSpendingBreakdown, type SpendSlice } from "../domain/metrics";
import { formatBRL } from "../domain/money";
import { GlowCard } from "@/shared/effects/glow-card";
import { Button } from "@/shared/ui/button";
import { Pencil, PieChart } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SpendingBreakdownProps {
  categories: FinanceCategory[];
  transactions: Transaction[];
  onEditBudgets: () => void;
}

export function SpendingBreakdown({ categories, transactions, onEditBudgets }: SpendingBreakdownProps) {
  const breakdown = useMemo(
    () => computeSpendingBreakdown(categories, transactions),
    [categories, transactions]
  );
  const { slices, totalBudgetCents, budgetedSpentCents } = breakdown;
  const insight = spendingInsight(slices);

  return (
    <GlowCard className="space-y-5 p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center dark:border-zinc-800/80">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
            <PieChart className="h-5 w-5 text-brand" />
            <span>Para onde foi</span>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {insight ?? "Os gastos do mês, do maior para o menor."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onEditBudgets} className="text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Tetos
          </Button>
          {totalBudgetCents > 0 ? (
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Nos tetos</div>
              <div className="font-mono text-sm font-bold text-brand dark:text-brand-soft">
                {formatBRL(budgetedSpentCents)} / {formatBRL(totalBudgetCents)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Nenhum gasto neste mês</p>
          <p className="max-w-xs text-xs text-zinc-400">
            Quando entrar uma despesa, ela aparece aqui. Um teto por categoria avisa antes de estourar.
          </p>
          <Button variant="secondary" size="sm" onClick={onEditBudgets}>
            Definir tetos
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {slices.map((slice) => (
            <SpendRow key={slice.id} slice={slice} />
          ))}
        </ul>
      )}
    </GlowCard>
  );
}

function SpendRow({ slice }: { slice: SpendSlice }) {
  const hasBudget = slice.budgetCents != null && slice.budgetCents > 0;
  const width = hasBudget ? Math.min(slice.ratio ?? 0, 100) : Math.min(slice.share, 100);
  const uncategorized = slice.id === "uncategorized";

  return (
    <li
      className={cn(
        "rounded-xl border px-4 py-3",
        slice.isOver
          ? "border-rose-400/80 bg-rose-500/5 dark:bg-rose-950/20"
          : slice.isWarning
            ? "border-amber-400/80 bg-amber-500/5 dark:bg-amber-950/20"
            : uncategorized
              ? "border-dashed border-zinc-300 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40"
              : "border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/30"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          <span aria-hidden>{slice.icon}</span>
          <span className="truncate">{slice.name}</span>
        </span>
        <span className="shrink-0 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {formatBRL(slice.spentCents)}
          {slice.spentCents > 0 ? (
            <span className="ml-1.5 text-[11px] font-medium text-zinc-400">{slice.share.toFixed(0)}%</span>
          ) : null}
        </span>
      </div>

      <div className="my-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
        <div
          className={cn("h-full rounded-full", slice.isOver && "bg-rose-500", slice.isWarning && "bg-amber-500")}
          style={{
            width: `${width}%`,
            backgroundColor: slice.isOver || slice.isWarning ? undefined : slice.color,
          }}
        />
      </div>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {hasBudget ? budgetCaption(slice) : uncategorized ? "Classifique pra entrar num teto." : "Sem teto definido."}
      </p>
    </li>
  );
}

function budgetCaption(slice: SpendSlice): string {
  const budget = slice.budgetCents ?? 0;
  if (slice.isOver) {
    return `Teto ${formatBRL(budget)} · passou ${formatBRL(slice.spentCents - budget)}`;
  }
  const left = budget - slice.spentCents;
  return `Teto ${formatBRL(budget)} · ${Math.round(slice.ratio ?? 0)}% · faltam ${formatBRL(left)}`;
}

function spendingInsight(slices: SpendSlice[]): string | null {
  const over = slices
    .filter((slice) => slice.isOver && slice.budgetCents != null)
    .sort(
      (a, b) => b.spentCents - (b.budgetCents ?? 0) - (a.spentCents - (a.budgetCents ?? 0))
    )[0];
  if (over && over.budgetCents != null) {
    return `${over.name} passou do teto em ${formatBRL(over.spentCents - over.budgetCents)}.`;
  }

  const loose = slices.find((slice) => slice.id === "uncategorized");
  if (loose) {
    return `${formatBRL(loose.spentCents)} ainda sem categoria. Classificar mostra o mês com mais clareza.`;
  }

  const top = slices.find((slice) => slice.spentCents > 0);
  if (top) {
    return `${top.name} foi o maior gasto: ${formatBRL(top.spentCents)} (${top.share.toFixed(0)}% do mês).`;
  }

  if (slices.length > 0) return "Nenhum gasto neste mês. Os tetos continuam valendo.";
  return null;
}
