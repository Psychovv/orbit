import { isInRange } from "@/shared/lib/date-utils";
import { createId, nowIso } from "@/shared/lib/id";
import { loadVersionedList, withStoreLock, writeJson } from "@/shared/lib/local-store";
import {
  CreateHabitSchema,
  HabitCheckinSchema,
  HabitSchema,
  UpdateHabitSchema,
  UpsertHabitCheckinSchema,
  type Habit,
  type HabitCheckin,
} from "../domain/habit.schema";
import type { HabitCheckinsRepository, HabitsRepository } from "./habits.repository";

export const HABITS_STORAGE_KEYS = {
  habits: "orbit_habits_v2",
  checkins: "orbit_habit_checkins_v2",
  legacyHabits: "orbit_habits_v1",
  legacyCheckins: "orbit_habit_checkins_v1",
} as const;

const loadHabits = () =>
  loadVersionedList({
    key: HABITS_STORAGE_KEYS.habits,
    legacyKey: HABITS_STORAGE_KEYS.legacyHabits,
    schema: HabitSchema,
    migrate: () => null,
    seed: async () => (await import("./demo-data")).DEMO_HABITS,
  });

const loadCheckins = () =>
  loadVersionedList({
    key: HABITS_STORAGE_KEYS.checkins,
    legacyKey: HABITS_STORAGE_KEYS.legacyCheckins,
    schema: HabitCheckinSchema,
    migrate: () => null,
    seed: async () => (await import("./demo-data")).buildDemoCheckins(),
  });

function normalizeHabitFields(habit: Habit): Habit {
  const next: Habit = { ...habit };
  if (!next.description) delete next.description;
  if (next.type !== "numeric") {
    delete next.targetValue;
    delete next.unit;
    delete next.step;
  }
  if (next.frequencyType !== "specific_days") delete next.frequencyDays;
  if (next.frequencyType !== "weekly_target") delete next.weeklyTargetCount;
  return HabitSchema.parse(next);
}

export function createLocalHabitsRepository(): HabitsRepository {
  return {
    list: (includeArchived = false) =>
      withStoreLock(async () => {
        const habits = await loadHabits();
        return includeArchived ? habits : habits.filter((h) => !h.archivedAt);
      }),

    create: (input) =>
      withStoreLock(async () => {
        const data = CreateHabitSchema.parse(input);
        const now = nowIso();
        const habit = normalizeHabitFields({
          ...data,
          id: createId(),
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        writeJson(HABITS_STORAGE_KEYS.habits, [habit, ...(await loadHabits())]);
        return habit;
      }),

    update: (id, patch) =>
      withStoreLock(async () => {
        const data = UpdateHabitSchema.parse(patch);
        const habits = await loadHabits();
        const current = habits.find((h) => h.id === id);
        if (!current) throw new Error(`Habit ${id} not found`);

        const merged: Record<string, unknown> = {
          ...current,
          ...data,
          updatedAt: nowIso(),
        };

        if (data.description === null || data.description === "") delete merged.description;
        if (data.targetValue === null) delete merged.targetValue;
        if (data.unit === null || data.unit === "") delete merged.unit;
        if (data.step === null) delete merged.step;
        if (data.frequencyDays === null) delete merged.frequencyDays;
        if (data.weeklyTargetCount === null) delete merged.weeklyTargetCount;

        const updated = normalizeHabitFields(HabitSchema.parse(merged));
        writeJson(
          HABITS_STORAGE_KEYS.habits,
          habits.map((h) => (h.id === id ? updated : h))
        );
        return updated;
      }),

    remove: (id) =>
      withStoreLock(async () => {
        const habits = await loadHabits();
        writeJson(
          HABITS_STORAGE_KEYS.habits,
          habits.filter((h) => h.id !== id)
        );
        const checkins = await loadCheckins();
        writeJson(
          HABITS_STORAGE_KEYS.checkins,
          checkins.filter((c) => c.habitId !== id)
        );
      }),
  };
}

export function createLocalHabitCheckinsRepository(): HabitCheckinsRepository {
  return {
    list: (range) =>
      withStoreLock(async () => {
        const checkins = await loadCheckins();
        return checkins.filter((c) => isInRange(c.date, range));
      }),

    upsert: (input) =>
      withStoreLock(async () => {
        const data = UpsertHabitCheckinSchema.parse(input);
        const checkins = await loadCheckins();
        const existingIndex = checkins.findIndex(
          (c) => c.habitId === data.habitId && c.date === data.date
        );

        if (data.clear) {
          if (existingIndex >= 0) {
            writeJson(
              HABITS_STORAGE_KEYS.checkins,
              checkins.filter((_, i) => i !== existingIndex)
            );
          }
          return null;
        }

        const existing = existingIndex >= 0 ? checkins[existingIndex] : null;
        const next: HabitCheckin = HabitCheckinSchema.parse({
          id: existing?.id ?? createId(),
          habitId: data.habitId,
          date: data.date,
          completed: data.completed ?? existing?.completed ?? false,
          currentValue:
            data.currentValue !== undefined
              ? data.currentValue
              : existing?.currentValue,
          notes:
            data.notes === null
              ? undefined
              : data.notes !== undefined
                ? data.notes
                : existing?.notes,
          createdAt: existing?.createdAt ?? nowIso(),
        });

        if (next.currentValue === undefined) delete next.currentValue;
        if (!next.notes) delete next.notes;

        const nextList =
          existingIndex >= 0
            ? checkins.map((c, i) => (i === existingIndex ? next : c))
            : [next, ...checkins];

        writeJson(HABITS_STORAGE_KEYS.checkins, nextList);
        return next;
      }),
  };
}
