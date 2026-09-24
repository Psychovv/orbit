"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AddTaskModal, type TaskFormDefaults } from "./add-task-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import { FocusBar } from "./focus-bar";
import { FocusMode } from "./focus-mode";
import { TaskDetailDialog } from "./task-detail-dialog";
import { FocusSessionProvider, useFocusSession } from "../hooks/use-focus-session";
import {
  useCreateTask,
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useTaskCategories,
  useTasks,
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
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);

  const { data: categories = [] } = useTaskCategories();
  const { data: tasks = [] } = useTasks();
  const session = useFocusSession();
  const createTask = useCreateTask();
  const createCategory = useCreateTaskCategory();
  const deleteCategory = useDeleteTaskCategory();

  const detailTask = tasks.find((task) => task.id === openTaskId) ?? null;
  const focusTask = tasks.find((task) => task.id === focusTaskId) ?? session.active;
  const detailCategory = detailTask?.categoryId
    ? categories.find((category) => category.id === detailTask.categoryId)
    : undefined;

  const enterFocus = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setOpenTaskId(null);
    setFocusTaskId(task.id);
    setFocusOpen(true);
    void session.start(task);
  };

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
        category={detailCategory}
        elapsedSeconds={detailTask ? session.elapsed(detailTask) : 0}
        isRunning={detailTask?.id === session.active?.id}
        onClose={() => setOpenTaskId(null)}
        onEnterFocus={() => detailTask && enterFocus(detailTask.id)}
      />

      <FocusMode
        task={focusOpen ? focusTask : null}
        isOpen={focusOpen && focusTask !== null}
        elapsedSeconds={focusTask ? session.elapsed(focusTask) : 0}
        isRunning={focusTask?.id === session.active?.id}
        onPause={() => focusTask && void session.pause(focusTask)}
        onResume={() => focusTask && void session.start(focusTask)}
        onMinimize={() => setFocusOpen(false)}
        onComplete={() => {
          if (!focusTask) return;
          void session.complete(focusTask);
          setFocusOpen(false);
          setFocusTaskId(null);
        }}
      />

      <FocusBar
        task={!focusOpen ? session.active : null}
        elapsedSeconds={session.active ? session.elapsed(session.active) : 0}
        onPause={() => session.active && void session.pause(session.active)}
        onExpand={() => session.active && enterFocus(session.active.id)}
      />
    </TaskDialogsContext.Provider>
  );
}
