import { describe, expect, it } from "vitest";
import { formatBRL, formatRelative, loginLabel } from "./admin.format";

const NOW = new Date("2026-11-10T12:00:00Z").getTime();

describe("formatRelative", () => {
  it("cobre nunca, hoje, ontem, dias, meses e anos", () => {
    expect(formatRelative(null, NOW)).toBe("nunca");
    expect(formatRelative("2026-11-10T08:00:00Z", NOW)).toBe("hoje");
    expect(formatRelative("2026-11-09T08:00:00Z", NOW)).toBe("ontem");
    expect(formatRelative("2026-11-01T12:00:00Z", NOW)).toBe("há 9 dias");
    expect(formatRelative("2026-08-01T12:00:00Z", NOW)).toBe("há 3 meses");
    expect(formatRelative("2024-11-01T12:00:00Z", NOW)).toBe("há 2 anos");
    expect(formatRelative("lixo", NOW)).toBe("–");
  });
});

describe("loginLabel", () => {
  it("descreve os métodos de login", () => {
    expect(loginLabel({ hasPassword: true, hasGoogle: false })).toBe("Senha");
    expect(loginLabel({ hasPassword: false, hasGoogle: true })).toBe("Google");
    expect(loginLabel({ hasPassword: true, hasGoogle: true })).toBe("Senha + Google");
    expect(loginLabel({ hasPassword: false, hasGoogle: false })).toBe("Sem login");
  });
});

describe("formatBRL", () => {
  it("converte centavos em reais", () => {
    expect(formatBRL(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});
