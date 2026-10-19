"use client";

import { useMemo } from "react";
import { addDays, formatDateKey, parseDateKey, todayKey } from "@/shared/lib/date-utils";
import {
  countCompletedHabitsOn,
  maxActiveStreak,
} from "../domain/habit.streak";
import { useHabitCheckins, useHabits } from "./use-habits";

export interface HabitsSummary {
  total: number;
  completed: number;
  bestActiveStreak: number;
}

/** Resumo leve do dia: agendados, concluídos e maior streak ativo. `null` enquanto carrega. */
export function useHabitsSummary(): HabitsSummary | null {
  const today = todayKey();
  const streakRange = useMemo(
    () => ({ from: formatDateKey(addDays(parseDateKey(today), -364)), to: today }),
    [today]
  );

  const habitsQuery = useHabits();
  const checkinsQuery = useHabitCheckins(streakRange);

  if (!habitsQuery.data || !checkinsQuery.data) return null;

  const { total, completed } = countCompletedHabitsOn(
    habitsQuery.data,
    checkinsQuery.data,
    today
  );

  return {
    total,
    completed,
    bestActiveStreak: maxActiveStreak(habitsQuery.data, checkinsQuery.data, today),
  };
}
