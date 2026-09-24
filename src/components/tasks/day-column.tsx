"use client";

import React from "react";
import { Task, TaskCategory, WeekDayInfo } from "@/types/orbit";
import { TaskItem } from "./task-item";
import { Plus, Check, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayColumnProps {
  dayInfo: WeekDayInfo;
  tasks: Task[];
  categoriesMap: Map<string, TaskCategory>;
  isToday: boolean;
  onAddTask: (dayKey: DayColumnProps["dayInfo"]["key"]) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function DayColumn({
  dayInfo,
  tasks,
  categoriesMap,
  isToday,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
}: DayColumnProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const isAllDone = total > 0 && completed === total;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-4.5 transition-all duration-200 shrink-0",
        "w-[310px] sm:w-[325px] md:w-[340px]", // Generous width ensuring task texts never feel squeezed
        "bg-white/80 dark:bg-[#100e1e]/80 backdrop-blur-md border",
        isToday
          ? "border-[#844DFE]/60 ring-1 ring-[#844DFE]/30 shadow-xs"
          : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {dayInfo.name.split("-")[0]}
            </h4>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                isToday
                  ? "bg-[#844DFE] text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              {dayInfo.shortName}
            </span>
            {isToday && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#844DFE]" />
            )}
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {dayInfo.description}
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-1">
          {isAllDone ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 stroke-[2.5]" />
              Concluído
            </span>
          ) : (
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-mono">
              {completed}/{total}
            </span>
          )}
        </div>
      </div>

      {/* Discreet Daily Progress Line */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-1 rounded-full overflow-hidden my-2.5">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isAllDone ? "bg-emerald-500" : "bg-[#844DFE]"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tasks List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto py-1 min-h-[160px] max-h-[540px]">
        {tasks.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-4 text-center text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-xl my-2">
            <Orbit className="w-5 h-5 stroke-[1.5] mb-1.5 opacity-30 text-zinc-400" />
            <p className="text-xs font-medium">Nenhuma tarefa</p>
            <p className="text-[10px] mt-0.5">Toque abaixo para agendar</p>
          </div>
        ) : (
          tasks.map((task) => (
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

      {/* Quick Add Button */}
      <button
        onClick={() => onAddTask(dayInfo.key)}
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-[#844DFE] dark:hover:text-[#b494ff] border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Adicionar tarefa</span>
      </button>
    </div>
  );
}
