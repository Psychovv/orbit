"use client";

import React, { useState, useMemo } from "react";
import { Task, TaskCategory, DayOfWeek } from "@/types/orbit";
import { WEEK_DAYS } from "@/lib/initial-data";
import { DayColumn } from "./day-column";
import { AddTaskModal } from "./add-task-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, X } from "lucide-react";

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
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek>("seg");

  // Map of categories by ID
  const categoriesMap = useMemo(() => {
    const map = new Map<string, TaskCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Determine current day of week (0 is Sunday, 1 is Monday in JS Date)
  const currentDayKey = useMemo<DayOfWeek>(() => {
    const dayIndex = new Date().getDay();
    const map: Record<number, DayOfWeek> = {
      0: "dom",
      1: "seg",
      2: "ter",
      3: "qua",
      4: "qui",
      5: "sex",
      6: "sab",
    };
    return map[dayIndex] || "seg";
  }, []);

  // Filter tasks if category selected
  const filteredTasks = useMemo(() => {
    if (selectedCategoryId === "all") return tasks;
    return tasks.filter((t) => t.categoryId === selectedCategoryId);
  }, [tasks, selectedCategoryId]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleOpenAddModal = (dayKey?: DayOfWeek) => {
    setModalDefaultDay(dayKey || currentDayKey);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Clean, Uncluttered Header with Generous Whitespace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Semana
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
            Segunda a Domingo &bull; {completedTasks} de {totalTasks} concluídas
          </p>
        </div>

        {/* Minimal Actions: Discreet category filter, Manage categories, Add task */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
            <span>Categorias</span>
          </Button>

          {/* Primary Add Task Button using #844DFE */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddModal(currentDayKey)}
            className="h-9.5 text-xs px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Central 7-Day Weekly Board (Segunda a Domingo) */}
      <div className="relative">
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-1 scrollbar-thin scroll-smooth snap-x">
          {WEEK_DAYS.map((wd) => {
            const dayTasks = filteredTasks.filter((t) => t.day === wd.key);
            const isToday = wd.key === currentDayKey;

            return (
              <div key={wd.key} className="snap-start">
                <DayColumn
                  dayInfo={wd}
                  tasks={dayTasks}
                  categoriesMap={categoriesMap}
                  isToday={isToday}
                  onAddTask={handleOpenAddModal}
                  onToggleComplete={onToggleComplete}
                  onDeleteTask={onDeleteTask}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        defaultDay={modalDefaultDay}
        onAddTask={onAddTask}
      />

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
