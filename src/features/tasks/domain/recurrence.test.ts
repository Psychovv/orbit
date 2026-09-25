import { describe, it, expect } from "vitest";
import { generateRecurrentTasks } from "./recurrence";

describe("generateRecurrentTasks", () => {
  it("should return the base task if no recurrence is provided", () => {
    const base = { title: "Test", date: "2026-09-25" };
    const result = generateRecurrentTasks(base);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(base);
  });

  it("should generate daily recurrent tasks", () => {
    const base = { title: "Daily Task", date: "2026-09-25" };
    const result = generateRecurrentTasks(base, { pattern: "daily", count: 3 });
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-09-25");
    expect(result[1].date).toBe("2026-09-26");
    expect(result[2].date).toBe("2026-09-27");
  });

  it("should generate weekly recurrent tasks", () => {
    const base = { title: "Weekly Task", date: "2026-09-25" };
    const result = generateRecurrentTasks(base, { pattern: "weekly", count: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-09-25");
    expect(result[1].date).toBe("2026-10-02");
  });

  it("should generate monthly recurrent tasks", () => {
    const base = { title: "Monthly Task", date: "2026-09-25" };
    const result = generateRecurrentTasks(base, { pattern: "monthly", count: 3 });
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-09-25");
    expect(result[1].date).toBe("2026-10-25");
    expect(result[2].date).toBe("2026-11-25");
  });
});
