"use client";

import React from "react";
import { GlowCard } from "@/components/magic/glow-card";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceStatsProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
}

export function FinanceStats({
  totalIncome,
  totalExpense,
  netBalance,
  savingsRate,
}: FinanceStatsProps) {
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Líquido Total */}
      <GlowCard glowColor="purple" className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Saldo Atual
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h2
            className={cn(
              "text-2xl sm:text-3xl font-black font-mono tracking-tight",
              netBalance >= 0
                ? "text-[#844DFE] dark:text-[#b494ff]"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {formatBRL(netBalance)}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Patrimônio operacional do mês</span>
          </p>
        </div>
      </GlowCard>

      {/* Receitas */}
      <GlowCard glowColor="emerald" className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Total de Receitas
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
            Entradas confirmadas
          </p>
        </div>
      </GlowCard>

      {/* Despesas */}
      <GlowCard glowColor="rose" className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Total de Despesas
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300/40 dark:border-rose-800/40">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
            -{formatBRL(totalExpense)}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Saídas contabilizadas
          </p>
        </div>
      </GlowCard>

      {/* Taxa de Poupança */}
      <GlowCard glowColor="cyan" className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Taxa de Economia
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-300/40 dark:border-cyan-800/40">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
            {savingsRate.toFixed(1)}%
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Da renda retida este mês
          </p>
        </div>
      </GlowCard>
    </div>
  );
}
