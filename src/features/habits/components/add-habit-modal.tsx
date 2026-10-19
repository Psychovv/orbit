"use client";

import React, { useState } from "react";
import {
  CreateHabitSchema,
  HABIT_COLOR_PRESETS,
  HABIT_FREQUENCY_LABELS,
  HABIT_ICON_PRESETS,
  HABIT_PERIOD_LABELS,
  WEEKDAY_LABELS,
  type CreateHabitInput,
  type Habit,
  type HabitFrequencyType,
  type HabitPeriod,
  type HabitType,
  type Weekday,
} from "../domain/habit.schema";
import { Dialog } from "@/shared/ui/dialog";
import { Input, Textarea } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  habit?: Habit | null;
  onSubmit: (input: CreateHabitInput) => void;
}

export function AddHabitModal({
  isOpen,
  onClose,
  mode = "create",
  habit = null,
  onSubmit,
}: AddHabitModalProps) {
  const editing = mode === "edit";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Editar Hábito" : "Novo Hábito"}
      description={
        editing
          ? "Ajuste nome, frequência e meta deste hábito."
          : "Defina um hábito para acompanhar todos os dias."
      }
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <HabitForm
        key={habit?.id ?? "create"}
        habit={habit}
        mode={mode}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

function HabitForm({
  habit,
  mode = "create",
  onClose,
  onSubmit,
}: Omit<AddHabitModalProps, "isOpen">) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "🎯");
  const [color, setColor] = useState(habit?.color ?? HABIT_COLOR_PRESETS[0]);
  const [period, setPeriod] = useState<HabitPeriod>(habit?.period ?? "anytime");
  const [type, setType] = useState<HabitType>(habit?.type ?? "boolean");
  const [targetValue, setTargetValue] = useState(String(habit?.targetValue ?? ""));
  const [unit, setUnit] = useState(habit?.unit ?? "");
  const [step, setStep] = useState(String(habit?.step ?? ""));
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(
    habit?.frequencyType ?? "daily"
  );
  const [frequencyDays, setFrequencyDays] = useState<Weekday[]>(
    habit?.frequencyDays ?? [1, 2, 3, 4, 5]
  );
  const [weeklyTargetCount, setWeeklyTargetCount] = useState(
    String(habit?.weeklyTargetCount ?? 3)
  );
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: Weekday) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: CreateHabitInput = {
      name: name.trim(),
      icon,
      color,
      period,
      type,
      frequencyType,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(type === "numeric"
        ? {
            targetValue: Number(targetValue),
            unit: unit.trim(),
            step: Number(step),
          }
        : {}),
      ...(frequencyType === "specific_days" ? { frequencyDays } : {}),
      ...(frequencyType === "weekly_target"
        ? { weeklyTargetCount: Number(weeklyTargetCount) }
        : {}),
    };

    const parsed = CreateHabitSchema.safeParse(input);
    if (!parsed.success) {
      setError("Preencha os campos obrigatórios corretamente.");
      return;
    }

    onSubmit(parsed.data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        placeholder="ex: Beber água, Meditar, Treinar..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Textarea
        label="Descrição (opcional)"
        placeholder="Detalhes ou lembrete pessoal"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      {/* Icon picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
          Ícone
        </label>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_ICON_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={cn(
                "h-9 w-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer border",
                icon === emoji
                  ? "border-brand bg-brand/10 scale-105"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-brand/40"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
          Cor
        </label>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-7 w-7 rounded-full transition-all cursor-pointer ring-offset-2 ring-offset-white dark:ring-offset-[#110e20]",
                color === c ? "ring-2 ring-brand scale-110" : "hover:scale-105"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Period */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
          Período do dia
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {(Object.keys(HABIT_PERIOD_LABELS) as HabitPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "py-2 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                period === p
                  ? "bg-brand/10 text-brand border-brand/30"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              {HABIT_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setType("boolean")}
          className={cn(
            "py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            type === "boolean"
              ? "bg-white dark:bg-[#18152c] text-brand shadow-sm"
              : "text-zinc-600 dark:text-zinc-400"
          )}
        >
          Sim / Não
        </button>
        <button
          type="button"
          onClick={() => setType("numeric")}
          className={cn(
            "py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            type === "numeric"
              ? "bg-white dark:bg-[#18152c] text-brand shadow-sm"
              : "text-zinc-600 dark:text-zinc-400"
          )}
        >
          Quantitativo
        </button>
      </div>

      {type === "numeric" && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Meta"
            type="number"
            min="0.01"
            step="any"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
          />
          <Input
            label="Unidade"
            placeholder="ml, min..."
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
          <Input
            label="Passo"
            type="number"
            min="0.01"
            step="any"
            value={step}
            onChange={(e) => setStep(e.target.value)}
            required
          />
        </div>
      )}

      {/* Frequency */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
          Frequência
        </label>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {(Object.keys(HABIT_FREQUENCY_LABELS) as HabitFrequencyType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequencyType(f)}
              className={cn(
                "py-2 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border",
                frequencyType === f
                  ? "bg-brand/10 text-brand border-brand/30"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              {HABIT_FREQUENCY_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {frequencyType === "specific_days" && (
        <div className="flex flex-wrap gap-1.5">
          {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "h-9 min-w-9 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border",
                frequencyDays.includes(day)
                  ? "bg-brand text-white border-brand"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
              )}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          ))}
        </div>
      )}

      {frequencyType === "weekly_target" && (
        <Input
          label="Vezes por semana"
          type="number"
          min="1"
          max="7"
          value={weeklyTargetCount}
          onChange={(e) => setWeeklyTargetCount(e.target.value)}
          required
        />
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {mode === "edit" ? "Salvar" : "Criar hábito"}
        </Button>
      </div>
    </form>
  );
}
