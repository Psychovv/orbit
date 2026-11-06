import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("passwords", () => {
  it("verifica a senha certa e recusa a errada", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("gera salt diferente a cada hash", async () => {
    expect(await hashPassword("abc12345")).not.toBe(await hashPassword("abc12345"));
  });

  it("recusa hash malformado", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$abc")).toBe(false);
  });
});
