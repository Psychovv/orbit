"use client";

import React, { useState } from "react";
import type {
  CreateFinanceCategoryInput,
  FinanceCategory,
  TransactionType,
  UpdateFinanceCategoryInput,
} from "../domain/finance.schema";
import { centsToInput, parseAmountInput } from "../domain/money";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { ArrowDownRight, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ManageFinanceCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  onCreate: (input: CreateFinanceCategoryInput) => void;
  onUpdate: (id: string, patch: UpdateFinanceCategoryInput) => void;
  onDelete: (id: string) => void;
}

const PRESET_ICONS = ["🏠", "🍔", "🛒", "🚗", "💊", "🎮", "📚", "👕", "✈️", "💡", "📱", "💰", "💼", "📈", "🎁", "🐾"];

const PRESET_COLORS = ["#844DFE", "#3b82f6", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#ef4444", "#64748b"];

const TYPE_OPTIONS = [
  {
    value: "expense",
    label: "Despesas",
    icon: ArrowDownRight,
    activeClassName: "bg-rose-500 text-white shadow-xs",
    hoverClassName: "hover:text-rose-500",
  },
  {
    value: "income",
    label: "Receitas",
    icon: ArrowUpRight,
    activeClassName: "bg-emerald-500 text-white shadow-xs",
    hoverClassName: "hover:text-emerald-500",
  },
] as const;

export function ManageFinanceCategoriesModal({
  isOpen,
  onClose,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: ManageFinanceCategoriesModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const ofType = categories.filter((c) => c.type === type);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Categorias e Tetos de Gasto"
      description="Renomeie, defina o teto mensal ou crie novas categorias."
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5">
        <SegmentedControl label="Tipo de categoria" value={type} options={TYPE_OPTIONS} onChange={setType} />

        <div className="space-y-2">
          {type === "expense" && (
            <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Categoria</span>
              <span className="pr-10">Teto mensal</span>
            </div>
          )}
          {ofType.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              canDelete={ofType.length > 1}
              onUpdate={(patch) => onUpdate(category.id, patch)}
              onDelete={() => onDelete(category.id)}
            />
          ))}
        </div>

        <NewCategoryForm key={type} type={type} onCreate={onCreate} />
      </div>
    </Dialog>
  );
}

function CategoryRow({
  category,
  canDelete,
  onUpdate,
  onDelete,
}: {
  category: FinanceCategory;
  canDelete: boolean;
  onUpdate: (patch: UpdateFinanceCategoryInput) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [budget, setBudget] = useState(
    category.monthlyBudgetCents !== undefined ? centsToInput(category.monthlyBudgetCents) : ""
  );
  const [confirming, setConfirming] = useState(false);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return setName(category.name);
    if (trimmed !== category.name) onUpdate({ name: trimmed });
  };

  const commitBudget = () => {
    if (!budget.trim()) {
      if (category.monthlyBudgetCents !== undefined) onUpdate({ monthlyBudgetCents: null });
      return;
    }
    const cents = parseAmountInput(budget);
    if (cents === null) {
      setBudget(category.monthlyBudgetCents !== undefined ? centsToInput(category.monthlyBudgetCents) : "");
      return;
    }
    if (cents !== category.monthlyBudgetCents) onUpdate({ monthlyBudgetCents: cents });
  };

  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  if (confirming) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/60 bg-rose-500/5 px-3 py-2 dark:border-rose-900/60">
        <p className="text-xs text-zinc-700 dark:text-zinc-200">
          Excluir <strong>{category.name}</strong>? Os lançamentos ficam sem categoria.
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Não
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/60 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="text-base">{category.icon}</span>
      <input
        value={name}
        maxLength={60}
        aria-label={`Nome da categoria ${category.name}`}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={blurOnEnter}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 dark:text-zinc-100 dark:hover:bg-zinc-800/60 dark:focus:bg-zinc-900"
      />
      {category.type === "expense" && (
        <div className="relative w-28 shrink-0">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400">
            R$
          </span>
          <input
            inputMode="decimal"
            value={budget}
            placeholder="Sem teto"
            aria-label={`Teto mensal de ${category.name}`}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={commitBudget}
            onKeyDown={blurOnEnter}
            className="h-8 w-full rounded-lg border border-zinc-200 bg-white/70 pl-7 pr-2 text-right font-mono text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={!canDelete}
        title={canDelete ? "Excluir categoria" : "Mantenha ao menos uma categoria deste tipo"}
        aria-label={`Excluir ${category.name}`}
        className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-rose-950/30 cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NewCategoryForm({
  type,
  onCreate,
}: {
  type: TransactionType;
  onCreate: (input: CreateFinanceCategoryInput) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [budget, setBudget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const budgetCents = type === "expense" && budget.trim() ? parseAmountInput(budget) : null;
    if (type === "expense" && budget.trim() && budgetCents === null) return;
    onCreate({
      name: name.trim(),
      type,
      icon,
      color,
      ...(budgetCents ? { monthlyBudgetCents: budgetCents } : {}),
    });
    setName("");
    setBudget("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        <Plus className="h-4 w-4 text-brand" />
        <span>Nova categoria de {type === "expense" ? "despesa" : "receita"}</span>
      </div>

      <div className={cn("grid gap-3", type === "expense" && "sm:grid-cols-[1fr_9rem]")}>
        <Input
          placeholder={type === "expense" ? "Nome (ex: Pets, Academia)" : "Nome (ex: Freela, Dividendos)"}
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {type === "expense" && (
          <Input
            inputMode="decimal"
            placeholder="Teto (opcional)"
            aria-label="Teto mensal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        )}
      </div>

      <div>
        <p className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ícone</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ICONS.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => setIcon(preset)}
              aria-pressed={icon === preset}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all cursor-pointer",
                icon === preset
                  ? "scale-105 bg-brand text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Cor</p>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => setColor(preset)}
              aria-label={`Cor ${preset}`}
              aria-pressed={color === preset}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform cursor-pointer",
                color === preset ? "scale-110 border-white ring-2 ring-brand ring-offset-2 dark:ring-offset-[#110e20]" : "border-transparent"
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full">
        <Plus className="h-4 w-4" />
        Adicionar categoria
      </Button>
    </form>
  );
}
