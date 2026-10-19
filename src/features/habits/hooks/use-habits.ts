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
  CreateHabitInput,
  Habit,
  HabitCheckin,
  UpdateHabitInput,
} from "../domain/habit.schema";
import { isCheckinComplete } from "../domain/habit.streak";

const HABITS = "habits";
const HABIT_CHECKINS = "habit-checkins";

export const habitsQuery = (includeArchived = false) =>
  queryOptions({
    queryKey: [HABITS, "list", includeArchived ? "all" : "active"],
    queryFn: () => repositories.habits.list(includeArchived),
  });

export const habitCheckinsQuery = (range: DateRange) =>
  queryOptions({
    queryKey: rangedListKey(HABIT_CHECKINS, range),
    queryFn: () => repositories.habitCheckins.list(range),
  });

export function useHabits(includeArchived = false) {
  return useQuery({ ...habitsQuery(includeArchived), placeholderData: keepPreviousData });
}

export function useHabitCheckins(range: DateRange) {
  return useQuery({ ...habitCheckinsQuery(range), placeholderData: keepPreviousData });
}

function invalidateHabits(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [HABITS] }),
    queryClient.invalidateQueries({ queryKey: [HABIT_CHECKINS] }),
  ]);
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHabitInput) => repositories.habits.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [HABITS] });
      const now = nowIso();
      const optimistic: Habit = {
        ...input,
        id: `temp-${createId()}`,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const snapshots = queryClient.getQueriesData<Habit[]>({ queryKey: [HABITS] });
      for (const [key] of snapshots) {
        queryClient.setQueryData<Habit[]>(key, (habits) =>
          habits ? [optimistic, ...habits] : [optimistic]
        );
      }
      return () => snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onError: (_e, _i, rollback) => rollback?.(),
    onSettled: () => invalidateHabits(queryClient),
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateHabitInput }) =>
      repositories.habits.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: [HABITS] });
      const snapshots = queryClient.getQueriesData<Habit[]>({ queryKey: [HABITS] });
      for (const [key] of snapshots) {
        queryClient.setQueryData<Habit[]>(key, (habits) =>
          habits?.map((h) => {
            if (h.id !== id) return h;
            const next: Habit = { ...h, ...Object.fromEntries(
              Object.entries(patch).filter(([, v]) => v !== null && v !== undefined)
            ), updatedAt: nowIso() };
            if (patch.description === null) delete next.description;
            if (patch.archivedAt !== undefined) next.archivedAt = patch.archivedAt;
            return next;
          })
        );
      }
      return () => snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onError: (_e, _v, rollback) => rollback?.(),
    onSettled: () => invalidateHabits(queryClient),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.habits.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [HABITS] });
      const snapshots = queryClient.getQueriesData<Habit[]>({ queryKey: [HABITS] });
      for (const [key] of snapshots) {
        queryClient.setQueryData<Habit[]>(key, (habits) => habits?.filter((h) => h.id !== id));
      }
      return () => snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onError: (_e, _id, rollback) => rollback?.(),
    onSettled: () => invalidateHabits(queryClient),
  });
}

export function useToggleHabitCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habit,
      date,
      checkin,
    }: {
      habit: Habit;
      date: string;
      checkin?: HabitCheckin;
    }) => {
      const done = isCheckinComplete(habit, checkin);
      if (done) {
        return repositories.habitCheckins.upsert({
          habitId: habit.id,
          date,
          clear: true,
        });
      }
      if (habit.type === "numeric") {
        return repositories.habitCheckins.upsert({
          habitId: habit.id,
          date,
          completed: true,
          currentValue: habit.targetValue ?? checkin?.currentValue ?? 0,
        });
      }
      return repositories.habitCheckins.upsert({
        habitId: habit.id,
        date,
        completed: true,
      });
    },
    onMutate: async ({ habit, date, checkin }) => {
      const done = isCheckinComplete(habit, checkin);
      return patchRangedLists<HabitCheckin>(queryClient, HABIT_CHECKINS, (items, range) => {
        if (range && !isInRange(date, range)) return items;
        if (done) {
          return items.filter((c) => !(c.habitId === habit.id && c.date === date));
        }
        const optimistic: HabitCheckin = {
          id: checkin?.id ?? `temp-${createId()}`,
          habitId: habit.id,
          date,
          completed: true,
          currentValue:
            habit.type === "numeric"
              ? (habit.targetValue ?? checkin?.currentValue ?? 0)
              : checkin?.currentValue,
          createdAt: checkin?.createdAt ?? nowIso(),
        };
        if (optimistic.currentValue === undefined) delete optimistic.currentValue;
        const without = items.filter((c) => !(c.habitId === habit.id && c.date === date));
        return [optimistic, ...without];
      });
    },
    onError: (_e, _v, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [HABIT_CHECKINS] }),
  });
}

export function useUpdateHabitValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habit,
      date,
      delta,
      checkin,
    }: {
      habit: Habit;
      date: string;
      delta: number;
      checkin?: HabitCheckin;
    }) => {
      const current = checkin?.currentValue ?? 0;
      const next = Math.max(0, current + delta);
      const target = habit.targetValue ?? 0;
      if (next <= 0 && !checkin?.completed) {
        return repositories.habitCheckins.upsert({
          habitId: habit.id,
          date,
          clear: true,
        });
      }
      return repositories.habitCheckins.upsert({
        habitId: habit.id,
        date,
        currentValue: next,
        completed: target > 0 ? next >= target : false,
      });
    },
    onMutate: async ({ habit, date, delta, checkin }) => {
      const current = checkin?.currentValue ?? 0;
      const nextValue = Math.max(0, current + delta);
      const target = habit.targetValue ?? 0;

      return patchRangedLists<HabitCheckin>(queryClient, HABIT_CHECKINS, (items, range) => {
        if (range && !isInRange(date, range)) return items;
        if (nextValue <= 0 && !checkin?.completed) {
          return items.filter((c) => !(c.habitId === habit.id && c.date === date));
        }
        const optimistic: HabitCheckin = {
          id: checkin?.id ?? `temp-${createId()}`,
          habitId: habit.id,
          date,
          completed: target > 0 ? nextValue >= target : false,
          currentValue: nextValue,
          createdAt: checkin?.createdAt ?? nowIso(),
        };
        const without = items.filter((c) => !(c.habitId === habit.id && c.date === date));
        return [optimistic, ...without];
      });
    },
    onError: (_e, _v, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [HABIT_CHECKINS] }),
  });
}
