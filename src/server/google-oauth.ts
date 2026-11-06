import { createHash, randomBytes } from "crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/** Login com Google (OpenID Connect, fluxo authorization code + PKCE). */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export function isGoogleConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_DATA_SOURCE === "http" &&
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  );
}

function base64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

export function randomToken(): string {
  return base64url(randomBytes(32));
}

export function codeChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  verifier: string;
}): string {
  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email",
    state: params.state,
    nonce: params.nonce,
    code_challenge: codeChallenge(params.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export interface GoogleIdentity {
  sub: string;
  email: string;
}

export class GoogleAuthError extends Error {}

let googleKeys: JWTVerifyGetKey | null = null;
function getGoogleKeys(): JWTVerifyGetKey {
  googleKeys ??= createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
  return googleKeys;
}

/** Valida o id_token: assinatura, emissor, audiência, nonce e e-mail verificado. */
export async function verifyIdToken(
  idToken: string,
  expected: { clientId: string; nonce: string },
  keys: JWTVerifyGetKey = getGoogleKeys()
): Promise<GoogleIdentity> {
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, keys, {
      issuer: GOOGLE_ISSUERS,
      audience: expected.clientId,
    }));
  } catch {
    throw new GoogleAuthError("id_token inválido");
  }
  if (payload.nonce !== expected.nonce) throw new GoogleAuthError("nonce não confere");
  if (typeof payload.sub !== "string" || !payload.sub) throw new GoogleAuthError("sub ausente");
  if (typeof payload.email !== "string" || payload.email_verified !== true) {
    throw new GoogleAuthError("e-mail não verificado");
  }
  return { sub: payload.sub, email: payload.email };
}

/** Troca o `code` pelo id_token no servidor do Google. */
export async function exchangeCode(params: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      code_verifier: params.verifier,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await response.json().catch(() => null)) as { id_token?: unknown } | null;
  if (!response.ok || typeof body?.id_token !== "string") {
    throw new GoogleAuthError(`troca do code falhou (${response.status})`);
  }
  return body.id_token;
}
