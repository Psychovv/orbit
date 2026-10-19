"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Minus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { Habit, HabitCheckin } from "../domain/habit.schema";
import { HABIT_PERIOD_LABELS } from "../domain/habit.schema";
import {
  computeHabitStreak,
  findCheckin,
  isCheckinComplete,
} from "../domain/habit.streak";
import { cn } from "@/shared/lib/utils";

interface HabitCardProps {
  habit: Habit;
  date: string;
  checkins: HabitCheckin[];
  onToggle: () => void;
  onStep: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({
  habit,
  date,
  checkins,
  onToggle,
  onStep,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const checkin = findCheckin(checkins, habit.id, date);
  const completed = isCheckinComplete(habit, checkin);
  const streak = computeHabitStreak(habit, checkins, date);
  const currentValue = checkin?.currentValue ?? 0;
  const target = habit.targetValue ?? 0;
  const progress =
    habit.type === "numeric" && target > 0
      ? Math.min(100, Math.round((currentValue / target) * 100))
      : completed
        ? 100
        : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-2xl border p-4 transition-all",
        completed
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
          : "bg-white/80 dark:bg-[#121020]/80 border-zinc-200/80 dark:border-zinc-800/80 hover:border-brand/30"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={completed ? `Desmarcar ${habit.name}` : `Concluir ${habit.name}`}
          className={cn(
            "relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all cursor-pointer",
            completed
              ? "text-white shadow-sm"
              : "border-zinc-300 dark:border-zinc-600 bg-white/50 dark:bg-zinc-800/50 hover:scale-105"
          )}
          style={
            completed
              ? { backgroundColor: habit.color, borderColor: habit.color }
              : { borderColor: `${habit.color}66` }
          }
        >
          {completed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="w-4.5 h-4.5 stroke-[3]" />
            </motion.div>
          ) : (
            <span className="text-base leading-none">{habit.icon}</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  completed
                    ? "text-zinc-500 dark:text-zinc-400 line-through"
                    : "text-zinc-900 dark:text-zinc-100"
                )}
              >
                <span className="mr-1.5">{habit.icon}</span>
                {habit.name}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {HABIT_PERIOD_LABELS[habit.period]}
                {habit.type === "numeric" && habit.unit
                  ? ` · meta ${habit.targetValue} ${habit.unit}`
                  : null}
              </p>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Opções do hábito"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Fechar menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151225] shadow-lg py-1 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {habit.type === "numeric" && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStep(-(habit.step ?? 1))}
                    className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    aria-label="Diminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-200 min-w-[4.5rem] text-center">
                    {currentValue}
                    {habit.unit ? ` ${habit.unit}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStep(habit.step ?? 1)}
                    className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  +{habit.step}
                  {habit.unit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: habit.color }}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                />
              </div>
            </div>
          )}

          {streak.current > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <span>🔥</span>
              <span>
                {streak.current} {streak.current === 1 ? "dia" : "dias"}
                {streak.status === "at_risk" ? " · em risco" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
