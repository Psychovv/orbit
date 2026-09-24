"use client";

import React, { useState, useMemo } from "react";
import { Task, TaskCategory, DayOfWeek } from "@/types/orbit";
import { DayColumn } from "./day-column";
import { MonthCalendarView } from "./month-calendar-view";
import { DayDetailModal } from "./day-detail-modal";
import { AddTaskModal } from "./add-task-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import { Button } from "@/components/ui/button";
import {
  getWeekDays,
  addWeeks,
  addMonths,
  formatWeekRange,
  formatMonthYear,
  formatDateKey,
  parseDateKey,
  getStartOfWeek,
} from "@/lib/date-utils";
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
import { cn } from "@/lib/utils";

interface TasksModuleProps {
  tasks: Task[];
  categories: TaskCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onAddTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddCategory: (category: TaskCategory) => void;
  onDeleteCategory: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isCategoriesModalOpen: boolean;
  setIsCategoriesModalOpen: (open: boolean) => void;
}

export function TasksModule({
  tasks,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onAddCategory,
  onDeleteCategory,
  isAddModalOpen,
  setIsAddModalOpen,
  isCategoriesModalOpen,
  setIsCategoriesModalOpen,
}: TasksModuleProps) {
  // Calendar base date (defaults to current date)
  const [currentBaseDate, setCurrentBaseDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);

  // Modal default date and day
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(formatDateKey(new Date()));
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek>("seg");

  // Map of categories by ID
  const categoriesMap = useMemo(() => {
    const map = new Map<string, TaskCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Determine the 7 days of the active week
  const weekDays = useMemo(() => {
    return getWeekDays(currentBaseDate);
  }, [currentBaseDate]);

  // Check if currentBaseDate is in the actual current calendar week
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const currentMonday = getStartOfWeek(today);
    const activeMonday = getStartOfWeek(currentBaseDate);
    return formatDateKey(currentMonday) === formatDateKey(activeMonday);
  }, [currentBaseDate]);

  // Filter tasks if category selected
  const filteredTasks = useMemo(() => {
    if (selectedCategoryId === "all") return tasks;
    return tasks.filter((t) => t.categoryId === selectedCategoryId);
  }, [tasks, selectedCategoryId]);

  // Count tasks within active week
  const weekTasks = useMemo(() => {
    const weekDates = new Set(weekDays.map((d) => d.date));
    return filteredTasks.filter((t) => weekDates.has(t.date));
  }, [filteredTasks, weekDays]);

  const weekCompletedCount = weekTasks.filter((t) => t.completed).length;
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "week") {
      setCurrentBaseDate((prev) => addWeeks(prev, -1));
    } else {
      setCurrentBaseDate((prev) => addMonths(prev, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentBaseDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentBaseDate((prev) => addMonths(prev, 1));
    }
  };

  const handleGoToday = () => {
    setCurrentBaseDate(new Date());
  };

  const handleOpenAddModal = (dateStr?: string, dayKey?: DayOfWeek) => {
    const targetDate = dateStr || formatDateKey(new Date());
    setModalDefaultDate(targetDate);
    if (dayKey) {
      setModalDefaultDay(dayKey);
    } else {
      try {
        const parsed = parseDateKey(targetDate);
        const dayIdx = parsed.getDay();
        const map: Record<number, DayOfWeek> = {
          0: "dom",
          1: "seg",
          2: "ter",
          3: "qua",
          4: "qui",
          5: "sex",
          6: "sab",
        };
        setModalDefaultDay(map[dayIdx] || "seg");
      } catch {
        setModalDefaultDay("seg");
      }
    }
    setIsAddModalOpen(true);
  };

  const handleSwitchToWeekView = (dateStr: string) => {
    try {
      const parsed = parseDateKey(dateStr);
      setCurrentBaseDate(parsed);
      setViewMode("week");
    } catch {
      // ignore
    }
  };

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
                  onClick={() => onSelectCategory("all")}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                  title="Limpar filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {viewMode === "week"
              ? `${weekCompletedCount} de ${weekTasks.length} tarefas concluídas nesta semana`
              : `${filteredTasks.filter((t) => t.completed).length} de ${filteredTasks.length} tarefas concluídas no total`}
          </p>
        </div>

        {/* Minimal Actions: View Mode Switcher, Category filter, Manage categories, Add task */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher: Semana / Mês */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80">
            <button
              onClick={() => setViewMode("week")}
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
              onClick={() => setViewMode("month")}
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
              onChange={(e) => onSelectCategory(e.target.value)}
              className="h-9.5 pl-3 pr-8 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121020]/80 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#844DFE]/20 cursor-pointer transition-colors"
            >
              <option value="all">Todas as categorias</option>
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
            onClick={() => setIsCategoriesModalOpen(true)}
            className="h-9.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>

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
              {viewMode === "week"
                ? formatWeekRange(currentBaseDate)
                : formatMonthYear(currentBaseDate)}
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
              value={formatDateKey(currentBaseDate)}
              onChange={(e) => {
                if (e.target.value) {
                  setCurrentBaseDate(parseDateKey(e.target.value));
                }
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
            {weekDays.map((wd) => {
              const dayTasks = filteredTasks.filter(
                (t) => t.date === wd.date || (!t.date && t.day === wd.dayOfWeek)
              );

              return (
                <div key={wd.date} className="snap-start">
                  <DayColumn
                    dayInfo={wd}
                    tasks={dayTasks}
                    categoriesMap={categoriesMap}
                    isToday={wd.isToday}
                    onAddTask={(date, dayKey) => handleOpenAddModal(date, dayKey)}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <MonthCalendarView
          baseDate={currentBaseDate}
          tasks={filteredTasks}
          categoriesMap={categoriesMap}
          onSelectDay={(dateStr) => setSelectedDayForDetail(dateStr)}
          onAddTaskForDay={(dateStr) => handleOpenAddModal(dateStr)}
        />
      )}

      {/* Day Detail Modal (opened by clicking any day in Month view) */}
      <DayDetailModal
        isOpen={selectedDayForDetail !== null}
        onClose={() => setSelectedDayForDetail(null)}
        dateStr={selectedDayForDetail}
        tasks={filteredTasks}
        categoriesMap={categoriesMap}
        onAddTaskForDate={(dateStr) => handleOpenAddModal(dateStr)}
        onToggleComplete={onToggleComplete}
        onDeleteTask={onDeleteTask}
        onSwitchToWeekView={handleSwitchToWeekView}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        defaultDate={modalDefaultDate}
        defaultDay={modalDefaultDay}
        onAddTask={onAddTask}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />
    </div>
  );
}
