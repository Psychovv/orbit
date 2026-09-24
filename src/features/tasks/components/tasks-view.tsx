"use client";

import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Task, TaskCategory } from "../domain/task.schema";
import { ALL_CATEGORIES, countCompleted, filterByCategory, groupByDate } from "../domain/task.selectors";
import {
  useCreateTask,
  useDeleteTaskWithUndo,
  useMoveTask,
  useTaskCategories,
  useTasks,
  useToggleTaskCompletion,
} from "../hooks/use-tasks";
import { useTasksViewState } from "../hooks/use-tasks-view-state";
import { useTaskAssistant } from "../hooks/use-task-assistant";
import { useTaskDialogs } from "./task-dialogs";
import { DayColumn } from "./day-column";
import { MonthCalendarView } from "./month-calendar-view";
import { DayDetailModal } from "./day-detail-modal";
import { TaskItem } from "./task-item";
import { AssistantButton } from "@/features/assistant/components/assistant-button";
import { useAssistantReview } from "@/features/assistant/components/assistant-review-dialog";
import { Button } from "@/shared/ui/button";
import { PeriodNavigator, pickerInputClass } from "@/shared/ui/period-navigator";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import {
  getWeekDays,
  addWeeks,
  addMonths,
  formatWeekRange,
  formatMonthYear,
  formatDateKey,
  getYearMonthKey,
  isSameMonth,
  monthGridRange,
  parseDateKey,
  weekRange,
} from "@/shared/lib/date-utils";
import { Plus, SlidersHorizontal, X, Columns, LayoutGrid } from "lucide-react";

const VIEW_OPTIONS = [
  { value: "week", label: "Semana", icon: Columns },
  { value: "month", label: "Mês", icon: LayoutGrid },
] as const;

export function TasksView() {
  const { view: viewMode, baseDate, categoryId: categoryParam, setView, setBaseDate, setCategory, showWeekOf } =
    useTasksViewState();
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const dialogs = useTaskDialogs();
  const review = useAssistantReview();

  const range = useMemo(
    () => (viewMode === "week" ? weekRange(baseDate) : monthGridRange(baseDate)),
    [viewMode, baseDate]
  );
  const tasksQuery = useTasks(range);
  const categoriesQuery = useTaskCategories();
  const toggleComplete = useToggleTaskCompletion();
  const deleteTask = useDeleteTaskWithUndo();
  const moveTask = useMoveTask();
  const createTask = useCreateTask();
  const runAssistant = useTaskAssistant({
    onSingleDraft: (draft) => dialogs.openAddTask(draft),
    review: review.request,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const activeCategory = categories.find((c) => c.id === categoryParam);
  const selectedCategoryId = activeCategory?.id ?? ALL_CATEGORIES;

  const categoriesMap = useMemo(() => {
    const map = new Map<string, TaskCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const today = new Date();
  const isCurrentPeriod =
    viewMode === "week" ? weekRange(baseDate).from === weekRange(today).from : isSameMonth(baseDate, today);

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
  const handleOpenAddModal = (date?: string, title?: string) => dialogs.openAddTask({ date, title });
  const handleQuickAdd = (date: string, title: string) =>
    createTask.mutate({
      title,
      date,
      categoryId: activeCategory?.id ?? categories[0]?.id ?? null,
      priority: "media",
    });

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingTask((event.active.data.current?.task as Task | undefined) ?? null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    const task = event.active.data.current?.task as Task | undefined;
    if (task && event.over) moveTask(task, String(event.over.id));
  };

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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-brand/10 text-brand dark:text-brand-soft border border-brand/20">
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
          <SegmentedControl label="Modo de visualização" value={viewMode} options={VIEW_OPTIONS} onChange={setView} />

          {/* Discreet Category Filter */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filtrar por categoria"
              className="h-9.5 pl-3 pr-8 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121020]/80 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer transition-colors"
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

          {/* Primary Add Task Button */}
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

      <PeriodNavigator
        label={viewMode === "week" ? formatWeekRange(baseDate) : formatMonthYear(baseDate)}
        prevTitle={viewMode === "week" ? "Semana anterior" : "Mês anterior"}
        nextTitle={viewMode === "week" ? "Próxima semana" : "Próximo mês"}
        onPrev={handlePrev}
        onNext={handleNext}
        isCurrent={isCurrentPeriod}
        resetLabel={viewMode === "week" ? "Semana atual" : "Mês atual"}
        currentLabel={viewMode === "week" ? "Esta semana" : "Este mês"}
        onReset={() => setBaseDate(null)}
      >
        <input
          type="date"
          value={formatDateKey(baseDate)}
          onChange={(e) => {
            if (e.target.value) setBaseDate(parseDateKey(e.target.value));
          }}
          title="Ir para data específica"
          aria-label="Ir para data específica"
          className={pickerInputClass}
        />
      </PeriodNavigator>

      {/* Main View: Week (7 Columns) or Month (Grid) */}
      {viewMode === "week" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingTask(null)}
        >
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
                    onQuickAdd={handleQuickAdd}
                    onToggleComplete={toggleComplete}
                    onDeleteTask={deleteTask}
                  />
                </div>
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {draggingTask && (
              <div className="w-[290px] rotate-2 cursor-grabbing shadow-2xl shadow-brand/20 rounded-xl">
                <TaskItem
                  task={draggingTask}
                  category={draggingTask.categoryId ? categoriesMap.get(draggingTask.categoryId) : undefined}
                  onToggleComplete={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
        onDeleteTask={deleteTask}
        onSwitchToWeekView={showWeekOf}
      />

      {review.dialog}
    </div>
  );
}
