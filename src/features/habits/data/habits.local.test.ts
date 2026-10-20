import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateHabitInput } from "../domain/habit.schema";
import {
  createLocalHabitCheckinsRepository,
  createLocalHabitsRepository,
  HABITS_STORAGE_KEYS,
} from "./habits.local";

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

const water: CreateHabitInput = {
  name: "Beber água",
  icon: "💧",
  color: "#3b82f6",
  period: "anytime",
  type: "numeric",
  targetValue: 2000,
  unit: "ml",
  step: 250,
  frequencyType: "daily",
};

const reading: CreateHabitInput = {
  name: "Ler",
  icon: "📖",
  color: "#844DFE",
  period: "evening",
  type: "boolean",
  frequencyType: "specific_days",
  frequencyDays: [1, 3, 5],
};

describe("local habits repository", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
    store.set(HABITS_STORAGE_KEYS.habits, "[]");
    store.set(HABITS_STORAGE_KEYS.checkins, "[]");
  });

  it("seeds demo habits on first read", async () => {
    store.clear();
    const habits = await createLocalHabitsRepository().list();
    expect(habits.length).toBeGreaterThan(0);
    expect(store.has(HABITS_STORAGE_KEYS.habits)).toBe(true);
  });

  it("creates habits newest first", async () => {
    const repo = createLocalHabitsRepository();
    await repo.create(water);
    await repo.create(reading);
    expect((await repo.list()).map((h) => h.name)).toEqual(["Ler", "Beber água"]);
  });

  it("drops fields that do not apply to the habit type or frequency", async () => {
    const repo = createLocalHabitsRepository();
    const habit = await repo.create({ ...reading, targetValue: 5, unit: "pág", step: 1, weeklyTargetCount: 3 });
    expect(habit).not.toHaveProperty("targetValue");
    expect(habit).not.toHaveProperty("unit");
    expect(habit).not.toHaveProperty("weeklyTargetCount");
    expect(habit.frequencyDays).toEqual([1, 3, 5]);
  });

  it("rejects incomplete numeric habits", async () => {
    const repo = createLocalHabitsRepository();
    await expect(repo.create({ ...water, unit: undefined })).rejects.toThrow();
  });

  it("clears numeric fields when switching to boolean", async () => {
    const repo = createLocalHabitsRepository();
    const habit = await repo.create(water);
    const updated = await repo.update(habit.id, { type: "boolean" });
    expect(updated.type).toBe("boolean");
    expect(updated).not.toHaveProperty("targetValue");
    expect(updated).not.toHaveProperty("step");
  });

  it("removes optional fields patched with null", async () => {
    const repo = createLocalHabitsRepository();
    const habit = await repo.create({ ...water, description: "Meta diária" });
    const updated = await repo.update(habit.id, { description: null });
    expect(updated).not.toHaveProperty("description");
  });

  it("throws when updating a missing habit", async () => {
    await expect(createLocalHabitsRepository().update("nope", { name: "X" })).rejects.toThrow("Habit nope not found");
  });

  it("hides archived habits unless requested", async () => {
    const repo = createLocalHabitsRepository();
    const habit = await repo.create(water);
    await repo.update(habit.id, { archivedAt: "2026-10-20T12:00:00.000Z" });
    expect(await repo.list()).toEqual([]);
    expect(await repo.list(true)).toHaveLength(1);
  });

  it("removes the habit together with its check-ins", async () => {
    const habits = createLocalHabitsRepository();
    const checkins = createLocalHabitCheckinsRepository();
    const keep = await habits.create(reading);
    const drop = await habits.create(water);
    await checkins.upsert({ habitId: keep.id, date: "2026-10-20", completed: true });
    await checkins.upsert({ habitId: drop.id, date: "2026-10-20", currentValue: 500 });

    await habits.remove(drop.id);

    expect((await habits.list()).map((h) => h.id)).toEqual([keep.id]);
    const left = await checkins.list({ from: "2026-10-01", to: "2026-10-31" });
    expect(left.map((c) => c.habitId)).toEqual([keep.id]);
  });
});

describe("local habit check-ins repository", () => {
  beforeEach(() => {
    const store = installLocalStorage();
    store.set(HABITS_STORAGE_KEYS.habits, "[]");
    store.set(HABITS_STORAGE_KEYS.checkins, "[]");
  });

  it("updates the same check-in for a habit and day", async () => {
    const repo = createLocalHabitCheckinsRepository();
    const first = await repo.upsert({ habitId: "h", date: "2026-10-20", currentValue: 250, notes: "manhã" });
    const second = await repo.upsert({ habitId: "h", date: "2026-10-20", currentValue: 500 });

    expect(second).toMatchObject({ id: first?.id, createdAt: first?.createdAt, currentValue: 500, notes: "manhã" });
    expect(await repo.list({ from: "2026-10-20", to: "2026-10-20" })).toHaveLength(1);
  });

  it("defaults completed to false and keeps the previous value", async () => {
    const repo = createLocalHabitCheckinsRepository();
    expect((await repo.upsert({ habitId: "h", date: "2026-10-20" }))?.completed).toBe(false);
    await repo.upsert({ habitId: "h", date: "2026-10-20", completed: true });
    expect((await repo.upsert({ habitId: "h", date: "2026-10-20", currentValue: 1 }))?.completed).toBe(true);
  });

  it("removes notes patched with null", async () => {
    const repo = createLocalHabitCheckinsRepository();
    await repo.upsert({ habitId: "h", date: "2026-10-20", notes: "ok" });
    const updated = await repo.upsert({ habitId: "h", date: "2026-10-20", notes: null });
    expect(updated).not.toHaveProperty("notes");
  });

  it("clears a check-in", async () => {
    const repo = createLocalHabitCheckinsRepository();
    await repo.upsert({ habitId: "h", date: "2026-10-20", completed: true });
    expect(await repo.upsert({ habitId: "h", date: "2026-10-20", clear: true })).toBeNull();
    expect(await repo.list({ from: "2026-10-20", to: "2026-10-20" })).toEqual([]);
  });

  it("filters by date range", async () => {
    const repo = createLocalHabitCheckinsRepository();
    await repo.upsert({ habitId: "h", date: "2026-10-19", completed: true });
    await repo.upsert({ habitId: "h", date: "2026-10-27", completed: true });
    const week = await repo.list({ from: "2026-10-19", to: "2026-10-25" });
    expect(week.map((c) => c.date)).toEqual(["2026-10-19"]);
  });
});
