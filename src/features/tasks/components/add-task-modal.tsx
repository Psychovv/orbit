"use client";

import React, { useState } from "react";
import type { CreateTaskInput, Priority, TaskCategory } from "../domain/task.schema";
import { WEEK_DAYS } from "../domain/week-days";
import { Dialog } from "@/shared/ui/dialog";
import { Input, Textarea } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { type DayOfWeek, getDayOfWeek, getWeekDays, parseDateKey, todayKey } from "@/shared/lib/date-utils";
import { Plus, Clock, Flag, Calendar } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface TaskFormDefaults {
  date?: string;
  title?: string;
  time?: string;
  categoryId?: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  defaults: TaskFormDefaults;
  onSubmit: (input: CreateTaskInput) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "baixa", label: "Baixa", color: "text-blue-500 bg-blue-500/10 border-blue-300 dark:border-blue-800" },
  { value: "media", label: "Média", color: "text-amber-500 bg-amber-500/10 border-amber-300 dark:border-amber-800" },
  { value: "alta", label: "Alta", color: "text-rose-500 bg-rose-500/10 border-rose-300 dark:border-rose-800" },
];

export function AddTaskModal({ isOpen, onClose, categories, defaults, onSubmit }: AddTaskModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Tarefa"
      description="Agende uma tarefa ou compromisso para a sua semana."
      className="max-w-lg"
    >
      <AddTaskForm categories={categories} defaults={defaults} onClose={onClose} onSubmit={onSubmit} />
    </Dialog>
  );
}

function AddTaskForm({
  categories,
  defaults,
  onClose,
  onSubmit,
}: Omit<AddTaskModalProps, "isOpen">) {
  const [title, setTitle] = useState(defaults.title ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaults.date ?? todayKey());
  const [categoryId, setCategoryId] = useState<string | null>(
    defaults.categoryId && categories.some((c) => c.id === defaults.categoryId)
      ? defaults.categoryId
      : categories[0]?.id ?? null
  );
  const [priority, setPriority] = useState<Priority>("media");
  const [time, setTime] = useState(defaults.time ?? "");

  const day = getDayOfWeek(date);

  const handleDaySelect = (dayKey: DayOfWeek) => {
    const matched = getWeekDays(parseDateKey(date)).find((wd) => wd.dayOfWeek === dayKey);
    if (matched) setDate(matched.date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (categories.length > 0 && !categoryId)) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time: time || undefined,
      categoryId,
      priority,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        label="Título"
        placeholder="ex: Treinar guitarra, ler artigo, estudar..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />

      {/* Date & Day of Week Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#844DFE]" /> Data da Tarefa
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#844DFE] cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_DAYS.map((wd) => (
            <button
              type="button"
              key={wd.key}
              onClick={() => handleDaySelect(wd.key)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                day === wd.key
                  ? "bg-[#844DFE] text-white border-[#844DFE] shadow-sm shadow-[#844DFE]/30"
                  : "bg-white/70 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              )}
            >
              <span>{wd.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border",
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

      {/* Priority & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5" /> Prioridade
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center",
                  priority === opt.value
                    ? `${opt.color} ring-1 ring-[#844DFE]/40 font-bold`
                    : "bg-white/40 dark:bg-zinc-900/30 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Horário (Opcional)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#844DFE]/20"
          />
        </div>
      </div>

      {/* Notes / Description */}
      <Textarea
        label="Observações (Opcional)"
        placeholder="ex: Focar em metrônomo a 120bpm, ler 20 páginas..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          <Plus className="w-4 h-4" />
          Adicionar Tarefa
        </Button>
      </div>
    </form>
  );
}
