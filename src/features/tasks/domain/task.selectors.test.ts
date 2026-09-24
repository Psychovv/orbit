import { describe, expect, it } from "vitest";
import type { Task } from "./task.schema";
import { ALL_CATEGORIES, countByCategory, countCompleted, filterByCategory, groupByDate } from "./task.selectors";

const base = {
  priority: "media",
  focusSeconds: 0,
  focusStartedAt: null,
  createdAt: "2026-09-20T12:00:00.000Z",
  updatedAt: "2026-09-20T12:00:00.000Z",
} as const;
const tasks: Task[] = [
  { ...base, id: "1", title: "A", date: "2026-09-21", categoryId: "estudos", completedAt: null },
  { ...base, id: "2", title: "B", date: "2026-09-21", categoryId: "guitarra", completedAt: "2026-09-21T10:00:00.000Z" },
  { ...base, id: "3", title: "C", date: "2026-09-22", categoryId: null, completedAt: null },
];

describe("task selectors", () => {
  it("counts completed tasks", () => {
    expect(countCompleted(tasks)).toBe(1);
  });

  it("filters by category, keeping everything for 'all'", () => {
    expect(filterByCategory(tasks, ALL_CATEGORIES)).toHaveLength(3);
    expect(filterByCategory(tasks, "estudos").map((t) => t.id)).toEqual(["1"]);
  });

  it("groups by date preserving order", () => {
    const grouped = groupByDate(tasks);
    expect(grouped.get("2026-09-21")?.map((t) => t.id)).toEqual(["1", "2"]);
    expect(grouped.get("2026-09-22")?.map((t) => t.id)).toEqual(["3"]);
  });

  it("counts by category ignoring uncategorized tasks", () => {
    const counts = countByCategory(tasks);
    expect(counts.get("estudos")).toBe(1);
    expect(counts.size).toBe(2);
  });
});
