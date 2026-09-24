import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalTasksRepository, migrateLegacyTask, TASKS_STORAGE_KEYS } from "./tasks.local";

function installLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

describe("migrateLegacyTask", () => {
  it("converts the v1 shape", () => {
    const task = migrateLegacyTask({
      id: "task-1",
      title: "Treinar",
      date: "2026-09-21",
      day: "seg",
      categoryId: "guitarra",
      completed: true,
      priority: "alta",
      time: "",
      createdAt: "2026-09-20T10:00:00.000Z",
    });
    expect(task).toMatchObject({
      id: "task-1",
      categoryId: "guitarra",
      completedAt: "2026-09-20T10:00:00.000Z",
      time: undefined,
    });
    expect(task).not.toHaveProperty("day");
  });

  it("falls back to createdAt for missing date and null for empty category", () => {
    const task = migrateLegacyTask({ id: "x", title: "Sem data", categoryId: "", createdAt: "2026-09-18T09:00:00.000Z" });
    expect(task).toMatchObject({ date: "2026-09-18", categoryId: null, priority: "media", completedAt: null });
  });

  it("drops invalid items", () => {
    expect(migrateLegacyTask({ id: "x" })).toBeNull();
    expect(migrateLegacyTask("garbage")).toBeNull();
  });
});

describe("local tasks repository", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
  });

  it("migrates v1 data on first read and removes the legacy key", async () => {
    store.set(TASKS_STORAGE_KEYS.legacyTasks, JSON.stringify([{ id: "a", title: "A", date: "2026-09-21", categoryId: "c", completed: false, priority: "baixa", createdAt: "2026-09-20T10:00:00.000Z" }]));
    const repo = createLocalTasksRepository();

    const tasks = await repo.list();
    expect(tasks.map((t) => t.id)).toEqual(["a"]);
    expect(store.has(TASKS_STORAGE_KEYS.legacyTasks)).toBe(false);
    expect(store.has(TASKS_STORAGE_KEYS.tasks)).toBe(true);
  });

  it("does not lose writes when creates run concurrently", async () => {
    store.set(TASKS_STORAGE_KEYS.tasks, "[]");
    const repo = createLocalTasksRepository();
    const input = { title: "T", date: "2026-09-24", categoryId: null, priority: "media" as const };

    await Promise.all([repo.create(input), repo.create(input), repo.create(input)]);
    expect(await repo.list()).toHaveLength(3);
  });

  it("filters by date range", async () => {
    store.set(TASKS_STORAGE_KEYS.tasks, "[]");
    const repo = createLocalTasksRepository();
    await repo.create({ title: "in", date: "2026-09-22", categoryId: null, priority: "media" });
    await repo.create({ title: "out", date: "2026-10-05", categoryId: null, priority: "media" });

    const week = await repo.list({ from: "2026-09-21", to: "2026-09-27" });
    expect(week.map((t) => t.title)).toEqual(["in"]);
  });
});
