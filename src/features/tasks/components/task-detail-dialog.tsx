"use client";

import React from "react";
import type { Task, TaskCategory } from "../domain/task.schema";
import { formatFocusDuration } from "../domain/focus";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { formatLongDate } from "@/shared/lib/date-utils";
import { Clock, Timer } from "lucide-react";

interface TaskDetailDialogProps {
  task: Task | null;
  category?: TaskCategory;
  elapsedSeconds: number;
  isRunning: boolean;
  onClose: () => void;
  onEnterFocus: () => void;
}

const PRIORITY_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta" } as const;

export function TaskDetailDialog({
  task,
  category,
  elapsedSeconds,
  isRunning,
  onClose,
  onEnterFocus,
}: TaskDetailDialogProps) {
  if (!task) return null;
  const { dayName, date } = formatLongDate(task.date);

  return (
    <Dialog isOpen={task !== null} onClose={onClose} title={task.title} description={task.description}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: category?.color || "#844DFE" }}
            />
            {category?.name ?? "Geral"}
          </span>
          <span>
            {dayName}, {date}
          </span>
          {task.time && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {task.time}
            </span>
          )}
          <span>Prioridade {PRIORITY_LABEL[task.priority]}</span>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Timer className="w-4 h-4 text-[#844DFE]" />
            <span>Tempo de foco</span>
          </div>
          <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {elapsedSeconds > 0 ? formatFocusDuration(elapsedSeconds) : "0s"}
            {isRunning ? " · em foco" : ""}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={onEnterFocus}>
            <Timer className="w-4 h-4" />
            {isRunning ? "Voltar ao foco" : "Modo foco"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
