"use client";

import React from "react";
import { Task, TaskCategory } from "@/types/orbit";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { Plus, Calendar, ArrowRight, Orbit } from "lucide-react";
import { parseDateKey } from "@/lib/date-utils";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  tasks: Task[];
  categoriesMap: Map<string, TaskCategory>;
  onAddTaskForDate: (dateStr: string) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSwitchToWeekView?: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAY_NAMES = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

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

  const dateObj = parseDateKey(dateStr);
  const dayName = DAY_NAMES[dateObj.getDay()];
  const formattedDate = `${dateObj.getDate()} de ${MONTH_NAMES[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

  const dayTasks = tasks.filter((t) => t.date === dateStr);
  const completedCount = dayTasks.filter((t) => t.completed).length;

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
            <Calendar className="w-4 h-4 text-[#844DFE]" />
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
              className="inline-flex items-center gap-1 font-semibold text-[#844DFE] dark:text-[#b494ff] hover:underline cursor-pointer"
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
                category={categoriesMap.get(task.categoryId)}
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
