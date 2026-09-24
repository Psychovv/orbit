"use client";

import React, { useState } from "react";
import { Transaction, FinanceCategory, TransactionType } from "@/types/orbit";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  defaultDate?: string;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  categories,
  defaultDate,
  onAddTransaction,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<Transaction["paymentMethod"]>("pix");
  const [notes, setNotes] = useState("");

  const filteredCategories = categories.filter((c) => c.type === type);

  React.useEffect(() => {
    if (isOpen) {
      if (defaultDate) {
        setDate(defaultDate);
      }
      if (filteredCategories.length > 0 && (!categoryId || !filteredCategories.some((c) => c.id === categoryId))) {
        setCategoryId(filteredCategories[0].id);
      }
    }
  }, [isOpen, defaultDate, type, filteredCategories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(",", "."));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !categoryId) {
      return;
    }

    onAddTransaction({
      description: description.trim(),
      amount: parsedAmount,
      type,
      categoryId,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setDescription("");
    setAmountStr("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Transação"
      description="Lance uma nova despesa ou receita em seu cofre financeiro."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle: Despesa vs Receita */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              type === "expense"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-rose-500"
            )}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              type === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-500"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Receita</span>
          </button>
        </div>

        {/* Description */}
        <Input
          label="Descrição"
          placeholder="ex: Supermercado, Aluguel, Salário, Freela..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 pl-9 pr-3.5 py-2 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#844DFE]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#844DFE]/20"
              required
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-0.5">
            {filteredCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                  categoryId === cat.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-[#844DFE] ring-1 ring-[#844DFE]"
                    : "bg-white/60 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { id: "pix", label: "PIX" },
              { id: "cartao", label: "Cartão" },
              { id: "boleto", label: "Boleto" },
              { id: "transferencia", label: "Transf." },
              { id: "dinheiro", label: "Dinheiro" },
            ].map((pm) => (
              <button
                type="button"
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id as Transaction["paymentMethod"])}
                className={cn(
                  "py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer",
                  paymentMethod === pm.id
                    ? "bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border-[#844DFE]/30 font-bold"
                    : "bg-white/40 dark:bg-zinc-900/30 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                )}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Observações (Opcional)"
          placeholder="ex: Parcela 1 de 3, comprovante no app..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className={cn(
              type === "expense"
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
            )}
          >
            <Plus className="w-4 h-4" />
            Salvar Transação
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
