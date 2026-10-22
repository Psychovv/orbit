import { describe, expect, it } from "vitest";
import { isAllowedWebhookIp, isValidWebhookSecret, PluggyWebhookEventSchema } from "./webhook-auth";

const SECRET = "a".repeat(64);

describe("isValidWebhookSecret", () => {
  it("accepts the exact secret", () => {
    expect(isValidWebhookSecret(SECRET, SECRET)).toBe(true);
  });

  it("rejects missing, wrong or differently sized secrets", () => {
    expect(isValidWebhookSecret(null, SECRET)).toBe(false);
    expect(isValidWebhookSecret("", SECRET)).toBe(false);
    expect(isValidWebhookSecret("b".repeat(64), SECRET)).toBe(false);
    expect(isValidWebhookSecret(SECRET.slice(1), SECRET)).toBe(false);
  });

  it("refuses everything when the configured secret is missing or too short", () => {
    expect(isValidWebhookSecret("short", "short")).toBe(false);
    expect(isValidWebhookSecret("anything", undefined)).toBe(false);
  });
});

describe("isAllowedWebhookIp", () => {
  it("allows any IP when no list is configured", () => {
    expect(isAllowedWebhookIp("1.2.3.4", undefined)).toBe(true);
    expect(isAllowedWebhookIp("1.2.3.4", " ")).toBe(true);
  });

  it("only allows listed IPs when configured", () => {
    expect(isAllowedWebhookIp("52.67.145.81", "52.67.145.81, 10.0.0.1")).toBe(true);
    expect(isAllowedWebhookIp("1.2.3.4", "52.67.145.81")).toBe(false);
  });
});

describe("PluggyWebhookEventSchema", () => {
  it("parses transaction events and drops unknown fields", () => {
    const parsed = PluggyWebhookEventSchema.parse({
      event: "transactions/created",
      eventId: "evt",
      itemId: "de7bbf5a-abf2-47e4-94b1-586b36758423",
      accountId: "0d5a0de2-9c82-4ea2-af50-31643a632a33",
      createdTransactionsLink: "https://evil.example/steal",
    });
    expect(parsed).not.toHaveProperty("createdTransactionsLink");
    expect(parsed.event).toBe("transactions/created");
  });

  it("rejects non-UUID identifiers", () => {
    expect(PluggyWebhookEventSchema.safeParse({ event: "item/updated", itemId: "../../etc" }).success).toBe(false);
    expect(
      PluggyWebhookEventSchema.safeParse({ event: "transactions/deleted", transactionIds: ["x"] }).success
    ).toBe(false);
  });
});
