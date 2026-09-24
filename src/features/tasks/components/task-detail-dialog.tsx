"use client";

import React, { useState } from "react";
import type { Task, TaskCategory, UpdateTaskInput } from "../domain/task.schema";
import { formatFocusClock, formatFocusDuration } from "../domain/focus";
import { isCompleted } from "../domain/task.selectors";
import { TaskForm } from "./add-task-modal";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { formatLongDate } from "@/shared/lib/date-utils";
import { Check, Clock, Pause, Pencil, Play } from "lucide-react";

interface TaskDetailDialogProps {
  task: Task | null;
  categories: TaskCategory[];
  category?: TaskCategory;
  elapsedSeconds: number;
  isRunning: boolean;
  onClose: () => void;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onSave: (patch: UpdateTaskInput) => void;
}

const PRIORITY_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta" } as const;

export function TaskDetailDialog({
  task,
  categories,
  category,
  elapsedSeconds,
  isRunning,
  onClose,
  onStart,
  onPause,
  onComplete,
  onSave,
}: TaskDetailDialogProps) {
  if (!task) return null;

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={task.title}
      className="max-w-2xl max-h-[85vh] overflow-y-auto"
    >
      <TaskDetailBody
        key={task.id}
        task={task}
        categories={categories}
        category={category}
        elapsedSeconds={elapsedSeconds}
        isRunning={isRunning}
        onClose={onClose}
        onStart={onStart}
        onPause={onPause}
        onComplete={onComplete}
        onSave={onSave}
      />
    </Dialog>
  );
}

function TaskDetailBody({
  task,
  categories,
  category,
  elapsedSeconds,
  isRunning,
  onClose,
  onStart,
  onPause,
  onComplete,
  onSave,
}: {
  task: Task;
  categories: TaskCategory[];
  category?: TaskCategory;
  elapsedSeconds: number;
  isRunning: boolean;
  onClose: () => void;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onSave: (patch: UpdateTaskInput) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { dayName, date } = formatLongDate(task.date);

  return editing ? (
        <TaskForm
          key={task.id}
          categories={categories}
          allowEmptyCategory
          submitLabel="Salvar"
          defaults={{
            title: task.title,
            description: task.description,
            date: task.date,
            time: task.time,
            categoryId: task.categoryId,
            priority: task.priority,
          }}
          onClose={() => setEditing(false)}
          onSubmit={(input) => {
            onSave({
              title: input.title,
              description: input.description,
              date: input.date,
              time: input.time,
              categoryId: input.categoryId,
              priority: input.priority,
            });
            setEditing(false);
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/50">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: category?.color || "#844DFE" }}
              />
              {category ? `${category.icon} ${category.name}` : "Geral"}
            </span>
            <span>
              {dayName}, {date}
            </span>
            {task.time && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {task.time}
              </span>
            )}
            <span>Prioridade {PRIORITY_LABEL[task.priority]}</span>
          </div>

          {task.description ? (
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap break-words">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-400">Sem observações.</p>
          )}

          <div className="rounded-2xl border border-[#844DFE]/25 bg-[#844DFE]/5 px-5 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#844DFE] dark:text-[#b494ff]">
              Modo foco
            </p>
            <p className="mt-3 font-mono text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatFocusClock(elapsedSeconds)}
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {elapsedSeconds > 0 ? `${formatFocusDuration(elapsedSeconds)} nesta tarefa` : "Nenhum tempo registrado ainda"}
              {isRunning ? " · em foco" : ""}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {isRunning ? (
                <Button variant="secondary" onClick={onPause}>
                  <Pause className="w-4 h-4" />
                  Pausar
                </Button>
              ) : (
                <Button variant="primary" onClick={onStart}>
                  <Play className="w-4 h-4" />
                  {elapsedSeconds > 0 ? "Retomar" : "Iniciar foco"}
                </Button>
              )}
              {!isCompleted(task) && (
                <Button variant="outline" onClick={onComplete}>
                  <Check className="w-4 h-4" />
                  Concluir tarefa
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>
      );
}
