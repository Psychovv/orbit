"use client";

import React from "react";
import { GlowCard } from "@/shared/effects/glow-card";
import type { MonthlyMetrics } from "../domain/metrics";
import { formatBRL } from "../domain/money";
import { formatShortDate } from "@/shared/lib/date-utils";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Clock3,
  Percent,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface CardStatementView {
  dueDate: string | null;
  closingDate: string | null;
  totalAmountCents: number;
}

export function FinanceStats({
  metrics,
  statement,
}: {
  metrics: MonthlyMetrics;
  statement?: CardStatementView | null;
}) {
  const {
    totalIncome,
    totalExpenses,
    netBalance,
    incomeCount,
    expenseCount,
    cardPurchases,
    accountExpenses,
    pendingCardCents,
    pendingCardCount,
  } = metrics;

  const expenseRate = totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0;
  const accountRate = totalIncome > 0 ? (accountExpenses / totalIncome) * 100 : 0;
  const cardRate = totalIncome > 0 ? (cardPurchases / totalIncome) * 100 : 0;
  const freeRate = totalIncome > 0 ? Math.max(0, 100 - expenseRate) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="purple" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Resultado do Mês
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand dark:text-brand-soft border border-brand/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2
              className={cn(
                "text-2xl sm:text-3xl font-black font-mono tracking-tight",
                netBalance >= 0
                  ? "text-brand dark:text-brand-soft"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {formatBRL(netBalance)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Entradas − saídas (mesmo critério do Meu Pluggy)
            </p>
          </div>
        </GlowCard>

        <GlowCard glowColor="emerald" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Entradas
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-800/40">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatBRL(totalIncome)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {incomeCount} {incomeCount === 1 ? "movimentação" : "movimentações"} · conta e cartão
            </p>
          </div>
        </GlowCard>

        <GlowCard glowColor="amber" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Saídas
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-800/40">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
              -{formatBRL(totalExpenses)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {expenseCount} {expenseCount === 1 ? "movimentação" : "movimentações"} · conta{" "}
              {formatBRL(accountExpenses)} · cartão {formatBRL(cardPurchases)}
            </p>
          </div>
        </GlowCard>

        <GlowCard glowColor="purple" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {pendingCardCents > 0 ? "Despesas Futuras" : "Fatura Fechada"}
              </span>
              {statement?.dueDate && pendingCardCents === 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand/15 text-brand dark:text-brand-soft">
                  Venc. {formatShortDate(statement.dueDate)}
                </span>
              ) : null}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border border-brand/30">
              {pendingCardCents > 0 ? <Clock3 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatBRL(pendingCardCents > 0 ? pendingCardCents : (statement?.totalAmountCents ?? 0))}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {pendingCardCents > 0
                ? `${pendingCardCount} compra${pendingCardCount === 1 ? "" : "s"} ainda na fatura aberta`
                : statement?.closingDate
                  ? `Fechou em ${formatShortDate(statement.closingDate)}`
                  : "Sem fatura importada neste mês"}
            </p>
          </div>
        </GlowCard>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-brand" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Divisão das saídas
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500 dark:text-zinc-400">
              Saídas:{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {formatBRL(totalExpenses)} ({expenseRate.toFixed(0)}%)
              </strong>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Resultado:{" "}
              <strong className="text-brand dark:text-brand-soft">
                {formatBRL(netBalance)} ({freeRate.toFixed(0)}%)
              </strong>
            </span>
          </div>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-3 rounded-full overflow-hidden my-3 flex">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${Math.min(accountRate, 100)}%` }}
            title={`Conta: ${formatBRL(accountExpenses)}`}
          />
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${Math.min(cardRate, 100 - accountRate)}%` }}
            title={`Cartão: ${formatBRL(cardPurchases)}`}
          />
          <div
            className="h-full bg-emerald-500/80 transition-all duration-300"
            style={{ width: `${freeRate}%` }}
            title={`Resultado: ${formatBRL(netBalance)}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Conta: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatBRL(accountExpenses)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Cartão: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatBRL(cardPurchases)}</strong>
              {pendingCardCents > 0 ? ` (${formatBRL(pendingCardCents)} pendente)` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Resultado:{" "}
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatBRL(netBalance)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
