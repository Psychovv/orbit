"use client";

import { useEffect, useRef } from "react";
import { useHabitsSummary } from "@/features/habits/hooks/use-habits-summary";
import { useTodayTasksSummary } from "@/features/tasks/hooks/use-today-tasks";
import { todayKey } from "@/shared/lib/date-utils";
import { triggerQuasarEvent } from "@/shared/effects/quasar-event";

const LAST_QUASAR_DAY_KEY = "orbit_quasar_day";
const CONFETTI_LEAD_MS = 1000;

/** Dispara o quasar quando a última tarefa/hábito de hoje é concluída (uma vez por dia). */
export function useDayCompleteQuasar() {
  const tasks = useTodayTasksSummary();
  const habits = useHabitsSummary();
  const previous = useRef<{ date: string; done: boolean; completed: number } | null>(null);

  const total = tasks && habits ? tasks.total + habits.total : null;
  const completed = tasks && habits ? tasks.completed + habits.completed : null;

  useEffect(() => {
    if (total === null || completed === null) return;
    const today = todayKey();
    const done = total > 0 && completed === total;
    const last = previous.current;
    previous.current = { date: today, done, completed };

    if (!last || last.date !== today || last.done || !done || completed <= last.completed) return;
    if (localStorage.getItem(LAST_QUASAR_DAY_KEY) === today) return;
    localStorage.setItem(LAST_QUASAR_DAY_KEY, today);
    triggerQuasarEvent(CONFETTI_LEAD_MS);
  }, [total, completed]);
}
