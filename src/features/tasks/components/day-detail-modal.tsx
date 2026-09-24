"use client";

import React from "react";
import type { Task, TaskCategory } from "../domain/task.schema";
import { countCompleted, tasksOnDate } from "../domain/task.selectors";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { TaskItem } from "./task-item";
import { Plus, Calendar, ArrowRight, Orbit } from "lucide-react";
import { formatLongDate } from "@/shared/lib/date-utils";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  tasks: Task[];
  categoriesMap: Map<string, TaskCategory>;
  onAddTaskForDate: (dateStr: string) => void;
  onToggleComplete: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onSwitchToWeekView?: (dateStr: string) => void;
}

export function DayDetailModal({
  isOpen,
  onClose,
  dateStr,
  tasks,
  categoriesMap,
  onAddTaskForDate,
  onToggleComplete,
  onDeleteTask,
  onSwitchToWeekView,
}: DayDetailModalProps) {
  if (!dateStr) return null;

  const { dayName, date: formattedDate } = formatLongDate(dateStr);
  const dayTasks = tasksOnDate(tasks, dateStr);
  const completedCount = countCompleted(dayTasks);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={dayName}
      description={formattedDate}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Progress overview */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Calendar className="w-4 h-4 text-brand" />
            <span className="font-medium">
              {dayTasks.length === 0
                ? "Nenhuma tarefa para este dia"
                : `${completedCount} de ${dayTasks.length} tarefas concluídas`}
            </span>
          </div>

          {onSwitchToWeekView && (
            <button
              onClick={() => {
                onSwitchToWeekView(dateStr);
                onClose();
              }}
              className="inline-flex items-center gap-1 font-semibold text-brand dark:text-brand-soft hover:underline cursor-pointer"
            >
              <span>Ver na semana</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Task list */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {dayTasks.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Orbit className="w-7 h-7 text-zinc-400 opacity-40 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Dia livre em sua órbita
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
                Nenhum compromisso ou tarefa agendada para {dayName.toLowerCase()}.
              </p>
            </div>
          ) : (
            dayTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                category={task.categoryId ? categoriesMap.get(task.categoryId) : undefined}
                onToggleComplete={onToggleComplete}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onAddTaskForDate(dateStr);
              onClose();
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tarefa</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
