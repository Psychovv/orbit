import { describe, expect, it } from "vitest";
import { institutionName, isImportableAccount, mapPluggyTransaction, toDateKey } from "./mapping";
import type { PluggyAccount, PluggyTransaction } from "./types";

const checking: PluggyAccount = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "BANK",
  subtype: "CHECKING_ACCOUNT",
  name: "Conta corrente",
};

const card: PluggyAccount = {
  id: "22222222-2222-4222-8222-222222222222",
  type: "CREDIT",
  subtype: "CREDIT_CARD",
  name: "platinum",
};

function tx(overrides: Partial<PluggyTransaction> = {}): PluggyTransaction {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    description: "Mercado",
    amount: -50.25,
    date: "2026-10-15T00:00:00.000Z",
    type: "DEBIT",
    status: "POSTED",
    ...overrides,
  };
}

describe("toDateKey", () => {
  it("keeps the calendar day of date-only values", () => {
    expect(toDateKey("2026-10-15T00:00:00.000Z")).toBe("2026-10-15");
  });

  it("converts timestamps to São Paulo time", () => {
    expect(toDateKey("2026-10-15T01:30:00.000Z")).toBe("2026-10-14");
    expect(toDateKey("2026-10-15T15:00:00.000Z")).toBe("2026-10-15");
  });

  it("rejects invalid dates", () => {
    expect(toDateKey("not a date")).toBeNull();
  });
});

describe("isImportableAccount", () => {
  it("accepts bank accounts and credit cards only", () => {
    expect(isImportableAccount(checking)).toBe(true);
    expect(isImportableAccount(card)).toBe(true);
    expect(isImportableAccount({ ...card, subtype: "LOAN" })).toBe(false);
  });
});

describe("institutionName", () => {
  const nubankChecking = { ...checking, name: "Nu Pagamentos S.A. - Instituição de Pagamento" };

  it("uses the connector name for direct connectors", () => {
    expect(institutionName("Pluggy Bank", [nubankChecking])).toBe("Pluggy Bank");
  });

  it("derives the bank from the account name for MeuPluggy items", () => {
    expect(institutionName("MeuPluggy", [card, nubankChecking])).toBe("Nubank");
    expect(institutionName("MeuPluggy", [{ ...checking, name: "Banco Inter S.A." }])).toBe("Inter");
  });

  it("falls back to a cleaned account name or a generic label", () => {
    expect(institutionName("MeuPluggy", [{ ...checking, name: "Banco Exemplo S.A. - Algo" }])).toBe("Banco Exemplo");
    expect(institutionName("MeuPluggy", [card])).toBe("MeuPluggy");
    expect(institutionName(null, [])).toBe("Banco");
  });
});

describe("mapPluggyTransaction", () => {
  it("maps a checking account debit to an expense in cents", () => {
    expect(mapPluggyTransaction(tx(), checking, "Nubank")).toEqual({
      externalId: "33333333-3333-4333-8333-333333333333",
      description: "Mercado",
      amountCents: 5025,
      type: "expense",
      date: "2026-10-15",
      paymentMethod: "transferencia",
      notes: "Importado de Nubank · Conta corrente",
    });
  });

  it("maps credits to income and detects PIX", () => {
    const mapped = mapPluggyTransaction(
      tx({ amount: 1500, type: "CREDIT", operationType: "PIX" }),
      checking,
      "Nubank"
    );
    expect(mapped).toMatchObject({ type: "income", amountCents: 150000, paymentMethod: "pix" });
  });

  it("uses paymentData before operationType", () => {
    const mapped = mapPluggyTransaction(
      tx({ paymentData: { paymentMethod: "BOLETO" }, operationType: "OUTROS" }),
      checking,
      "Itaú"
    );
    expect(mapped?.paymentMethod).toBe("boleto");
  });

  it("skips scheduled (pending) checking account transactions", () => {
    expect(mapPluggyTransaction(tx({ status: "PENDING" }), checking, "Itaú")).toBeNull();
  });

  it("skips zero amounts", () => {
    expect(mapPluggyTransaction(tx({ amount: 0 }), checking, "Itaú")).toBeNull();
  });

  it("treats positive card amounts as expenses paid by card, with installments in notes", () => {
    const mapped = mapPluggyTransaction(
      tx({
        amount: 120,
        status: "PENDING",
        creditCardMetadata: { installmentNumber: 2, totalInstallments: 6 },
      }),
      card,
      "Nubank"
    );
    expect(mapped).toMatchObject({
      type: "expense",
      amountCents: 12000,
      paymentMethod: "cartao",
      notes: "Importado de Nubank · Cartão · Parcela 2/6",
    });
  });

  it("skips card bill payments to avoid counting the bill twice", () => {
    expect(mapPluggyTransaction(tx({ amount: -900, operationType: "PAGAMENTO_FATURA" }), card, "Nubank")).toBeNull();
    expect(
      mapPluggyTransaction(tx({ amount: -900, description: "Pagamento recebido" }), card, "Nubank")
    ).toBeNull();
  });

  it("imports card refunds as income", () => {
    const mapped = mapPluggyTransaction(tx({ amount: -30, operationType: "ESTORNO" }), card, "Nubank");
    expect(mapped).toMatchObject({ type: "income", amountCents: 3000 });
  });

  it("prefers the amount in account currency for international purchases", () => {
    const mapped = mapPluggyTransaction(
      tx({ amount: 10, amountInAccountCurrency: 55.4, currencyCode: "USD" }),
      card,
      "Nubank"
    );
    expect(mapped?.amountCents).toBe(5540);
  });

  it("normalizes and truncates descriptions", () => {
    const mapped = mapPluggyTransaction(tx({ description: `  PAG   ${"x".repeat(300)}  ` }), checking, "Itaú");
    expect(mapped?.description.startsWith("PAG x")).toBe(true);
    expect(mapped?.description.length).toBe(200);
    expect(mapPluggyTransaction(tx({ description: "   " }), checking, "Itaú")?.description).toBe(
      "Transação bancária"
    );
  });
});
