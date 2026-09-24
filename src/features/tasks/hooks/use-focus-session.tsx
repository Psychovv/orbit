"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { nowIso } from "@/shared/lib/id";
import { triggerCosmicCelebration } from "@/shared/effects/confetti";
import { activeFocusTask, focusElapsedSeconds, pausedFocusPatch } from "../domain/focus";
import type { Task } from "../domain/task.schema";
import { isCompleted } from "../domain/task.selectors";
import { useTasks, useUpdateTask } from "./use-tasks";

interface FocusSessionContextValue {
  active: Task | null;
  start: (task: Task) => Promise<void>;
  pause: (task: Task) => Promise<void>;
  complete: (task: Task) => Promise<void>;
}

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

export function FocusSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: tasks = [] } = useTasks();
  const update = useUpdateTask();
  const active = activeFocusTask(tasks);

  const start = useCallback(
    async (task: Task) => {
      const others = tasks.filter((item) => item.focusStartedAt && item.id !== task.id);
      await Promise.all(
        others.map((other) => update.mutateAsync({ id: other.id, patch: pausedFocusPatch(other) }))
      );
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

  const value = useMemo(() => ({ active, start, pause, complete }), [active, start, pause, complete]);

  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

export function useFocusSession(): FocusSessionContextValue {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) throw new Error("useFocusSession must be used inside <FocusSessionProvider>");
  return ctx;
}

const tickListeners = new Set<() => void>();
let tickNow = Date.now();
let tickTimer: number | undefined;

function subscribeTick(listener: () => void) {
  tickListeners.add(listener);
  if (tickTimer === undefined) {
    tickTimer = window.setInterval(() => {
      tickNow = Date.now();
      tickListeners.forEach((l) => l());
    }, 1000);
  }
  const kick = window.setTimeout(() => {
    tickNow = Date.now();
    listener();
  }, 0);
  return () => {
    window.clearTimeout(kick);
    tickListeners.delete(listener);
    if (tickListeners.size === 0 && tickTimer !== undefined) {
      window.clearInterval(tickTimer);
      tickTimer = undefined;
    }
  };
}

const subscribeNever = () => () => {};

/** Segundos de foco da tarefa. Só re-renderiza a cada segundo enquanto a sessão dela estiver aberta. */
export function useFocusElapsed(task: Pick<Task, "focusSeconds" | "focusStartedAt"> | null): number {
  const running = Boolean(task?.focusStartedAt);
  const now = useSyncExternalStore(
    running ? subscribeTick : subscribeNever,
    () => tickNow,
    () => 0
  );
  if (!task) return 0;
  return running ? focusElapsedSeconds(task, Math.max(now, Date.parse(task.focusStartedAt ?? ""))) : task.focusSeconds;
}
