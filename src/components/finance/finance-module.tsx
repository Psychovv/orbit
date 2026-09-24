"use client";

import React, { useState, useMemo } from "react";
import { Transaction, FinanceCategory } from "@/types/orbit";
import { FinanceStats } from "./finance-stats";
import { BudgetBreakdown } from "./budget-breakdown";
import { TransactionsTable } from "./transactions-table";
import { AddTransactionModal } from "./add-transaction-modal";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ShieldCheck, Sparkles } from "lucide-react";

interface FinanceModuleProps {
  transactions: Transaction[];
  categories: FinanceCategory[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
}

export function FinanceModule({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction,
}: FinanceModuleProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Compute overall financial metrics
  const { totalIncome, totalExpense, netBalance, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      if (tx.type === "expense") expense += tx.amount;
    });

    const net = income - expense;
    const rate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: net,
      savingsRate: rate,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#844DFE]" />
              <span>Finanças</span>
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Saldo Positivo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Controle de fluxo de caixa, despesas, receitas e metas de economia.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="h-9.5 text-xs px-4">
          <Plus className="w-4 h-4" />
          <span>Nova Transação</span>
        </Button>
      </div>

      {/* 4 Metric Cards */}
      <FinanceStats
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        savingsRate={savingsRate}
      />

      {/* Budget Breakdown & Planning */}
      <BudgetBreakdown
        categories={categories}
        transactions={transactions}
      />

      {/* Transactions Table & History */}
      <TransactionsTable
        transactions={transactions}
        categories={categories}
        onDeleteTransaction={onDeleteTransaction}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAddTransaction={onAddTransaction}
      />
    </div>
  );
}
