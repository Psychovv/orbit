"use client";

import React from "react";
import { GlowCard } from "@/components/magic/glow-card";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  Percent,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceStatsProps {
  totalIncome: number;
  dailyExpenses: number;
  creditCardExpenses: number;
  netBalance: number;
  incomeCount: number;
  dailyCount: number;
  cardCount: number;
}

export function FinanceStats({
  totalIncome,
  dailyExpenses,
  creditCardExpenses,
  netBalance,
  incomeCount,
  dailyCount,
  cardCount,
}: FinanceStatsProps) {
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const totalExpense = dailyExpenses + creditCardExpenses;
  const committedRate = totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0;
  const dailyRate = totalIncome > 0 ? (dailyExpenses / totalIncome) * 100 : 0;
  const cardRate = totalIncome > 0 ? (creditCardExpenses / totalIncome) * 100 : 0;
  const freeRate = totalIncome > 0 ? Math.max(0, 100 - committedRate) : 0;

  return (
    <div className="space-y-4">
      {/* 4 Cards: Saldo Livre, Receitas do Mês, Despesas do Dia a Dia, Fatura do Cartão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Livre do Mês */}
        <GlowCard glowColor="purple" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Saldo Livre
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
              <span>
                {totalIncome > 0 ? `${freeRate.toFixed(0)}% da renda livre` : "Disponível do mês"}
              </span>
            </p>
          </div>
        </GlowCard>

        {/* 2. Receitas do Mês (Entradas) */}
        <GlowCard glowColor="emerald" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Entradas do Mês
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
              {incomeCount} {incomeCount === 1 ? "entrada confirmada" : "entradas confirmadas"}
            </p>
          </div>
        </GlowCard>

        {/* 3. Despesas do Dia a Dia (Pix, Boleto, Dinheiro) */}
        <GlowCard glowColor="amber" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Despesas da Conta
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-800/40">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
              -{formatBRL(dailyExpenses)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {dailyCount} saídas (Pix, Boleto, Débito)
            </p>
          </div>
        </GlowCard>

        {/* 4. Fatura Prevista do Cartão de Crédito (Estilo Nubank) */}
        <GlowCard glowColor="purple" className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Fatura do Cartão
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#844DFE]/15 text-[#844DFE] dark:text-[#b494ff]">
                Prevista
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#844DFE]/10 dark:bg-[#844DFE]/20 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/30">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatBRL(creditCardExpenses)}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {cardCount} {cardCount === 1 ? "compra no cartão" : "compras no cartão"}
            </p>
          </div>
        </GlowCard>
      </div>

      {/* Planejamento Mensal Nubank Style: Barra de Comprometimento de Renda */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#844DFE]" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Divisão Mensal de Recursos
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500 dark:text-zinc-400">
              Comprometido:{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {formatBRL(totalExpense)} ({committedRate.toFixed(0)}%)
              </strong>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Livre:{" "}
              <strong className="text-[#844DFE] dark:text-[#b494ff]">
                {formatBRL(netBalance)} ({freeRate.toFixed(0)}%)
              </strong>
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-3 rounded-full overflow-hidden my-3 flex">
          {/* Despesas da Conta */}
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${Math.min(dailyRate, 100)}%` }}
            title={`Despesas da Conta: ${formatBRL(dailyExpenses)} (${dailyRate.toFixed(1)}%)`}
          />
          {/* Fatura do Cartão */}
          <div
            className="h-full bg-[#844DFE] transition-all duration-300"
            style={{ width: `${Math.min(cardRate, 100 - dailyRate)}%` }}
            title={`Fatura do Cartão: ${formatBRL(creditCardExpenses)} (${cardRate.toFixed(1)}%)`}
          />
          {/* Saldo Livre */}
          <div
            className="h-full bg-emerald-500/80 transition-all duration-300"
            style={{ width: `${freeRate}%` }}
            title={`Saldo Livre: ${formatBRL(netBalance)} (${freeRate.toFixed(1)}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Despesas da conta: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatBRL(dailyExpenses)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#844DFE]" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Fatura prevista do cartão: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatBRL(creditCardExpenses)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Saldo livre para guardar: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatBRL(netBalance)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
