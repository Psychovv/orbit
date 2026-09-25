import { describe, expect, it } from "vitest";
import type { Task } from "./task.schema";
import {
  computeCurrentStreak,
  computeDayCompletions,
  computeTaskStreakStats,
  streakRange,
} from "./task.streak";

const base = {
  priority: "media" as const,
  focusSeconds: 0,
  focusStartedAt: null,
  categoryId: null,
  createdAt: "2026-09-20T12:00:00.000Z",
  updatedAt: "2026-09-20T12:00:00.000Z",
};

function task(partial: Pick<Task, "id" | "title" | "date" | "completedAt">): Task {
  return { ...base, ...partial };
}

describe("task streak", () => {
  it("builds an inclusive last-N-days range", () => {
    expect(streakRange(7, "2026-09-25")).toEqual({ from: "2026-09-19", to: "2026-09-25" });
  });

  it("computes daily completion percent and perfect days", () => {
    const days = computeDayCompletions(
      [
        task({ id: "1", title: "A", date: "2026-09-23", completedAt: "2026-09-23T10:00:00.000Z" }),
        task({ id: "2", title: "B", date: "2026-09-23", completedAt: null }),
        task({ id: "3", title: "C", date: "2026-09-24", completedAt: "2026-09-24T10:00:00.000Z" }),
      ],
      "2026-09-23",
      "2026-09-25"
    );

    expect(days).toEqual([
      { date: "2026-09-23", total: 2, completed: 1, percent: 50, perfect: false },
      { date: "2026-09-24", total: 1, completed: 1, percent: 100, perfect: true },
      { date: "2026-09-25", total: 0, completed: 0, percent: null, perfect: false },
    ]);
  });

  it("skips empty days and keeps streak when today is still open", () => {
    const days = computeDayCompletions(
      [
        task({ id: "1", title: "A", date: "2026-09-22", completedAt: "2026-09-22T10:00:00.000Z" }),
        task({ id: "2", title: "B", date: "2026-09-24", completedAt: "2026-09-24T10:00:00.000Z" }),
        task({ id: "3", title: "C", date: "2026-09-25", completedAt: null }),
      ],
      "2026-09-22",
      "2026-09-25"
    );

    expect(computeCurrentStreak(days, "2026-09-25")).toBe(2);
  });

  it("summarizes streak, best streak and overall completion", () => {
    const stats = computeTaskStreakStats(
      [
        task({ id: "1", title: "A", date: "2026-09-23", completedAt: "2026-09-23T10:00:00.000Z" }),
        task({ id: "2", title: "B", date: "2026-09-24", completedAt: "2026-09-24T10:00:00.000Z" }),
        task({ id: "3", title: "C", date: "2026-09-25", completedAt: null }),
        task({ id: "4", title: "D", date: "2026-09-25", completedAt: "2026-09-25T10:00:00.000Z" }),
      ],
      3,
      "2026-09-25"
    );

    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(2);
    expect(stats.completionPercent).toBe(75);
    expect(stats.perfectDays).toBe(2);
    expect(stats.activeDays).toBe(3);
  });
});
