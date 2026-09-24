import { describe, expect, it } from "vitest";
import { migrateLegacyFinanceCategory, migrateLegacyTransaction } from "./finance.local";

describe("finance legacy migration", () => {
  it("converts amounts in reais to cents", () => {
    const tx = migrateLegacyTransaction({
      id: "tx-1",
      description: "Mercado",
      amount: 495.2,
      type: "expense",
      categoryId: "alimentacao",
      date: "2026-08-12",
      paymentMethod: "cartao",
    });
    expect(tx).toMatchObject({ amountCents: 49520, categoryId: "alimentacao", createdAt: "2026-08-12T12:00:00.000Z" });
  });

  it("rejects transactions without a valid amount", () => {
    expect(migrateLegacyTransaction({ id: "x", description: "?", type: "expense", date: "2026-08-12" })).toBeNull();
  });

  it("converts monthly budgets to cents", () => {
    expect(
      migrateLegacyFinanceCategory({ id: "moradia", name: "Moradia", type: "expense", color: "#000", icon: "🏠", monthlyBudget: 1600 })
    ).toMatchObject({ monthlyBudgetCents: 160000 });
  });
});
