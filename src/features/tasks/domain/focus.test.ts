import { describe, expect, it } from "vitest";
import { TaskSchema } from "./task.schema";
import { activeFocusTask, focusElapsedSeconds, formatFocusClock, formatFocusDuration, pausedFocusPatch } from "./focus";
import type { Task } from "./task.schema";

const task = {
  id: "1",
  title: "Estudar",
  date: "2026-09-24",
  categoryId: null,
  priority: "media",
  completedAt: null,
  focusSeconds: 90,
  focusStartedAt: null,
  createdAt: "2026-09-24T12:00:00.000Z",
  updatedAt: "2026-09-24T12:00:00.000Z",
} satisfies Task;

describe("focus time", () => {
  it("keeps stored seconds when the session is paused", () => {
    expect(focusElapsedSeconds(task, Date.parse("2026-09-24T13:00:00.000Z"))).toBe(90);
  });

  it("adds the open session on top of stored seconds", () => {
    const running = { ...task, focusStartedAt: "2026-09-24T12:00:00.000Z" };
    const now = Date.parse("2026-09-24T12:01:05.000Z");
    expect(focusElapsedSeconds(running, now)).toBe(155);
  });

  it("commits the open session when pausing", () => {
    const running = { ...task, focusStartedAt: "2026-09-24T12:00:00.000Z" };
    const now = Date.parse("2026-09-24T12:00:30.000Z");
    expect(pausedFocusPatch(running, now)).toEqual({ focusSeconds: 120, focusStartedAt: null });
  });

  it("picks the latest open session", () => {
    const older = { ...task, id: "old", focusStartedAt: "2026-09-24T12:00:00.000Z" };
    const newer = { ...task, id: "new", focusStartedAt: "2026-09-24T12:05:00.000Z" };
    expect(activeFocusTask([older, newer, task])?.id).toBe("new");
    expect(activeFocusTask([task])).toBeNull();
  });

  it("formats the compact label and the clock", () => {
    expect(formatFocusDuration(45)).toBe("45s");
    expect(formatFocusDuration(32 * 60)).toBe("32 min");
    expect(formatFocusDuration(64 * 60)).toBe("1h 04min");
    expect(formatFocusClock(65)).toBe("01:05");
    expect(formatFocusClock(3723)).toBe("1:02:03");
  });

  it("reads tasks saved before focus fields existed", () => {
    const parsed = TaskSchema.parse({
      id: "legacy",
      title: "Antiga",
      date: "2026-09-24",
      categoryId: null,
      priority: "baixa",
      completedAt: null,
      createdAt: "2026-09-24T12:00:00.000Z",
      updatedAt: "2026-09-24T12:00:00.000Z",
    });
    expect(parsed.focusSeconds).toBe(0);
    expect(parsed.focusStartedAt).toBeNull();
  });
});
