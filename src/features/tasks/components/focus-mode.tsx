"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Task } from "../domain/task.schema";
import { formatFocusClock } from "../domain/focus";
import { isCompleted } from "../domain/task.selectors";
import { Button } from "@/shared/ui/button";
import { Check, Minimize2, Pause, Play } from "lucide-react";

interface FocusModeProps {
  task: Task | null;
  isOpen: boolean;
  elapsedSeconds: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onMinimize: () => void;
  onComplete: () => void;
}

export function FocusMode({
  task,
  isOpen,
  elapsedSeconds,
  isRunning,
  onPause,
  onResume,
  onMinimize,
  onComplete,
}: FocusModeProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMinimize();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onMinimize]);

  return (
    <AnimatePresence>
      {isOpen && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#070512]/90 text-white backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={`Modo foco: ${task.title}`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#844DFE] to-transparent" />
          <button
            type="button"
            onClick={onMinimize}
            className="absolute top-5 right-5 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Minimizar
          </button>

          <div className="flex flex-col items-center gap-8 px-6 text-center max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b494ff]">Modo foco</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">{task.title}</h2>
            <p className="font-mono text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight text-white">
              {formatFocusClock(elapsedSeconds)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isRunning ? (
                <Button variant="secondary" size="lg" onClick={onPause}>
                  <Pause className="w-4 h-4" />
                  Pausar
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={onResume}>
                  <Play className="w-4 h-4" />
                  Retomar
                </Button>
              )}
              {!isCompleted(task) && (
                <Button variant="outline" size="lg" onClick={onComplete} className="border-white/15 text-white hover:text-white">
                  <Check className="w-4 h-4" />
                  Concluir tarefa
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
