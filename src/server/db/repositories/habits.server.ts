import { and, eq, gte, lte } from "drizzle-orm";
import type {
  HabitCheckinsRepository,
  HabitsRepository,
} from "@/features/habits/data/habits.repository";
import type {
  CreateHabitInput,
  Habit,
  HabitCheckin,
  UpdateHabitInput,
  UpsertHabitCheckinInput,
  Weekday,
} from "@/features/habits/domain/habit.schema";
import { CreateHabitSchema, UpdateHabitSchema, UpsertHabitCheckinSchema } from "@/features/habits/domain/habit.schema";
import { createId, nowIso } from "@/shared/lib/id";
import { db } from "../index";
import { habitCheckins, habits } from "../schema";

function parseFrequencyDays(raw: string | null): Weekday[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter((n): n is Weekday => typeof n === "number" && n >= 0 && n <= 6);
  } catch {
    return undefined;
  }
}

function rowToHabit(row: typeof habits.$inferSelect): Habit {
  const habit: Habit = {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    period: row.period,
    type: row.type,
    frequencyType: row.frequencyType,
    archivedAt: row.archivedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.description) habit.description = row.description;
  if (row.targetValue != null) habit.targetValue = row.targetValue;
  if (row.unit) habit.unit = row.unit;
  if (row.step != null) habit.step = row.step;
  const days = parseFrequencyDays(row.frequencyDays);
  if (days?.length) habit.frequencyDays = days;
  if (row.weeklyTargetCount != null) habit.weeklyTargetCount = row.weeklyTargetCount;
  return habit;
}

function habitToRow(habit: Habit) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description ?? null,
    icon: habit.icon,
    color: habit.color,
    period: habit.period,
    type: habit.type,
    targetValue: habit.targetValue ?? null,
    unit: habit.unit ?? null,
    step: habit.step ?? null,
    frequencyType: habit.frequencyType,
    frequencyDays: habit.frequencyDays ? JSON.stringify(habit.frequencyDays) : null,
    weeklyTargetCount: habit.weeklyTargetCount ?? null,
    archivedAt: habit.archivedAt,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
  };
}

function rowToCheckin(row: typeof habitCheckins.$inferSelect): HabitCheckin {
  const checkin: HabitCheckin = {
    id: row.id,
    habitId: row.habitId,
    date: row.date,
    completed: row.completed,
    createdAt: row.createdAt,
  };
  if (row.currentValue != null) checkin.currentValue = row.currentValue;
  if (row.notes) checkin.notes = row.notes;
  return checkin;
}

export function createServerHabitsRepository(): HabitsRepository {
  return {
    async list(includeArchived = false) {
      const rows = await db.select().from(habits);
      const mapped = rows.map(rowToHabit);
      return includeArchived ? mapped : mapped.filter((h) => !h.archivedAt);
    },

    async create(input: CreateHabitInput) {
      const data = CreateHabitSchema.parse(input);
      const now = nowIso();
      const habit: Habit = {
        ...data,
        id: createId(),
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(habits).values(habitToRow(habit));
      return habit;
    },

    async update(id: string, patch: UpdateHabitInput) {
      const data = UpdateHabitSchema.parse(patch);
      const currentArr = await db.select().from(habits).where(eq(habits.id, id));
      if (currentArr.length === 0) throw new Error(`Habit ${id} not found`);
      const current = rowToHabit(currentArr[0]);

      const merged: Habit = {
        ...current,
        ...Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
        ),
        updatedAt: nowIso(),
      };

      if (data.description === null || data.description === "") delete merged.description;
      if (data.targetValue === null) delete merged.targetValue;
      if (data.unit === null || data.unit === "") delete merged.unit;
      if (data.step === null) delete merged.step;
      if (data.frequencyDays === null) delete merged.frequencyDays;
      if (data.weeklyTargetCount === null) delete merged.weeklyTargetCount;
      if (data.archivedAt !== undefined) merged.archivedAt = data.archivedAt;

      if (merged.type !== "numeric") {
        delete merged.targetValue;
        delete merged.unit;
        delete merged.step;
      }
      if (merged.frequencyType !== "specific_days") delete merged.frequencyDays;
      if (merged.frequencyType !== "weekly_target") delete merged.weeklyTargetCount;

      await db.update(habits).set(habitToRow(merged)).where(eq(habits.id, id));
      return merged;
    },

    async remove(id: string) {
      await db.transaction(async (tx) => {
        await tx.delete(habitCheckins).where(eq(habitCheckins.habitId, id));
        await tx.delete(habits).where(eq(habits.id, id));
      });
    },
  };
}

export function createServerHabitCheckinsRepository(): HabitCheckinsRepository {
  return {
    async list(range) {
      const rows = await db
        .select()
        .from(habitCheckins)
        .where(and(gte(habitCheckins.date, range.from), lte(habitCheckins.date, range.to)));
      return rows.map(rowToCheckin);
    },

    async upsert(input: UpsertHabitCheckinInput) {
      const data = UpsertHabitCheckinSchema.parse(input);
      const existingArr = await db
        .select()
        .from(habitCheckins)
        .where(and(eq(habitCheckins.habitId, data.habitId), eq(habitCheckins.date, data.date)));
      const existing = existingArr[0] ? rowToCheckin(existingArr[0]) : null;

      if (data.clear) {
        if (existing) {
          await db.delete(habitCheckins).where(eq(habitCheckins.id, existing.id));
        }
        return null;
      }

      const next: HabitCheckin = {
        id: existing?.id ?? createId(),
        habitId: data.habitId,
        date: data.date,
        completed: data.completed ?? existing?.completed ?? false,
        createdAt: existing?.createdAt ?? nowIso(),
      };

      if (data.currentValue !== undefined) next.currentValue = data.currentValue;
      else if (existing?.currentValue !== undefined) next.currentValue = existing.currentValue;

      if (data.notes === null) {
        // clear notes
      } else if (data.notes !== undefined) {
        next.notes = data.notes;
      } else if (existing?.notes) {
        next.notes = existing.notes;
      }

      await db
        .insert(habitCheckins)
        .values({
          id: next.id,
          habitId: next.habitId,
          date: next.date,
          completed: next.completed,
          currentValue: next.currentValue ?? null,
          notes: next.notes ?? null,
          createdAt: next.createdAt,
        })
        .onConflictDoUpdate({
          target: habitCheckins.id,
          set: {
            completed: next.completed,
            currentValue: next.currentValue ?? null,
            notes: next.notes ?? null,
          },
        });

      return next;
    },
  };
}

export const habitsRepository = createServerHabitsRepository();
export const habitCheckinsRepository = createServerHabitCheckinsRepository();
