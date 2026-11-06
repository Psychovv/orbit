import { describe, expect, it } from "vitest";
import { UpdateProfileSchema } from "./profile.schema";

describe("UpdateProfileSchema", () => {
  it("accepts an embedded avatar and clears fields with null", () => {
    const parsed = UpdateProfileSchema.parse({ name: " Psy ", photo: "data:image/jpeg;base64,AAAA", bio: null });
    expect(parsed).toEqual({ name: "Psy", photo: "data:image/jpeg;base64,AAAA", bio: null });
  });

  it("rejects external or scriptable photo URLs", () => {
    expect(UpdateProfileSchema.safeParse({ photo: "https://evil.example/x.png" }).success).toBe(false);
    expect(UpdateProfileSchema.safeParse({ photo: "javascript:alert(1)" }).success).toBe(false);
    expect(UpdateProfileSchema.safeParse({ photo: "data:image/svg+xml;base64,AAAA" }).success).toBe(false);
  });

  it("rejects oversized and non-string values", () => {
    expect(UpdateProfileSchema.safeParse({ photo: `data:image/png;base64,${"A".repeat(200_001)}` }).success).toBe(false);
    expect(UpdateProfileSchema.safeParse({ bio: "x".repeat(1001) }).success).toBe(false);
    expect(UpdateProfileSchema.safeParse({ name: { $ne: 1 } }).success).toBe(false);
  });

  it("drops unknown keys such as id", () => {
    expect(UpdateProfileSchema.parse({ id: "someone-else", name: "A" })).toEqual({ name: "A" });
  });
});
