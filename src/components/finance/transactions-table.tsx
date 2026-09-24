"use client";

import React, { useState, useMemo } from "react";
import { Transaction, FinanceCategory } from "@/types/orbit";
import { GlowCard } from "@/components/magic/glow-card";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  CreditCard,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: FinanceCategory[];
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  categories,
  onDeleteTransaction,
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categoriesMap = useMemo(() => {
    const map = new Map<string, FinanceCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;
        if (categoryFilter !== "all" && tx.categoryId !== categoryFilter) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(term);
          const matchNotes = tx.notes?.toLowerCase().includes(term);
          if (!matchDesc && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, searchTerm]);

  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (isoDate: string) => {
    try {
      const [year, month, day] = isoDate.split("-");
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return `${day} ${months[parseInt(month, 10) - 1]}`;
    } catch {
      return isoDate;
    }
  };

  const paymentLabels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão",
    boleto: "Boleto",
    transferencia: "Transferência",
    dinheiro: "Dinheiro",
  };

  return (
    <GlowCard className="p-6 space-y-5">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#844DFE]" />
            <span>Extrato e Fluxo de Recursos</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {filteredTransactions.length} de {transactions.length} transações listadas
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#844DFE]/20 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                typeFilter === "all"
                  ? "bg-[#844DFE] text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setTypeFilter("income")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                typeFilter === "income"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-zinc-500 hover:text-emerald-500 dark:text-zinc-400"
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Receitas</span>
            </button>
            <button
              onClick={() => setTypeFilter("expense")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                typeFilter === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-zinc-500 hover:text-rose-500 dark:text-zinc-400"
              )}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Despesas</span>
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#844DFE]/20 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="py-3 px-4">Transação</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <p className="text-sm font-medium">Nenhuma transação encontrada</p>
                    <p className="text-xs mt-1">Ajuste os filtros ou cadastre um novo lançamento.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const cat = categoriesMap.get(tx.categoryId);
                  const isIncome = tx.type === "income";

                  return (
                    <tr
                      key={tx.id}
                      className="group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      {/* Description & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                              isIncome
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-400/30"
                            )}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                              {tx.description}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {tx.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        {cat ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Geral</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md">
                          <CreditCard className="w-3 h-3 text-zinc-400" />
                          <span>{paymentLabels[tx.paymentMethod] || tx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span
                          className={cn(
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {isIncome ? "+" : "-"} {formatBRL(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GlowCard>
  );
}
