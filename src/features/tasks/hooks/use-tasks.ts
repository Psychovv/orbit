"use client";

import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { repositories } from "@/config/data-source";
import { isInRange, type DateRange } from "@/shared/lib/date-utils";
import { createId, nowIso } from "@/shared/lib/id";
import { patchRangedLists, rangedListKey } from "@/shared/lib/query-cache";
import type {
  CreateTaskCategoryInput,
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from "../domain/task.schema";
import { pausedFocusPatch } from "../domain/focus";
import { isCompleted } from "../domain/task.selectors";

const TASKS = "tasks";
const TASK_CATEGORIES = "task-categories";

export const tasksQuery = (range?: DateRange) =>
  queryOptions({
    queryKey: rangedListKey(TASKS, range),
    queryFn: () => repositories.tasks.list(range),
  });

export const taskCategoriesQuery = () =>
  queryOptions({
    queryKey: [TASK_CATEGORIES],
    queryFn: () => repositories.taskCategories.list(),
  });

export function useTasks(range?: DateRange) {
  return useQuery({ ...tasksQuery(range), placeholderData: keepPreviousData });
}

export function useTaskCategories() {
  return useQuery(taskCategoriesQuery());
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => repositories.tasks.create(input),
    onMutate: (input) => {
      const now = nowIso();
      const optimistic: Task = {
        ...input,
        id: `temp-${createId()}`,
        completedAt: null,
        focusSeconds: 0,
        focusStartedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      return patchRangedLists<Task>(queryClient, TASKS, (tasks, range) =>
        !range || isInRange(input.date, range) ? [optimistic, ...tasks] : tasks
      );
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TASKS] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      repositories.tasks.update(id, patch),
    onMutate: ({ id, patch }) =>
      patchRangedLists<Task>(queryClient, TASKS, (tasks) =>
        tasks.map((t) => {
          if (t.id !== id) return t;
          const { description, time, ...rest } = patch;
          const next: Task = { ...t, ...rest };
          if (description === null) delete next.description;
          else if (description !== undefined) next.description = description;
          if (time === null) delete next.time;
          else if (time !== undefined) next.time = time;
          return next;
        })
      ),
    onError: (_error, _vars, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TASKS] }),
  });
}

export function useToggleTaskCompletion() {
  const update = useUpdateTask();
  return (task: Task) => {
    const completing = !isCompleted(task);
    update.mutate({
      id: task.id,
      patch: {
        completedAt: completing ? nowIso() : null,
        ...(completing && task.focusStartedAt ? pausedFocusPatch(task) : {}),
      },
    });
  };
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.tasks.remove(id),
    onMutate: (id) =>
      patchRangedLists<Task>(queryClient, TASKS, (tasks) => tasks.filter((t) => t.id !== id)),
    onError: (_error, _id, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TASKS] }),
  });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskCategoryInput) => repositories.taskCategories.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TASK_CATEGORIES] }),
  });
}

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.taskCategories.remove(id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [TASK_CATEGORIES] }),
        queryClient.invalidateQueries({ queryKey: [TASKS] }),
      ]),
  });
}
