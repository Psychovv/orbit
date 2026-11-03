"use client";

import React from "react";
import { GlowCard } from "@/shared/effects/glow-card";
import type { MonthlyMetrics } from "../domain/metrics";
import { formatBRL } from "../domain/money";
import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface MonthPace {
  day: number;
  days: number;
  dailyCents: number;
  projectedCents: number;
}

export function FinanceStats({
  metrics,
  monthLabel,
  pace,
}: {
  metrics: MonthlyMetrics;
  /** Ex.: "outubro de 2026". */
  monthLabel: string;
  /** Ritmo do mês vigente. Ausente ao olhar um mês passado ou sem gastos. */
  pace?: MonthPace | null;
}) {
  const { incomeCents, expenseCents, savedCents, savingsRate, cardSpendCents, accountSpendCents, pendingCardCents, billPaymentCents } =
    metrics;

  const spentShare = incomeCents > 0 ? Math.min(100, (expenseCents / incomeCents) * 100) : expenseCents > 0 ? 100 : 0;
  const savedShare = incomeCents > 0 ? Math.max(0, 100 - spentShare) : 0;
  const overspent = savedCents < 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlowCard glowColor="emerald" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Entrou
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <h2 className="mt-3 font-mono text-2xl font-black tracking-tight text-emerald-600 sm:text-3xl dark:text-emerald-400">
            {formatBRL(incomeCents)}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {metrics.incomeCount === 0
              ? `Nenhuma receita em ${monthLabel}`
              : `${metrics.incomeCount} ${metrics.incomeCount === 1 ? "entrada" : "entradas"} em ${monthLabel}`}
          </p>
        </GlowCard>

        <GlowCard glowColor="amber" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Foi gasto
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/10 text-amber-600 dark:border-amber-800/40 dark:bg-amber-500/20 dark:text-amber-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <h2 className="mt-3 font-mono text-2xl font-black tracking-tight text-amber-600 sm:text-3xl dark:text-amber-400">
            {formatBRL(expenseCents)}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Conta {formatBRL(accountSpendCents)} · cartão {formatBRL(cardSpendCents)}
            {pendingCardCents > 0 ? ` · ${formatBRL(pendingCardCents)} ainda não fechou na fatura` : ""}
          </p>
        </GlowCard>

        <GlowCard glowColor={overspent ? "rose" : "emerald"} className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {overspent ? "Faltou" : "Sobrou"}
            </span>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border",
                overspent
                  ? "border-rose-300/40 bg-rose-500/10 text-rose-600 dark:border-rose-800/40 dark:bg-rose-500/20 dark:text-rose-400"
                  : "border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-500/20 dark:text-emerald-400"
              )}
            >
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <h2
            className={cn(
              "mt-3 font-mono text-2xl font-black tracking-tight sm:text-3xl",
              overspent ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatBRL(Math.abs(savedCents))}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{savedCaption(metrics, monthLabel)}</p>
        </GlowCard>
      </div>

      {incomeCents > 0 || expenseCents > 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-2xs backdrop-blur-md sm:p-5 dark:border-zinc-800/80 dark:bg-[#100e1e]/70">
          <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
              Quanto da receita virou gasto
            </h3>
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {incomeCents > 0
                ? overspent
                  ? `Gastou ${((expenseCents / incomeCents) * 100).toFixed(0)}% da receita`
                  : `${spentShare.toFixed(0)}% gasto · ${(savingsRate ?? 0).toFixed(0)}% guardado`
                : "Sem receita neste mês"}
            </p>
          </div>

          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
            <div
              className={cn("h-full transition-all duration-300", overspent ? "bg-rose-500" : "bg-amber-500")}
              style={{ width: `${spentShare}%` }}
            />
            {savedShare > 0 ? (
              <div className="h-full bg-emerald-500/80 transition-all duration-300" style={{ width: `${savedShare}%` }} />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", overspent ? "bg-rose-500" : "bg-amber-500")} />
              Gasto {formatBRL(expenseCents)}
            </span>
            {!overspent && incomeCents > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Guardado {formatBRL(savedCents)}
              </span>
            ) : null}
            {billPaymentCents > 0 ? (
              <span>Fatura paga ({formatBRL(billPaymentCents)}) fica de fora: a compra já entrou no dia dela.</span>
            ) : null}
          </div>

          {pace && pace.day < pace.days ? (
            <p className="mt-3 flex items-start gap-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-300">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <span>
                Dia {pace.day} de {pace.days} · cerca de {formatBRL(pace.dailyCents)} por dia. Nesse ritmo o mês fecha
                em {formatBRL(pace.projectedCents)} de gastos
                {incomeCents > 0 && pace.projectedCents > incomeCents
                  ? `, ${formatBRL(pace.projectedCents - incomeCents)} acima do que entrou`
                  : ""}
                .
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function savedCaption(metrics: MonthlyMetrics, monthLabel: string): string {
  if (metrics.incomeCents > 0 && metrics.savingsRate != null && metrics.savedCents >= 0) {
    return `Guardou ${metrics.savingsRate.toFixed(0)}% do que entrou em ${monthLabel}`;
  }
  if (metrics.incomeCents > 0 && metrics.savedCents < 0) {
    return `Gastou ${formatBRL(-metrics.savedCents)} a mais do que entrou`;
  }
  if (metrics.expenseCents > 0) return "Sem receita lançada neste mês";
  return `Nada lançado em ${monthLabel}`;
}
