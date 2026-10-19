import { describe, expect, it } from "vitest";
import type { Habit, HabitCheckin } from "./habit.schema";
import {
  computeHabitStreak,
  countCompletedHabitsOn,
  isCheckinComplete,
  isHabitScheduledOn,
} from "./habit.streak";

const baseHabit: Habit = {
  id: "h1",
  name: "Água",
  icon: "💧",
  color: "#3b82f6",
  period: "anytime",
  type: "boolean",
  frequencyType: "daily",
  archivedAt: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
};

function checkin(date: string, completed = true): HabitCheckin {
  return {
    id: `c-${date}`,
    habitId: "h1",
    date,
    completed,
    createdAt: `${date}T12:00:00.000Z`,
  };
}

describe("isHabitScheduledOn", () => {
  it("schedules daily habits every day", () => {
    expect(isHabitScheduledOn(baseHabit, "2026-10-19")).toBe(true);
  });

  it("respects specific weekdays", () => {
    const habit: Habit = {
      ...baseHabit,
      frequencyType: "specific_days",
      frequencyDays: [1, 3, 5], // Seg, Qua, Sex
    };
    // 2026-10-19 = Monday
    expect(isHabitScheduledOn(habit, "2026-10-19")).toBe(true);
    expect(isHabitScheduledOn(habit, "2026-10-20")).toBe(false);
    expect(isHabitScheduledOn(habit, "2026-10-21")).toBe(true);
  });
});

describe("isCheckinComplete", () => {
  it("requires completed for boolean habits", () => {
    expect(isCheckinComplete(baseHabit, checkin("2026-10-19", true))).toBe(true);
    expect(isCheckinComplete(baseHabit, checkin("2026-10-19", false))).toBe(false);
    expect(isCheckinComplete(baseHabit, undefined)).toBe(false);
  });

  it("completes numeric habits when value reaches target", () => {
    const habit: Habit = {
      ...baseHabit,
      type: "numeric",
      targetValue: 2000,
      unit: "ml",
      step: 250,
    };
    expect(
      isCheckinComplete(habit, {
        ...checkin("2026-10-19", false),
        currentValue: 2000,
      })
    ).toBe(true);
    expect(
      isCheckinComplete(habit, {
        ...checkin("2026-10-19", false),
        currentValue: 1500,
      })
    ).toBe(false);
  });
});

describe("computeHabitStreak", () => {
  it("counts consecutive completed days", () => {
    const checkins = [
      checkin("2026-10-16"),
      checkin("2026-10-17"),
      checkin("2026-10-18"),
    ];
    const stats = computeHabitStreak(baseHabit, checkins, "2026-10-18");
    expect(stats.current).toBe(3);
    expect(stats.best).toBe(3);
    expect(stats.status).toBe("active");
  });

  it("does not break when today is still open", () => {
    const checkins = [checkin("2026-10-16"), checkin("2026-10-17")];
    const stats = computeHabitStreak(baseHabit, checkins, "2026-10-18");
    expect(stats.current).toBe(2);
    expect(stats.status).toBe("at_risk");
  });

  it("forgives a single miss sandwiched between completes (Never Miss Twice)", () => {
    const checkins = [
      checkin("2026-10-15"),
      checkin("2026-10-16"),
      // 17 missed
      checkin("2026-10-18"),
      checkin("2026-10-19"),
    ];
    const stats = computeHabitStreak(baseHabit, checkins, "2026-10-19");
    expect(stats.current).toBe(4);
    expect(stats.status).toBe("at_risk");
  });

  it("breaks after two consecutive misses", () => {
    const checkins = [
      checkin("2026-10-14"),
      checkin("2026-10-15"),
      // 16 and 17 missed
      checkin("2026-10-18"),
    ];
    const stats = computeHabitStreak(baseHabit, checkins, "2026-10-18");
    expect(stats.current).toBe(1);
    expect(stats.best).toBeGreaterThanOrEqual(2);
  });

  it("tracks best streak across history", () => {
    const checkins = [
      checkin("2026-10-10"),
      checkin("2026-10-11"),
      checkin("2026-10-12"),
      checkin("2026-10-13"),
      // gap
      checkin("2026-10-18"),
      checkin("2026-10-19"),
    ];
    const stats = computeHabitStreak(baseHabit, checkins, "2026-10-19");
    expect(stats.best).toBe(4);
    expect(stats.current).toBe(2);
  });
});

describe("countCompletedHabitsOn", () => {
  it("summarizes scheduled habits for a day", () => {
    const habits: Habit[] = [
      baseHabit,
      { ...baseHabit, id: "h2", name: "Ler" },
      { ...baseHabit, id: "h3", name: "Arquivado", archivedAt: "2026-10-01T00:00:00.000Z" },
    ];
    const checkins: HabitCheckin[] = [
      { ...checkin("2026-10-19"), habitId: "h1" },
    ];
    expect(countCompletedHabitsOn(habits, checkins, "2026-10-19")).toEqual({
      total: 2,
      completed: 1,
    });
  });
});
