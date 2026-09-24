"use client";

import React, { useMemo } from "react";
import { Task, TaskCategory } from "@/types/orbit";
import { getMonthGrid, MonthGridDay } from "@/lib/date-utils";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthCalendarViewProps {
  baseDate: Date;
  tasks: Task[];
  categoriesMap: Map<string, TaskCategory>;
  onSelectDay: (dateStr: string) => void;
  onAddTaskForDay: (dateStr: string) => void;
}

const WEEK_HEADER_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const WEEK_HEADER_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthCalendarView({
  baseDate,
  tasks,
  categoriesMap,
  onSelectDay,
  onAddTaskForDay,
}: MonthCalendarViewProps) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  // Generate 42 cells for full 6-week grid
  const monthGrid = useMemo(() => {
    return getMonthGrid(year, month);
  }, [year, month]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    });
    return map;
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md overflow-hidden shadow-xs">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50">
        {WEEK_HEADER_NAMES.map((name, idx) => (
          <div
            key={name}
            className="py-2.5 px-3 text-center sm:text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          >
            <span className="hidden sm:inline">{name}</span>
            <span className="sm:hidden">{WEEK_HEADER_SHORT[idx]}</span>
          </div>
        ))}
      </div>

      {/* 42-cell Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
        {monthGrid.map((cell: MonthGridDay) => {
          const dayTasks = tasksByDate.get(cell.date) || [];
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <div
              key={cell.date}
              onClick={() => onSelectDay(cell.date)}
              className={cn(
                "group relative min-h-[96px] sm:min-h-[115px] p-1.5 sm:p-2.5 flex flex-col justify-between transition-colors cursor-pointer",
                cell.isCurrentMonth
                  ? "bg-white/40 dark:bg-transparent hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  : "bg-zinc-50/40 dark:bg-zinc-950/40 opacity-40 hover:opacity-75",
                cell.isToday && "bg-[#844DFE]/5 dark:bg-[#844DFE]/10"
              )}
            >
              {/* Day Number & Quick Add Button */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all font-mono",
                    cell.isToday
                      ? "bg-[#844DFE] text-white shadow-xs"
                      : cell.isCurrentMonth
                      ? "text-zinc-700 dark:text-zinc-200 group-hover:text-[#844DFE]"
                      : "text-zinc-400 dark:text-zinc-600"
                  )}
                >
                  {cell.dayNumber}
                </span>

                {/* Quick Add Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTaskForDay(cell.date);
                  }}
                  title="Adicionar tarefa neste dia"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-[#844DFE] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task list preview (up to 3 items) */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => {
                  const cat = categoriesMap.get(task.categoryId);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium truncate transition-colors",
                        task.completed
                          ? "line-through text-zinc-400 dark:text-zinc-500 bg-zinc-100/60 dark:bg-zinc-900/40"
                          : "text-zinc-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xs"
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || "#844DFE" }}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold pl-1">
                    +{dayTasks.length - 3} mais
                  </p>
                )}
              </div>

              {/* Discreet completed indicator at bottom */}
              {dayTasks.length > 0 && (
                <div className="pt-1 mt-1 border-t border-zinc-100/80 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-mono">
                    {completedCount}/{dayTasks.length}
                  </span>
                  {completedCount === dayTasks.length && (
                    <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
