"use client";

import React, { useState } from "react";
import { TaskCategory } from "@/types/orbit";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Tag } from "lucide-react";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  onAddCategory: (category: TaskCategory) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_ICONS = ["🎸", "📚", "🎓", "⚡", "🚀", "🌿", "💻", "🎨", "🧘", "🎯", "🔬", "🪐"];

const PRESET_COLORS = [
  { name: "Orbit Violet", color: "#844DFE", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
  { name: "Azul Nebulosa", color: "#3b82f6", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
  { name: "Ciano Estelar", color: "#06b6d4", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
  { name: "Âmbar Solar", color: "#f59e0b", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
  { name: "Esmeralda", color: "#10b981", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
  { name: "Rosa Aurora", color: "#ec4899", bgLight: "bg-zinc-100", bgDark: "dark:bg-zinc-800/80", textLight: "text-zinc-700", textDark: "dark:text-zinc-300", borderLight: "border-zinc-200", borderDark: "dark:border-zinc-700/60" },
];

export function ManageCategoriesModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenColor = PRESET_COLORS[selectedColorIdx];
    const newCategory: TaskCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      icon: selectedIcon,
      color: chosenColor.color,
      bgLight: chosenColor.bgLight,
      bgDark: chosenColor.bgDark,
      textLight: chosenColor.textLight,
      textDark: chosenColor.textDark,
      borderLight: chosenColor.borderLight,
      borderDark: chosenColor.borderDark,
    };

    onAddCategory(newCategory);
    setName("");
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Categorias de Tarefas"
      description="Gerencie as categorias para rotular suas tarefas de forma discreta."
      className="max-w-md"
    >
      <div className="space-y-5">
        {/* Existing Categories */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Categorias ({categories.length})
          </label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {categories.length > 1 && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="ml-1 opacity-60 hover:opacity-100 hover:text-rose-500 transition-opacity cursor-pointer"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleSubmit} className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            <Plus className="w-4 h-4 text-[#844DFE]" />
            <span>Nova Categoria</span>
          </div>

          <Input
            placeholder="Nome (ex: Guitarra, Faculdade, Academia)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Select Icon */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Ícone
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                    selectedIcon === icon
                      ? "bg-[#844DFE] text-white shadow-xs scale-105"
                      : "bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Select Color */}
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
                    selectedColorIdx === idx ? "ring-2 ring-[#844DFE] ring-offset-2 scale-110 border-white" : "border-transparent"
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
      </div>
    </Dialog>
  );
}
