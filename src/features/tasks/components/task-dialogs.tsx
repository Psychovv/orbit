"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AddTaskModal, type TaskFormDefaults } from "./add-task-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import { FocusBar } from "./focus-bar";
import { TaskDetailDialog } from "./task-detail-dialog";
import { FocusSessionProvider, useFocusSession } from "../hooks/use-focus-session";
import {
  useCreateTask,
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useTaskCategories,
  useTasks,
  useUpdateTask,
} from "../hooks/use-tasks";

interface TaskDialogsContextValue {
  openAddTask: (defaults?: TaskFormDefaults) => void;
  openCategories: () => void;
  openTask: (id: string) => void;
}

const TaskDialogsContext = createContext<TaskDialogsContextValue | null>(null);

export function useTaskDialogs(): TaskDialogsContextValue {
  const ctx = useContext(TaskDialogsContext);
  if (!ctx) throw new Error("useTaskDialogs must be used inside <TaskDialogsProvider>");
  return ctx;
}

/** Monta os modais de tarefa uma vez e permite abri-los de qualquer tela (sidebar, calendário, IA). */
export function TaskDialogsProvider({ children }: { children: React.ReactNode }) {
  return (
    <FocusSessionProvider>
      <TaskDialogsInner>{children}</TaskDialogsInner>
    </FocusSessionProvider>
  );
}

function TaskDialogsInner({ children }: { children: React.ReactNode }) {
  const [addTaskDefaults, setAddTaskDefaults] = useState<TaskFormDefaults | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const { data: categories = [] } = useTaskCategories();
  const { data: tasks = [] } = useTasks();
  const session = useFocusSession();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createCategory = useCreateTaskCategory();
  const deleteCategory = useDeleteTaskCategory();

  const detailTask = tasks.find((task) => task.id === openTaskId) ?? null;
  const detailCategory = detailTask?.categoryId
    ? categories.find((category) => category.id === detailTask.categoryId)
    : undefined;
  const barTask = session.active && session.active.id !== openTaskId ? session.active : null;

  const value = useMemo<TaskDialogsContextValue>(
    () => ({
      openAddTask: (defaults = {}) => setAddTaskDefaults(defaults),
      openCategories: () => setIsCategoriesOpen(true),
      openTask: (id: string) => setOpenTaskId(id),
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

      <TaskDetailDialog
        task={detailTask}
        categories={categories}
        category={detailCategory}
        elapsedSeconds={detailTask ? session.elapsed(detailTask) : 0}
        isRunning={detailTask?.id === session.active?.id}
        onClose={() => setOpenTaskId(null)}
        onStart={() => detailTask && void session.start(detailTask)}
        onPause={() => detailTask && void session.pause(detailTask)}
        onComplete={() => detailTask && void session.complete(detailTask)}
        onSave={(patch) => detailTask && updateTask.mutate({ id: detailTask.id, patch })}
      />

      <FocusBar
        task={barTask}
        elapsedSeconds={barTask ? session.elapsed(barTask) : 0}
        onPause={() => barTask && void session.pause(barTask)}
        onExpand={() => barTask && setOpenTaskId(barTask.id)}
      />
    </TaskDialogsContext.Provider>
  );
}
