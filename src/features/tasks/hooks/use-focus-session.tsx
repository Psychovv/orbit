"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { nowIso } from "@/shared/lib/id";
import { triggerCosmicCelebration } from "@/shared/effects/confetti";
import { activeFocusTask, focusElapsedSeconds, pausedFocusPatch } from "../domain/focus";
import type { Task } from "../domain/task.schema";
import { isCompleted } from "../domain/task.selectors";
import { useTasks, useUpdateTask } from "./use-tasks";

interface FocusSessionContextValue {
  active: Task | null;
  elapsed: (task: Pick<Task, "focusSeconds" | "focusStartedAt">) => number;
  start: (task: Task) => Promise<void>;
  pause: (task: Task) => Promise<void>;
  complete: (task: Task) => Promise<void>;
}

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

export function FocusSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: tasks = [] } = useTasks();
  const update = useUpdateTask();
  const [now, setNow] = useState(() => Date.now());
  const active = activeFocusTask(tasks);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const elapsed = useCallback(
    (task: Pick<Task, "focusSeconds" | "focusStartedAt">) => focusElapsedSeconds(task, now),
    [now]
  );

  const start = useCallback(
    async (task: Task) => {
      const others = tasks.filter((item) => item.focusStartedAt && item.id !== task.id);
      for (const other of others) {
        await update.mutateAsync({ id: other.id, patch: pausedFocusPatch(other) });
      }
      if (task.focusStartedAt) return;
      await update.mutateAsync({ id: task.id, patch: { focusStartedAt: nowIso() } });
    },
    [tasks, update]
  );

  const pause = useCallback(
    async (task: Task) => {
      if (!task.focusStartedAt) return;
      await update.mutateAsync({ id: task.id, patch: pausedFocusPatch(task) });
    },
    [update]
  );

  const complete = useCallback(
    async (task: Task) => {
      const completing = !isCompleted(task);
      await update.mutateAsync({
        id: task.id,
        patch: {
          ...pausedFocusPatch(task),
          ...(completing ? { completedAt: nowIso() } : {}),
        },
      });
      if (completing) triggerCosmicCelebration();
    },
    [update]
  );

  const value = useMemo(
    () => ({ active, elapsed, start, pause, complete }),
    [active, elapsed, start, pause, complete]
  );

  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

export function useFocusSession(): FocusSessionContextValue {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) throw new Error("useFocusSession must be used inside <FocusSessionProvider>");
  return ctx;
}
