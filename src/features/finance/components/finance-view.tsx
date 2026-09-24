"use client";

import React, { useMemo, useState } from "react";
import { computeMonthlyMetrics } from "../domain/metrics";
import { toCents } from "../domain/money";
import {
  useCreateFinanceCategory,
  useCreateTransaction,
  useDeleteFinanceCategory,
  useDeleteTransactionWithUndo,
  useFinanceCategories,
  useTransactions,
  useUpdateFinanceCategory,
  useUpdateTransaction,
} from "../hooks/use-finance";
import type { Transaction } from "../domain/finance.schema";
import { useFinanceViewState } from "../hooks/use-finance-view-state";
import { useFinanceAssistant } from "../hooks/use-finance-assistant";
import { FinanceStats } from "./finance-stats";
import { BudgetBreakdown } from "./budget-breakdown";
import { TransactionsTable } from "./transactions-table";
import { AddTransactionModal, type TransactionFormDefaults } from "./add-transaction-modal";
import { ManageFinanceCategoriesModal } from "./manage-finance-categories-modal";
import { AssistantButton } from "@/features/assistant/components/assistant-button";
import { Button } from "@/shared/ui/button";
import { PeriodNavigator, pickerInputClass } from "@/shared/ui/period-navigator";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import {
  addMonths,
  formatMonthYear,
  getYearMonthKey,
  monthRange,
  parseYearMonthKey,
  todayKey,
} from "@/shared/lib/date-utils";
import { Plus, Wallet, ShieldCheck, AlertTriangle, SlidersHorizontal } from "lucide-react";

type TransactionDraft =
  | { mode: "create"; defaults: TransactionFormDefaults }
  | { mode: "edit"; transactionId: string; defaults: TransactionFormDefaults };

export function FinanceView() {
  const { monthKey, isCurrentMonth, setMonthKey } = useFinanceViewState();
  const [draft, setDraft] = useState<TransactionDraft | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const transactionsQuery = useTransactions(range);
  const categoriesQuery = useFinanceCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransactionWithUndo();
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const deleteCategory = useDeleteFinanceCategory();
  const runAssistant = useFinanceAssistant({
    onSingleDraft: ({ amount, ...next }) =>
      setDraft({
        mode: "create",
        defaults: { ...next, amountCents: amount !== undefined ? toCents(amount) : undefined },
      }),
  });

  const monthlyTransactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const categories = categoriesQuery.data ?? [];
  const metrics = useMemo(() => computeMonthlyMetrics(monthlyTransactions), [monthlyTransactions]);
  const currentMonthDate = parseYearMonthKey(monthKey);

  const shiftMonth = (delta: number) => setMonthKey(getYearMonthKey(addMonths(currentMonthDate, delta)));
  const openAddModal = () =>
    setDraft({ mode: "create", defaults: { date: isCurrentMonth ? todayKey() : `${monthKey}-01` } });
  const openEditModal = (tx: Transaction) =>
    setDraft({
      mode: "edit",
      transactionId: tx.id,
      defaults: {
        description: tx.description,
        amountCents: tx.amountCents,
        type: tx.type,
        categoryId: tx.categoryId ?? undefined,
        date: tx.date,
        paymentMethod: tx.paymentMethod,
        notes: tx.notes,
      },
    });

  if (transactionsQuery.isPending || categoriesQuery.isPending) return <ViewSkeleton />;

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand" />
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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoriesOpen(true)}
            className="h-9.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>
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

      <PeriodNavigator
        label={formatMonthYear(currentMonthDate)}
        prevTitle="Mês anterior"
        nextTitle="Próximo mês"
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        isCurrent={isCurrentMonth}
        resetLabel="Mês atual"
        currentLabel="Mês vigente"
        onReset={() => setMonthKey(getYearMonthKey(new Date()))}
      >
        <input
          type="month"
          value={monthKey}
          onChange={(e) => {
            if (e.target.value) setMonthKey(e.target.value);
          }}
          title="Selecionar mês específico"
          aria-label="Selecionar mês específico"
          className={pickerInputClass}
        />
      </PeriodNavigator>

      {/* 4 Metric Cards & Nubank Monthly Planning Breakdown */}
      <FinanceStats metrics={metrics} />

      {/* Budget Breakdown & Planning for the selected month */}
      <BudgetBreakdown
        categories={categories}
        transactions={monthlyTransactions}
        onEditBudgets={() => setIsCategoriesOpen(true)}
      />

      {/* Transactions Table & History for the selected month */}
      <TransactionsTable
        transactions={monthlyTransactions}
        categories={categories}
        onEditTransaction={openEditModal}
        onDeleteTransaction={deleteTransaction}
      />

      <AddTransactionModal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        categories={categories}
        defaults={draft?.defaults ?? {}}
        formKey={draft?.mode === "edit" ? draft.transactionId : "create"}
        mode={draft?.mode ?? "create"}
        onSubmit={(input) => {
          if (draft?.mode === "edit") {
            updateTransaction.mutate({
              id: draft.transactionId,
              patch: { ...input, notes: input.notes ?? null },
            });
            return;
          }
          createTransaction.mutate(input);
        }}
      />

      <ManageFinanceCategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onCreate={(input) => createCategory.mutate(input)}
        onUpdate={(id, patch) => updateCategory.mutate({ id, patch })}
        onDelete={(id) => deleteCategory.mutate(id)}
      />
    </div>
  );
}
