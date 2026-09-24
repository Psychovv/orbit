"use client";

import React, { useMemo, useState } from "react";
import { computeMonthlyMetrics } from "../domain/metrics";
import { toCents } from "../domain/money";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useFinanceCategories,
  useTransactions,
} from "../hooks/use-finance";
import { useFinanceViewState } from "../hooks/use-finance-view-state";
import { useFinanceAssistant } from "../hooks/use-finance-assistant";
import { FinanceStats } from "./finance-stats";
import { BudgetBreakdown } from "./budget-breakdown";
import { TransactionsTable } from "./transactions-table";
import { AddTransactionModal, type TransactionFormDefaults } from "./add-transaction-modal";
import { AssistantButton } from "@/features/assistant/components/assistant-button";
import { Button } from "@/shared/ui/button";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import {
  addMonths,
  formatMonthYear,
  getYearMonthKey,
  monthRange,
  parseYearMonthKey,
  todayKey,
} from "@/shared/lib/date-utils";
import {
  Plus,
  Wallet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export function FinanceView() {
  const { monthKey, isCurrentMonth, setMonthKey } = useFinanceViewState();
  const [modalDefaults, setModalDefaults] = useState<TransactionFormDefaults | null>(null);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const transactionsQuery = useTransactions(range);
  const categoriesQuery = useFinanceCategories();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const runAssistant = useFinanceAssistant({
    onSingleDraft: ({ amount, ...draft }) =>
      setModalDefaults({ ...draft, amountCents: amount !== undefined ? toCents(amount) : undefined }),
  });

  const monthlyTransactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const categories = categoriesQuery.data ?? [];
  const metrics = useMemo(() => computeMonthlyMetrics(monthlyTransactions), [monthlyTransactions]);
  const currentMonthDate = parseYearMonthKey(monthKey);

  const shiftMonth = (delta: number) => setMonthKey(getYearMonthKey(addMonths(currentMonthDate, delta)));
  const openAddModal = () => setModalDefaults({ date: isCurrentMonth ? todayKey() : `${monthKey}-01` });

  if (transactionsQuery.isPending || categoriesQuery.isPending) return <ViewSkeleton />;

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#844DFE]" />
              <span>Planejamento Financeiro</span>
            </h2>
            {metrics.netBalance >= 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Saldo Positivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-400/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                Déficit no Mês
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestão mensal de receitas, despesas do dia a dia e fatura de cartão de crédito.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AssistantButton
            title="Orbit AI - Finanças"
            placeholder="Ex: Gastei 45 no McDonald's no cartão..."
            onSubmit={runAssistant}
          />
          <Button variant="primary" onClick={openAddModal} className="h-9.5 text-xs px-4">
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </Button>
        </div>
      </div>

      {/* Month Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
        {/* Navigation arrows & Current Month Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-0.5">
            <button
              onClick={() => shiftMonth(-1)}
              title="Mês anterior"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shiftMonth(1)}
              title="Próximo mês"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <Calendar className="w-4 h-4 text-[#844DFE]" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatMonthYear(currentMonthDate)}
            </span>
          </div>
        </div>

        {/* Quick Return to Current Month & Month Picker Jump */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isCurrentMonth && (
            <button
              onClick={() => setMonthKey(getYearMonthKey(new Date()))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#844DFE]/10 hover:bg-[#844DFE]/20 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/30 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mês Atual</span>
            </button>
          )}

          {isCurrentMonth && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50">
              Mês Vigente
            </span>
          )}

          {/* Jump to specific month input */}
          <div className="relative flex items-center">
            <input
              type="month"
              value={monthKey}
              onChange={(e) => {
                if (e.target.value) setMonthKey(e.target.value);
              }}
              title="Selecionar mês específico"
              className="text-xs font-mono px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#844DFE] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4 Metric Cards & Nubank Monthly Planning Breakdown */}
      <FinanceStats metrics={metrics} />

      {/* Budget Breakdown & Planning for the selected month */}
      <BudgetBreakdown categories={categories} transactions={monthlyTransactions} />

      {/* Transactions Table & History for the selected month */}
      <TransactionsTable
        transactions={monthlyTransactions}
        categories={categories}
        onDeleteTransaction={(id) => deleteTransaction.mutate(id)}
      />

      <AddTransactionModal
        isOpen={modalDefaults !== null}
        onClose={() => setModalDefaults(null)}
        categories={categories}
        defaults={modalDefaults ?? {}}
        onSubmit={(input) => createTransaction.mutate(input)}
      />
    </div>
  );
}
