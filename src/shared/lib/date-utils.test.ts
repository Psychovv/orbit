import { describe, expect, it } from "vitest";
import {
  getDayOfWeek,
  isDateKey,
  isInRange,
  isYearMonthKey,
  monthGridRange,
  monthRange,
  parseDateKey,
  weekRange,
} from "./date-utils";

describe("date-utils", () => {
  it("returns the weekday key for a date", () => {
    expect(getDayOfWeek("2026-09-24")).toBe("qui");
    expect(getDayOfWeek("2026-09-27")).toBe("dom");
    expect(getDayOfWeek("2026-09-21")).toBe("seg");
  });

  it("builds a Monday-to-Sunday week range", () => {
    expect(weekRange(parseDateKey("2026-09-24"))).toEqual({ from: "2026-09-21", to: "2026-09-27" });
    expect(weekRange(parseDateKey("2026-09-27"))).toEqual({ from: "2026-09-21", to: "2026-09-27" });
  });

  it("builds month and 42-day grid ranges", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthGridRange(parseDateKey("2026-09-15"))).toEqual({ from: "2026-08-31", to: "2026-10-11" });
  });

  it("checks inclusive ranges", () => {
    const range = { from: "2026-09-21", to: "2026-09-27" };
    expect(isInRange("2026-09-21", range)).toBe(true);
    expect(isInRange("2026-09-27", range)).toBe(true);
    expect(isInRange("2026-09-28", range)).toBe(false);
  });

  it("validates date and month keys", () => {
    expect(isDateKey("2026-09-24")).toBe(true);
    expect(isDateKey("24/09/2026")).toBe(false);
    expect(isYearMonthKey("2026-09")).toBe(true);
    expect(isYearMonthKey("2026-13")).toBe(false);
  });
});
