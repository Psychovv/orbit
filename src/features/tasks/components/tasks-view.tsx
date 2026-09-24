"use client";

import React, { useMemo, useState } from "react";
import type { TaskCategory } from "../domain/task.schema";
import { ALL_CATEGORIES, countCompleted, filterByCategory, groupByDate } from "../domain/task.selectors";
import { useDeleteTask, useTaskCategories, useTasks, useToggleTaskCompletion } from "../hooks/use-tasks";
import { useTasksViewState } from "../hooks/use-tasks-view-state";
import { useTaskAssistant } from "../hooks/use-task-assistant";
import { useTaskDialogs } from "./task-dialogs";
import { DayColumn } from "./day-column";
import { MonthCalendarView } from "./month-calendar-view";
import { DayDetailModal } from "./day-detail-modal";
import { AssistantButton } from "@/features/assistant/components/assistant-button";
import { Button } from "@/shared/ui/button";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import {
  getWeekDays,
  addWeeks,
  addMonths,
  formatWeekRange,
  formatMonthYear,
  formatDateKey,
  getYearMonthKey,
  monthGridRange,
  parseDateKey,
  weekRange,
} from "@/shared/lib/date-utils";
import {
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Columns,
  LayoutGrid,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function TasksView() {
  const { view: viewMode, baseDate, categoryId: categoryParam, setView, setBaseDate, setCategory, showWeekOf } =
    useTasksViewState();
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const dialogs = useTaskDialogs();

  const range = useMemo(
    () => (viewMode === "week" ? weekRange(baseDate) : monthGridRange(baseDate)),
    [viewMode, baseDate]
  );
  const tasksQuery = useTasks(range);
  const categoriesQuery = useTaskCategories();
  const toggleComplete = useToggleTaskCompletion();
  const deleteTask = useDeleteTask();
  const runAssistant = useTaskAssistant({ onSingleDraft: (draft) => dialogs.openAddTask(draft) });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const activeCategory = categories.find((c) => c.id === categoryParam);
  const selectedCategoryId = activeCategory?.id ?? ALL_CATEGORIES;

  const categoriesMap = useMemo(() => {
    const map = new Map<string, TaskCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const isCurrentWeek = weekRange(baseDate).from === weekRange(new Date()).from;

  const filteredTasks = useMemo(
    () => filterByCategory(tasksQuery.data ?? [], selectedCategoryId),
    [tasksQuery.data, selectedCategoryId]
  );
  const tasksByDate = useMemo(() => groupByDate(filteredTasks), [filteredTasks]);

  const summaryTasks = useMemo(() => {
    if (viewMode === "week") return filteredTasks;
    const monthKey = getYearMonthKey(baseDate);
    return filteredTasks.filter((t) => t.date.startsWith(monthKey));
  }, [viewMode, filteredTasks, baseDate]);

  const handlePrev = () => setBaseDate(viewMode === "week" ? addWeeks(baseDate, -1) : addMonths(baseDate, -1));
  const handleNext = () => setBaseDate(viewMode === "week" ? addWeeks(baseDate, 1) : addMonths(baseDate, 1));
  const handleGoToday = () => setBaseDate(null);
  const handleOpenAddModal = (date?: string) => dialogs.openAddTask({ date });
  const handleDeleteTask = (id: string) => deleteTask.mutate(id);

  if (tasksQuery.isPending || categoriesQuery.isPending) return <ViewSkeleton />;

  return (
    <div className="space-y-5">
      {/* Clean Header with Generous Whitespace */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {viewMode === "week" ? "Visão Semanal" : "Calendário Mensal"}
            </h2>
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/20">
                <span>{activeCategory.icon}</span>
                <span>{activeCategory.name}</span>
                <button
                  onClick={() => setCategory(ALL_CATEGORIES)}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                  title="Limpar filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {countCompleted(summaryTasks)} de {summaryTasks.length} tarefas concluídas{" "}
            {viewMode === "week" ? "nesta semana" : "neste mês"}
          </p>
        </div>

        {/* Minimal Actions: View Mode Switcher, Category filter, Manage categories, Add task */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher: Semana / Mês */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80">
            <button
              onClick={() => setView("week")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "week"
                  ? "bg-white dark:bg-[#18152c] text-[#844DFE] dark:text-[#b494ff] shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "month"
                  ? "bg-white dark:bg-[#18152c] text-[#844DFE] dark:text-[#b494ff] shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>
          </div>

          {/* Discreet Category Filter */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9.5 pl-3 pr-8 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121020]/80 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#844DFE]/20 cursor-pointer transition-colors"
            >
              <option value={ALL_CATEGORIES}>Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manage Categories Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={dialogs.openCategories}
            className="h-9.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>

          <AssistantButton placeholder="Ex: Comprar leite amanhã de manhã..." onSubmit={runAssistant} />

          {/* Primary Add Task Button using #844DFE */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddModal()}
            className="h-9.5 text-xs px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Calendar Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
        {/* Navigation arrows & Current Range Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-0.5">
            <button
              onClick={handlePrev}
              title={viewMode === "week" ? "Semana anterior" : "Mês anterior"}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              title={viewMode === "week" ? "Próxima semana" : "Próximo mês"}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <CalendarIcon className="w-4 h-4 text-[#844DFE]" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {viewMode === "week" ? formatWeekRange(baseDate) : formatMonthYear(baseDate)}
            </span>
          </div>
        </div>

        {/* Quick Return to Today & Date Picker Jump */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isCurrentWeek && (
            <button
              onClick={handleGoToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#844DFE]/10 hover:bg-[#844DFE]/20 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/30 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Semana Atual</span>
            </button>
          )}

          {isCurrentWeek && (
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              Hoje
            </button>
          )}

          {/* Jump to specific date */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={formatDateKey(baseDate)}
              onChange={(e) => {
                if (e.target.value) setBaseDate(parseDateKey(e.target.value));
              }}
              title="Ir para data específica"
              className="text-xs font-mono px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#844DFE] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main View: Week (7 Columns) or Month (Grid) */}
      {viewMode === "week" ? (
        <div className="relative">
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-1 scrollbar-thin scroll-smooth snap-x">
            {weekDays.map((wd) => (
              <div key={wd.date} className="snap-start">
                <DayColumn
                  dayInfo={wd}
                  tasks={tasksByDate.get(wd.date) ?? []}
                  categoriesMap={categoriesMap}
                  isToday={wd.isToday}
                  onAddTask={handleOpenAddModal}
                  onToggleComplete={toggleComplete}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <MonthCalendarView
          baseDate={baseDate}
          tasks={filteredTasks}
          categoriesMap={categoriesMap}
          onSelectDay={setSelectedDayForDetail}
          onAddTaskForDay={handleOpenAddModal}
        />
      )}

      {/* Day Detail Modal (opened by clicking any day in Month view) */}
      <DayDetailModal
        isOpen={selectedDayForDetail !== null}
        onClose={() => setSelectedDayForDetail(null)}
        dateStr={selectedDayForDetail}
        tasks={filteredTasks}
        categoriesMap={categoriesMap}
        onAddTaskForDate={handleOpenAddModal}
        onToggleComplete={toggleComplete}
        onDeleteTask={handleDeleteTask}
        onSwitchToWeekView={showWeekOf}
      />
    </div>
  );
}
