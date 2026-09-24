"use client";

import React, { useState } from "react";
import type {
  CreateTransactionInput,
  FinanceCategory,
  PaymentMethod,
  TransactionType,
} from "../domain/finance.schema";
import { centsToInput, parseAmountInput } from "../domain/money";
import { Dialog } from "@/shared/ui/dialog";
import { Input, Textarea } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { todayKey } from "@/shared/lib/date-utils";
import { ArrowDownRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface TransactionFormDefaults {
  description?: string;
  amountCents?: number;
  type?: TransactionType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  defaults: TransactionFormDefaults;
  /** Identifica o formulário para remontar ao trocar de lançamento. */
  formKey?: string;
  mode?: "create" | "edit";
  onSubmit: (input: CreateTransactionInput) => void;
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: "pix", label: "PIX" },
  { id: "cartao", label: "Cartão" },
  { id: "boleto", label: "Boleto" },
  { id: "transferencia", label: "Transf." },
  { id: "dinheiro", label: "Dinheiro" },
];

export function AddTransactionModal({
  isOpen,
  onClose,
  categories,
  defaults,
  formKey = "create",
  mode = "create",
  onSubmit,
}: AddTransactionModalProps) {
  const editing = mode === "edit";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Editar Transação" : "Registrar Transação"}
      description={
        editing
          ? "Atualize os dados deste lançamento."
          : "Lance uma nova despesa ou receita em seu cofre financeiro."
      }
      className="max-w-lg"
    >
      <AddTransactionForm
        key={formKey}
        categories={categories}
        defaults={defaults}
        mode={mode}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

function firstCategoryOf(categories: FinanceCategory[], type: TransactionType, preferredId?: string) {
  const ofType = categories.filter((c) => c.type === type);
  return (ofType.find((c) => c.id === preferredId) ?? ofType[0])?.id ?? null;
}

function AddTransactionForm({
  categories,
  defaults,
  mode = "create",
  onClose,
  onSubmit,
}: Omit<AddTransactionModalProps, "isOpen" | "formKey">) {
  const [type, setType] = useState<TransactionType>(defaults.type ?? "expense");
  const [description, setDescription] = useState(defaults.description ?? "");
  const [amountStr, setAmountStr] = useState(
    defaults.amountCents !== undefined ? centsToInput(defaults.amountCents) : ""
  );
  const [categoryId, setCategoryId] = useState<string | null>(() =>
    firstCategoryOf(categories, defaults.type ?? "expense", defaults.categoryId)
  );
  const [date, setDate] = useState(defaults.date ?? todayKey());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaults.paymentMethod ?? "pix");
  const [notes, setNotes] = useState(defaults.notes ?? "");

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setCategoryId(firstCategoryOf(categories, next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseAmountInput(amountStr);
    if (!description.trim() || amountCents === null || !categoryId) return;

    onSubmit({
      description: description.trim(),
      amountCents,
      type,
      categoryId,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle: Despesa vs Receita */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
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
          onClick={() => handleTypeChange("income")}
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
              className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 pl-9 pr-3.5 py-2 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
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
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
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
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-brand ring-1 ring-brand"
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
          {PAYMENT_OPTIONS.map((pm) => (
            <button
              type="button"
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id)}
              className={cn(
                "py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer",
                paymentMethod === pm.id
                  ? "bg-brand/10 text-brand dark:text-brand-soft border-brand/30 font-bold"
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
          {mode === "edit" ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mode === "edit" ? "Salvar alterações" : "Salvar Transação"}
        </Button>
      </div>
    </form>
  );
}
