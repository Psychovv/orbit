import { describe, expect, it } from "vitest";
import { parseOrbitBackup } from "./backup";

const validBackup = {
  version: 1,
  exportedAt: "2026-10-16T12:00:00.000Z",
  tasks: [],
  taskCategories: [{ id: "c1", name: "Estudos", color: "#844DFE", icon: "📚" }],
  transactions: [],
  financeCategories: [
    { id: "f1", name: "Moradia", type: "expense", color: "#ef4444", icon: "🏠" },
  ],
  habits: [],
  habitCheckins: [],
  profile: { id: "owner", name: "Psy", photo: null, bio: null },
};

describe("parseOrbitBackup", () => {
  it("accepts a valid v1 backup", () => {
    expect(parseOrbitBackup(validBackup).profile.name).toBe("Psy");
  });

  it("defaults missing habits arrays for older backups", () => {
    const { habits, habitCheckins, ...legacy } = validBackup;
    void habits;
    void habitCheckins;
    const parsed = parseOrbitBackup(legacy);
    expect(parsed.habits).toEqual([]);
    expect(parsed.habitCheckins).toEqual([]);
  });

  it("rejects missing categories", () => {
    expect(() =>
      parseOrbitBackup({ ...validBackup, taskCategories: [] })
    ).toThrow();
  });

  it("rejects wrong version", () => {
    expect(() => parseOrbitBackup({ ...validBackup, version: 2 })).toThrow();
  });
});
