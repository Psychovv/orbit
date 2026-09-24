"use client";

import { useMemo } from "react";
import { todayKey } from "@/shared/lib/date-utils";
import { countCompleted } from "../domain/task.selectors";
import { useTasks } from "./use-tasks";

/** Tarefas de hoje e quantas já foram concluídas. `null` enquanto carrega. */
export function useTodayTasksSummary() {
  const today = todayKey();
  const range = useMemo(() => ({ from: today, to: today }), [today]);
  const { data } = useTasks(range);
  if (!data) return null;
  return { total: data.length, completed: countCompleted(data) };
}
