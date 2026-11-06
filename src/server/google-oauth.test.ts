import { describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { buildAuthUrl, codeChallenge, GoogleAuthError, verifyIdToken } from "./google-oauth";

const CLIENT_ID = "client-123.apps.googleusercontent.com";

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? "https://accounts.google.com")
      .setAudience(opts.aud ?? CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  return { keys, sign };
}

const good = { sub: "g-1", email: "a@gmail.com", email_verified: true, nonce: "n1" };

describe("verifyIdToken", () => {
  it("aceita um token válido", async () => {
    const { keys, sign } = await setup();
    const identity = await verifyIdToken(await sign(good), { clientId: CLIENT_ID, nonce: "n1" }, keys);
    expect(identity).toEqual({ sub: "g-1", email: "a@gmail.com" });
  });

  it.each([
    ["nonce diferente", good, {}, "n2"],
    ["e-mail não verificado", { ...good, email_verified: false }, {}, "n1"],
    ["audiência de outro app", good, { aud: "other" }, "n1"],
    ["emissor falso", good, { iss: "https://evil.example" }, "n1"],
  ])("recusa %s", async (_label, claims, opts, nonce) => {
    const { keys, sign } = await setup();
    await expect(
      verifyIdToken(await sign(claims, opts), { clientId: CLIENT_ID, nonce }, keys)
    ).rejects.toBeInstanceOf(GoogleAuthError);
  });

  it("recusa token assinado por outra chave", async () => {
    const { keys } = await setup();
    const other = await setup();
    await expect(
      verifyIdToken(await other.sign(good), { clientId: CLIENT_ID, nonce: "n1" }, keys)
    ).rejects.toBeInstanceOf(GoogleAuthError);
  });
});

describe("buildAuthUrl", () => {
  it("inclui PKCE S256, state e nonce", () => {
    const url = new URL(
      buildAuthUrl({ clientId: CLIENT_ID, redirectUri: "https://x/cb", state: "s", nonce: "n", verifier: "v" })
    );
    expect(url.searchParams.get("code_challenge")).toBe(codeChallenge("v"));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("s");
    expect(url.searchParams.get("nonce")).toBe("n");
    expect(url.searchParams.get("scope")).toBe("openid email");
  });
});
