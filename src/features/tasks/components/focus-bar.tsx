"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Task } from "../domain/task.schema";
import { formatFocusClock } from "../domain/focus";
import { useFocusElapsed } from "../hooks/use-focus-session";
import { Maximize2, Pause } from "lucide-react";

interface FocusBarProps {
  task: Task | null;
  onPause: () => void;
  onExpand: () => void;
}

export function FocusBar({ task, onPause, onExpand }: FocusBarProps) {
  const elapsedSeconds = useFocusElapsed(task);

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-5 left-1/2 z-40 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-white/95 dark:bg-[#121020]/95 px-3.5 py-2.5 shadow-lg shadow-brand/10 backdrop-blur-xl">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand animate-pulse" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
              <p className="font-mono text-xs text-brand dark:text-brand-soft">{formatFocusClock(elapsedSeconds)}</p>
            </div>
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              Pausar
            </button>
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand dark:text-brand-soft hover:bg-brand/10 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Foco
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
