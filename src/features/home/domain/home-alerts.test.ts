import { describe, expect, it } from "vitest";
import type { BudgetUsage } from "@/features/finance/domain/metrics";
import type { FinanceCategory } from "@/features/finance/domain/finance.schema";
import { buildHomeAlerts } from "./home-alerts";

const category = (partial: Partial<FinanceCategory> & Pick<FinanceCategory, "id" | "name">): FinanceCategory => ({
  type: "expense",
  color: "#000",
  icon: "🏠",
  monthlyBudgetCents: 10000,
  ...partial,
});

const usage = (
  partial: Partial<BudgetUsage> & Pick<BudgetUsage, "category" | "spentCents" | "budgetCents" | "isOver" | "isWarning">
): BudgetUsage => ({
  ratio: (partial.spentCents / partial.budgetCents) * 100,
  ...partial,
});

describe("buildHomeAlerts", () => {
  it("flags overspent and near-limit budget categories", () => {
    const alerts = buildHomeAlerts({
      budgetItems: [
        usage({
          category: category({ id: "comida", name: "Comida" }),
          spentCents: 12000,
          budgetCents: 10000,
          isOver: true,
          isWarning: false,
        }),
        usage({
          category: category({ id: "moradia", name: "Moradia" }),
          spentCents: 8500,
          budgetCents: 10000,
          isOver: false,
          isWarning: true,
        }),
      ],
    });

    expect(alerts).toEqual([
      expect.objectContaining({
        id: "budget-over-comida",
        tone: "danger",
        href: "/finance",
        message: expect.stringContaining("estourou"),
      }),
      expect.objectContaining({
        id: "budget-warn-moradia",
        tone: "warning",
        href: "/finance",
        message: expect.stringContaining("85%"),
      }),
    ]);
  });

  it("warns when active streaks are at risk", () => {
    expect(
      buildHomeAlerts({
        habits: { total: 3, completed: 1, atRiskCount: 2, bestActiveStreak: 5 },
      })
    ).toEqual([
      expect.objectContaining({
        id: "habits-at-risk",
        tone: "warning",
        href: "/habits",
        message: "2 hábitos com streak em risco — ainda falta check-in hoje.",
      }),
    ]);
  });

  it("nudges a solid streak when habits are still pending", () => {
    expect(
      buildHomeAlerts({
        habits: { total: 2, completed: 1, atRiskCount: 0, bestActiveStreak: 4 },
      })
    ).toEqual([
      expect.objectContaining({
        id: "habits-pending",
        tone: "info",
        message: "1 hábito pendente hoje · streak 4d.",
      }),
    ]);
  });

  it("stays quiet when there is nothing actionable", () => {
    expect(buildHomeAlerts({})).toEqual([]);
    expect(
      buildHomeAlerts({
        habits: { total: 2, completed: 2, atRiskCount: 0, bestActiveStreak: 10 },
      })
    ).toEqual([]);
    expect(
      buildHomeAlerts({
        habits: { total: 1, completed: 0, atRiskCount: 0, bestActiveStreak: 1 },
      })
    ).toEqual([]);
  });
});
