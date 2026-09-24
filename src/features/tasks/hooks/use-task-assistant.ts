"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestTaskCommand } from "@/features/assistant/data/assistant.api";
import type { TaskDraft } from "@/features/assistant/domain/actions";
import { todayKey } from "@/shared/lib/date-utils";
import { nowIso } from "@/shared/lib/id";
import { isCompleted } from "../domain/task.selectors";
import {
  taskCategoriesQuery,
  tasksQuery,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "./use-tasks";

interface Options {
  /** Um único rascunho sem outras ações: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: TaskDraft) => void;
}

/** Envia o texto para a Orbit AI e aplica as ações retornadas (criar, concluir, excluir). */
export function useTaskAssistant({ onSingleDraft }: Options) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  return async (text: string) => {
    const [tasks, categories] = await Promise.all([
      queryClient.fetchQuery(tasksQuery()),
      queryClient.fetchQuery(taskCategoriesQuery()),
    ]);

    const result = await requestTaskCommand({
      text,
      currentDate: todayKey(),
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      pendingTasks: tasks.map((t) => ({ id: t.id, title: t.title, date: t.date, completed: isCompleted(t) })),
    });

    const byId = new Map(tasks.map((t) => [t.id, t]));
    const categoryIds = new Set(categories.map((c) => c.id));
    const deleting = new Set(result.deleteIds.filter((id) => byId.has(id)));
    const completing = result.completeIds.filter((id) => {
      const task = byId.get(id);
      return task && !isCompleted(task) && !deleting.has(id);
    });

    const completedAt = nowIso();
    await Promise.all([
      ...completing.map((id) => updateTask.mutateAsync({ id, patch: { completedAt } })),
      ...[...deleting].map((id) => deleteTask.mutateAsync(id)),
    ]);

    const drafts = result.create.map((draft) => ({
      ...draft,
      categoryId: draft.categoryId && categoryIds.has(draft.categoryId) ? draft.categoryId : undefined,
    }));

    if (drafts.length === 1 && completing.length === 0 && deleting.size === 0) {
      onSingleDraft(drafts[0]);
      return;
    }

    const fallbackCategoryId = categories[0]?.id ?? null;
    for (const draft of drafts) {
      await createTask.mutateAsync({
        title: draft.title,
        date: draft.date ?? todayKey(),
        time: draft.time,
        categoryId: draft.categoryId ?? fallbackCategoryId,
        priority: "media",
      });
    }
  };
}
