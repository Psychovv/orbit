"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AddTaskModal, type TaskFormDefaults } from "./add-task-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import {
  useCreateTask,
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useTaskCategories,
} from "../hooks/use-tasks";

interface TaskDialogsContextValue {
  openAddTask: (defaults?: TaskFormDefaults) => void;
  openCategories: () => void;
}

const TaskDialogsContext = createContext<TaskDialogsContextValue | null>(null);

export function useTaskDialogs(): TaskDialogsContextValue {
  const ctx = useContext(TaskDialogsContext);
  if (!ctx) throw new Error("useTaskDialogs must be used inside <TaskDialogsProvider>");
  return ctx;
}

/** Monta os modais de tarefa uma vez e permite abri-los de qualquer tela (sidebar, calendário, IA). */
export function TaskDialogsProvider({ children }: { children: React.ReactNode }) {
  const [addTaskDefaults, setAddTaskDefaults] = useState<TaskFormDefaults | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const { data: categories = [] } = useTaskCategories();
  const createTask = useCreateTask();
  const createCategory = useCreateTaskCategory();
  const deleteCategory = useDeleteTaskCategory();

  const value = useMemo<TaskDialogsContextValue>(
    () => ({
      openAddTask: (defaults = {}) => setAddTaskDefaults(defaults),
      openCategories: () => setIsCategoriesOpen(true),
    }),
    []
  );

  return (
    <TaskDialogsContext.Provider value={value}>
      {children}

      <AddTaskModal
        isOpen={addTaskDefaults !== null}
        onClose={() => setAddTaskDefaults(null)}
        categories={categories}
        defaults={addTaskDefaults ?? {}}
        onSubmit={(input) => createTask.mutate(input)}
      />

      <ManageCategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onAddCategory={(input) => createCategory.mutate(input)}
        onDeleteCategory={(id) => deleteCategory.mutate(id)}
      />
    </TaskDialogsContext.Provider>
  );
}
