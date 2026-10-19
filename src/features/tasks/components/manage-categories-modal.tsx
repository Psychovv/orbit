"use client";

import React, { useState } from "react";
import type {
  CreateTaskCategoryInput,
  TaskCategory,
  UpdateTaskCategoryInput,
} from "../domain/task.schema";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  onAddCategory: (category: CreateTaskCategoryInput) => void;
  onUpdateCategory: (id: string, patch: UpdateTaskCategoryInput) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_ICONS = ["🎸", "📚", "🎓", "⚡", "🚀", "🌿", "💻", "🎨", "🧘", "🎯", "🔬", "🪐"];

const PRESET_COLORS = [
  { name: "Orbit Violet", color: "#844DFE" },
  { name: "Azul Nebulosa", color: "#3b82f6" },
  { name: "Ciano Estelar", color: "#06b6d4" },
  { name: "Âmbar Solar", color: "#f59e0b" },
  { name: "Esmeralda", color: "#10b981" },
  { name: "Rosa Aurora", color: "#ec4899" },
];

export function ManageCategoriesModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Categorias de Tarefas"
      description="Renomeie, mude ícone e cor, ou crie novas categorias."
      className="max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Categorias ({categories.length})
          </label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                canDelete={categories.length > 1}
                onUpdate={(patch) => onUpdateCategory(cat.id, patch)}
                onDelete={() => onDeleteCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        <NewCategoryForm onCreate={onAddCategory} />
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
  category: TaskCategory;
  canDelete: boolean;
  onUpdate: (patch: UpdateTaskCategoryInput) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [confirming, setConfirming] = useState(false);
  const [editingLook, setEditingLook] = useState(false);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return setName(category.name);
    if (trimmed !== category.name) onUpdate({ name: trimmed });
  };

  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  if (confirming) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/60 bg-rose-500/5 px-3 py-2 dark:border-rose-900/60">
        <p className="text-xs text-zinc-700 dark:text-zinc-200">
          Excluir <strong>{category.name}</strong>? As tarefas ficam sem categoria.
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
    <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-white/60 px-2.5 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/30">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditingLook((v) => !v)}
          title="Alterar ícone e cor"
          aria-label={`Alterar aparência de ${category.name}`}
          aria-expanded={editingLook}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-base transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 cursor-pointer"
          style={{ boxShadow: `inset 0 -2px 0 ${category.color}` }}
        >
          {category.icon}
        </button>
        <input
          value={name}
          maxLength={60}
          aria-label={`Nome da categoria ${category.name}`}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={blurOnEnter}
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 dark:text-zinc-100 dark:hover:bg-zinc-800/60 dark:focus:bg-zinc-900"
        />
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!canDelete}
          title={canDelete ? "Excluir categoria" : "Mantenha ao menos uma categoria"}
          aria-label={`Excluir ${category.name}`}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-rose-950/30 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {editingLook ? (
        <div className="space-y-2 border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ICONS.map((icon) => (
              <button
                type="button"
                key={icon}
                onClick={() => onUpdate({ icon })}
                aria-pressed={category.icon === icon}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all cursor-pointer",
                  category.icon === icon
                    ? "scale-105 bg-brand text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((col) => (
              <button
                type="button"
                key={col.color}
                onClick={() => onUpdate({ color: col.color })}
                aria-label={col.name}
                aria-pressed={category.color === col.color}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform cursor-pointer",
                  category.color === col.color
                    ? "scale-110 border-white ring-2 ring-brand ring-offset-2 dark:ring-offset-[#110e20]"
                    : "border-transparent"
                )}
                style={{ backgroundColor: col.color }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NewCategoryForm({ onCreate }: { onCreate: (input: CreateTaskCategoryInput) => void }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      icon: selectedIcon,
      color: PRESET_COLORS[selectedColorIdx].color,
    });
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        <Plus className="w-4 h-4 text-brand" />
        <span>Nova Categoria</span>
      </div>

      <Input
        placeholder="Nome (ex: Guitarra, Faculdade, Academia)"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Ícone</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ICONS.map((icon) => (
            <button
              type="button"
              key={icon}
              onClick={() => setSelectedIcon(icon)}
              className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                selectedIcon === icon
                  ? "bg-brand text-white shadow-xs scale-105"
                  : "bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Cor de Destaque
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((col, idx) => (
            <button
              type="button"
              key={col.color}
              onClick={() => setSelectedColorIdx(idx)}
              className={`h-7 w-7 rounded-full transition-transform cursor-pointer border-2 ${
                selectedColorIdx === idx
                  ? "ring-2 ring-brand ring-offset-2 scale-110 border-white"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: col.color }}
              title={col.name}
            />
          ))}
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full">
        <Plus className="w-4 h-4" />
        Adicionar Categoria
      </Button>
    </form>
  );
}
