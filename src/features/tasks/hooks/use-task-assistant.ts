"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestTaskCommand } from "@/features/assistant/data/assistant.api";
import type { ReviewItem } from "@/features/assistant/components/assistant-review-dialog";
import type { TaskDraft } from "@/features/assistant/domain/actions";
import { addCalendarDays } from "@/features/assistant/domain/bulk-commands";
import { formatShortDate, todayKey } from "@/shared/lib/date-utils";
import { nowIso } from "@/shared/lib/id";
import { pluralSummary } from "@/shared/lib/utils";
import { toast } from "@/shared/ui/toast";
import { pausedFocusPatch } from "../domain/focus";
import type { Task } from "../domain/task.schema";
import { isCompleted } from "../domain/task.selectors";
import {
  taskCategoriesQuery,
  tasksQuery,
  useCreateTask,
  useDeleteTask,
  useRestoreTask,
  useUpdateTask,
} from "./use-tasks";

/** Tarefas concluídas antes disso não vão para o prompt; pendentes vão sempre. */
const COMPLETED_CONTEXT_DAYS = 7;
const MAX_CONTEXT_TASKS = 500;

interface Options {
  /** Um único rascunho sem outras ações: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: TaskDraft) => void;
  /** Revisão antes de aplicar exclusões. Resolve com os ids aprovados ou `null`. */
  review: (items: ReviewItem[]) => Promise<Set<string> | null>;
}

/** Envia o texto para a Orbit AI e aplica as ações retornadas (criar, concluir, excluir). */
export function useTaskAssistant({ onSingleDraft, review }: Options) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const restoreTask = useRestoreTask();

  return async (text: string) => {
    const [tasks, categories] = await Promise.all([
      queryClient.fetchQuery(tasksQuery()),
      queryClient.fetchQuery(taskCategoriesQuery()),
    ]);

    const today = todayKey();
    const completedSince = addCalendarDays(today, -COMPLETED_CONTEXT_DAYS);
    const context = tasks
      .filter((t) => !isCompleted(t) || t.date >= completedSince)
      .slice(0, MAX_CONTEXT_TASKS);

    const result = await requestTaskCommand({
      text,
      currentDate: today,
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      pendingTasks: context.map((t) => ({ id: t.id, title: t.title, date: t.date, completed: isCompleted(t) })),
    });

    const byId = new Map(context.map((t) => [t.id, t]));
    const categoryIds = new Set(categories.map((c) => c.id));
    let deleting = [...new Set(result.deleteIds)].flatMap((id) => byId.get(id) ?? []);
    const deletingIds = new Set(deleting.map((t) => t.id));
    let completing = [...new Set(result.completeIds)].flatMap((id) => {
      const task = byId.get(id);
      return task && !isCompleted(task) && !deletingIds.has(id) ? [task] : [];
    });
    let drafts = result.create.map((draft) => ({
      ...draft,
      categoryId: draft.categoryId && categoryIds.has(draft.categoryId) ? draft.categoryId : undefined,
    }));

    if (drafts.length === 0 && completing.length === 0 && deleting.length === 0) {
      throw new Error("Não encontrei nada para fazer. Tente reformular o pedido.");
    }

    if (drafts.length === 1 && completing.length === 0 && deleting.length === 0) {
      onSingleDraft(drafts[0]);
      return;
    }

    if (deleting.length > 0) {
      const approved = await review([
        ...drafts.map((d, i) => ({
          id: `create:${i}`,
          group: "create" as const,
          label: d.title,
          detail: formatShortDate(d.date ?? today),
        })),
        ...completing.map((t) => ({ id: `complete:${t.id}`, group: "complete" as const, label: t.title, detail: formatShortDate(t.date) })),
        ...deleting.map((t) => ({ id: `delete:${t.id}`, group: "delete" as const, label: t.title, detail: formatShortDate(t.date) })),
      ]);
      if (!approved) return;
      drafts = drafts.filter((_, i) => approved.has(`create:${i}`));
      completing = completing.filter((t) => approved.has(`complete:${t.id}`));
      deleting = deleting.filter((t) => approved.has(`delete:${t.id}`));
    }

    const fallbackCategoryId = categories[0]?.id ?? null;
    const completedAt = nowIso();
    const [created] = await Promise.all([
      Promise.all(
        drafts.map((draft) =>
          createTask.mutateAsync({
            title: draft.title,
            date: draft.date ?? today,
            time: draft.time,
            categoryId: draft.categoryId ?? fallbackCategoryId,
            priority: "media",
          })
        )
      ),
      Promise.all(
        completing.map((t) =>
          updateTask.mutateAsync({
            id: t.id,
            patch: { completedAt, ...(t.focusStartedAt ? pausedFocusPatch(t) : {}) },
          })
        )
      ),
      Promise.all(deleting.map((t) => deleteTask.mutateAsync(t.id))),
    ]);

    const summary = pluralSummary([
      [created.length, "criada", "criadas"],
      [completing.length, "concluída", "concluídas"],
      [deleting.length, "excluída", "excluídas"],
    ]);
    if (!summary) return;

    const undo = (createdTasks: Task[], completedTasks: Task[], deletedTasks: Task[]) => {
      createdTasks.forEach((t) => deleteTask.mutate(t.id));
      completedTasks.forEach((t) => updateTask.mutate({ id: t.id, patch: { completedAt: null } }));
      deletedTasks.forEach((t) => restoreTask.mutate(t));
    };

    toast({
      tone: "success",
      message: "Orbit AI aplicou as alterações",
      description: `Tarefas: ${summary}`,
      action: { label: "Desfazer", onClick: () => undo(created, completing, deleting) },
    });
  };
}
