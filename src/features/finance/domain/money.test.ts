import { describe, expect, it } from "vitest";
import { centsToInput, formatBRL, parseAmountInput, toCents } from "./money";

describe("money", () => {
  it("converts reais to integer cents without float drift", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(495.2)).toBe(49520);
  });

  it("parses user input in BR and dot formats", () => {
    expect(parseAmountInput("12,50")).toBe(1250);
    expect(parseAmountInput("1.234,56")).toBe(123456);
    expect(parseAmountInput("12.5")).toBe(1250);
    expect(parseAmountInput("0")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("")).toBeNull();
  });

  it("formats cents as BRL", () => {
    expect(formatBRL(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
    expect(centsToInput(1250)).toBe("12.50");
  });
});
