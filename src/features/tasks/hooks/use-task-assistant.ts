"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestTaskCommand, notifyLocalFallback } from "@/features/assistant/data/assistant.api";
import type { ReviewItem } from "@/features/assistant/components/assistant-review-dialog";
import type { TaskDraft } from "@/features/assistant/domain/actions";
import { addCalendarDays } from "@/features/assistant/domain/bulk-commands";
import { formatShortDate, todayKey } from "@/shared/lib/date-utils";
import { nowIso } from "@/shared/lib/id";
import { pluralSummary } from "@/shared/lib/utils";
import { toast } from "@/shared/ui/toast";
import { pausedFocusPatch } from "../domain/focus";
import type { Task, UpdateTaskInput } from "../domain/task.schema";
import { isCompleted } from "../domain/task.selectors";
import {
  taskCategoriesQuery,
  tasksQuery,
  useCreateTask,
  useCreateTaskCategory,
  useDeleteTask,
  useDeleteTaskCategory,
  useRestoreTask,
  useUpdateTask,
} from "./use-tasks";

/** Tarefas concluídas antes disso não vão para o prompt; pendentes vão sempre. */
const COMPLETED_CONTEXT_DAYS = 7;
const MAX_CONTEXT_TASKS = 500;

const TASK_CATEGORY_PRESETS = [
  { icon: "🪐", color: "#844DFE" },
  { icon: "📚", color: "#3b82f6" },
  { icon: "🎓", color: "#06b6d4" },
  { icon: "⚡", color: "#f59e0b" },
  { icon: "🚀", color: "#10b981" },
  { icon: "🌿", color: "#ec4899" },
];

interface Options {
  /** Um único rascunho sem outras ações: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: TaskDraft) => void;
  /** Revisão antes de aplicar exclusões/edições/categorias. Resolve com os ids aprovados ou `null`. */
  review: (items: ReviewItem[]) => Promise<Set<string> | null>;
  /** Consulta só leitura: mostra a resposta. */
  showAnswer: (text: string) => Promise<void>;
}

/** Envia o texto para a Orbit AI e aplica as ações retornadas. */
export function useTaskAssistant({ onSingleDraft, review, showAnswer }: Options) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const restoreTask = useRestoreTask();
  const createCategory = useCreateTaskCategory();
  const deleteCategory = useDeleteTaskCategory();

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

    const { data: result, source } = await requestTaskCommand({
      text,
      currentDate: today,
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      pendingTasks: context.map((t) => ({ id: t.id, title: t.title, date: t.date, completed: isCompleted(t) })),
    });
    if (source === "local") notifyLocalFallback();

    const byId = new Map(context.map((t) => [t.id, t]));
    const categoryIds = new Set(categories.map((c) => c.id));
    let deleting = [...new Set(result.deleteIds)].flatMap((id) => byId.get(id) ?? []);
    const deletingIds = new Set(deleting.map((t) => t.id));
    let completing = [...new Set(result.completeIds)].flatMap((id) => {
      const task = byId.get(id);
      return task && !isCompleted(task) && !deletingIds.has(id) ? [task] : [];
    });
    let updating = result.updates.flatMap((u) => {
      const task = byId.get(u.id);
      if (!task || deletingIds.has(u.id)) return [];
      const patch: UpdateTaskInput = {};
      if (u.title !== undefined) patch.title = u.title;
      if (u.date !== undefined) patch.date = u.date;
      if (u.time !== undefined) patch.time = u.time;
      if (u.categoryId !== undefined && categoryIds.has(u.categoryId)) patch.categoryId = u.categoryId;
      if (u.priority !== undefined) patch.priority = u.priority;
      if (Object.keys(patch).length === 0) return [];
      return [{ task, patch, update: u }];
    });
    let drafts = result.create.map((draft) => ({
      ...draft,
      categoryId: draft.categoryId && categoryIds.has(draft.categoryId) ? draft.categoryId : undefined,
    }));
    let categoryDrafts = result.createCategories.filter(
      (c) => !categories.some((existing) => existing.name.toLowerCase() === c.name.toLowerCase())
    );

    const hasMutations =
      drafts.length > 0 || completing.length > 0 || deleting.length > 0 || updating.length > 0 || categoryDrafts.length > 0;

    if (!hasMutations) {
      if (result.answer) {
        await showAnswer(result.answer);
        return;
      }
      throw new Error("Não encontrei nada para fazer. Tente reformular o pedido.");
    }

    if (
      drafts.length === 1 &&
      completing.length === 0 &&
      deleting.length === 0 &&
      updating.length === 0 &&
      categoryDrafts.length === 0
    ) {
      onSingleDraft(drafts[0]);
      return;
    }

    const needsReview = deleting.length > 0 || updating.length > 0 || categoryDrafts.length > 0;
    if (needsReview) {
      const approved = await review([
        ...drafts.map((d, i) => ({
          id: `create:${i}`,
          group: "create" as const,
          label: d.title,
          detail: formatShortDate(d.date ?? today),
        })),
        ...updating.map(({ task, patch }) => ({
          id: `update:${task.id}`,
          group: "update" as const,
          label: task.title,
          detail: [
            patch.date ? formatShortDate(patch.date) : null,
            patch.time ?? null,
            patch.priority ?? null,
            patch.title && patch.title !== task.title ? `→ ${patch.title}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
        ...completing.map((t) => ({
          id: `complete:${t.id}`,
          group: "complete" as const,
          label: t.title,
          detail: formatShortDate(t.date),
        })),
        ...deleting.map((t) => ({
          id: `delete:${t.id}`,
          group: "delete" as const,
          label: t.title,
          detail: formatShortDate(t.date),
        })),
        ...categoryDrafts.map((c, i) => ({
          id: `category:${i}`,
          group: "createCategory" as const,
          label: c.name,
        })),
      ]);
      if (!approved) return;
      drafts = drafts.filter((_, i) => approved.has(`create:${i}`));
      updating = updating.filter(({ task }) => approved.has(`update:${task.id}`));
      completing = completing.filter((t) => approved.has(`complete:${t.id}`));
      deleting = deleting.filter((t) => approved.has(`delete:${t.id}`));
      categoryDrafts = categoryDrafts.filter((_, i) => approved.has(`category:${i}`));
    }

    const fallbackCategoryId = categories[0]?.id ?? null;
    const completedAt = nowIso();
    const previousSnapshots = updating.map(({ task }) => task);

    const [createdCategories, created] = await Promise.all([
      Promise.all(
        categoryDrafts.map((draft, i) => {
          const preset = TASK_CATEGORY_PRESETS[i % TASK_CATEGORY_PRESETS.length];
          return createCategory.mutateAsync({ name: draft.name, icon: preset.icon, color: preset.color });
        })
      ),
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
      Promise.all(updating.map(({ task, patch }) => updateTask.mutateAsync({ id: task.id, patch }))),
      Promise.all(deleting.map((t) => deleteTask.mutateAsync(t.id))),
    ]);

    const summary = pluralSummary([
      [createdCategories.length, "categoria", "categorias"],
      [created.length, "criada", "criadas"],
      [updating.length, "editada", "editadas"],
      [completing.length, "concluída", "concluídas"],
      [deleting.length, "excluída", "excluídas"],
    ]);
    if (!summary) return;

    const undo = (
      createdTasks: Task[],
      completed: Task[],
      deletedTasks: Task[],
      previous: Task[],
      categoryIdsCreated: string[]
    ) => {
      createdTasks.forEach((t) => deleteTask.mutate(t.id));
      completed.forEach((t) => updateTask.mutate({ id: t.id, patch: { completedAt: null } }));
      deletedTasks.forEach((t) => restoreTask.mutate(t));
      previous.forEach((t) =>
        updateTask.mutate({
          id: t.id,
          patch: {
            title: t.title,
            date: t.date,
            time: t.time ?? null,
            categoryId: t.categoryId,
            priority: t.priority,
          },
        })
      );
      categoryIdsCreated.forEach((id) => deleteCategory.mutate(id));
    };

    toast({
      tone: "success",
      message: "Orbit AI aplicou as alterações",
      description: `Tarefas: ${summary}`,
      action: {
        label: "Desfazer",
        onClick: () =>
          undo(
            created,
            completing,
            deleting,
            previousSnapshots,
            createdCategories.map((c) => c.id)
          ),
      },
    });
  };
}
