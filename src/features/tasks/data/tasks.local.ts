import { isInRange } from "@/shared/lib/date-utils";
import { createId, nowIso } from "@/shared/lib/id";
import { loadVersionedList, withStoreLock, writeJson } from "@/shared/lib/local-store";
import {
  CreateTaskCategorySchema,
  CreateTaskSchema,
  TaskCategorySchema,
  TaskSchema,
  UpdateTaskSchema,
  type Task,
  type TaskCategory,
} from "../domain/task.schema";
import type { TaskCategoriesRepository, TasksRepository } from "./tasks.repository";

export const TASKS_STORAGE_KEYS = {
  tasks: "orbit_tasks_v2",
  categories: "orbit_task_categories_v2",
  legacyTasks: "orbit_tasks_v1",
  legacyCategories: "orbit_categories_v1",
} as const;

function toIso(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Converte uma tarefa do formato v1 (`completed`, `day`, categoria obrigatória). */
export function migrateLegacyTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const createdAt = toIso(t.createdAt, nowIso());
  const date = typeof t.date === "string" && t.date ? t.date : createdAt.slice(0, 10);

  const parsed = TaskSchema.safeParse({
    id: String(t.id ?? createId()),
    title: t.title,
    description: optionalString(t.description),
    date,
    time: optionalString(t.time),
    categoryId: optionalString(t.categoryId) ?? null,
    priority: t.priority ?? "media",
    completedAt: t.completed === true ? createdAt : null,
    focusSeconds: 0,
    focusStartedAt: null,
    createdAt,
    updatedAt: createdAt,
  });
  return parsed.success ? parsed.data : null;
}

export function migrateLegacyCategory(raw: unknown): TaskCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const parsed = TaskCategorySchema.safeParse({ id: c.id, name: c.name, color: c.color, icon: c.icon });
  return parsed.success ? parsed.data : null;
}

const loadTasks = () =>
  loadVersionedList({
    key: TASKS_STORAGE_KEYS.tasks,
    legacyKey: TASKS_STORAGE_KEYS.legacyTasks,
    schema: TaskSchema,
    migrate: migrateLegacyTask,
    seed: async () => (await import("./demo-data")).DEMO_TASKS,
  });

const loadCategories = () =>
  loadVersionedList({
    key: TASKS_STORAGE_KEYS.categories,
    legacyKey: TASKS_STORAGE_KEYS.legacyCategories,
    schema: TaskCategorySchema,
    migrate: migrateLegacyCategory,
    seed: async () => (await import("./demo-data")).DEMO_TASK_CATEGORIES,
  });

export function createLocalTasksRepository(): TasksRepository {
  return {
    list: (range) =>
      withStoreLock(async () => {
        const tasks = await loadTasks();
        return range ? tasks.filter((t) => isInRange(t.date, range)) : tasks;
      }),

    create: (input) =>
      withStoreLock(async () => {
        const data = CreateTaskSchema.parse(input);
        const now = nowIso();
        const task: Task = {
          ...data,
          id: createId(),
          completedAt: null,
          focusSeconds: 0,
          focusStartedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        writeJson(TASKS_STORAGE_KEYS.tasks, [task, ...(await loadTasks())]);
        return task;
      }),

    update: (id, patch) =>
      withStoreLock(async () => {
        const data = UpdateTaskSchema.parse(patch);
        const tasks = await loadTasks();
        const current = tasks.find((t) => t.id === id);
        if (!current) throw new Error(`Task ${id} not found`);
        const next: Record<string, unknown> = { ...current, ...data, updatedAt: nowIso() };
        if (next.description == null || next.description === "") delete next.description;
        if (next.time == null || next.time === "") delete next.time;
        const updated = TaskSchema.parse(next);
        writeJson(
          TASKS_STORAGE_KEYS.tasks,
          tasks.map((t) => (t.id === id ? updated : t))
        );
        return updated;
      }),

    remove: (id) =>
      withStoreLock(async () => {
        const tasks = await loadTasks();
        writeJson(
          TASKS_STORAGE_KEYS.tasks,
          tasks.filter((t) => t.id !== id)
        );
      }),

    restore: (task) =>
      withStoreLock(async () => {
        const restored = TaskSchema.parse(task);
        const tasks = await loadTasks();
        writeJson(TASKS_STORAGE_KEYS.tasks, [restored, ...tasks.filter((t) => t.id !== restored.id)]);
        return restored;
      }),
  };
}

export function createLocalTaskCategoriesRepository(): TaskCategoriesRepository {
  return {
    list: () => withStoreLock(loadCategories),

    create: (input) =>
      withStoreLock(async () => {
        const category: TaskCategory = { ...CreateTaskCategorySchema.parse(input), id: createId() };
        writeJson(TASKS_STORAGE_KEYS.categories, [...(await loadCategories()), category]);
        return category;
      }),

    remove: (id) =>
      withStoreLock(async () => {
        const categories = await loadCategories();
        writeJson(
          TASKS_STORAGE_KEYS.categories,
          categories.filter((c) => c.id !== id)
        );
        const tasks = await loadTasks();
        writeJson(
          TASKS_STORAGE_KEYS.tasks,
          tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null, updatedAt: nowIso() } : t))
        );
      }),
  };
}
