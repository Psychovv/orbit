import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { getAuthSecret } from "@/config/auth-config";

/** Estado do login com Google entre a ida e a volta (state, nonce, PKCE), num cookie assinado. */

export const GOOGLE_STATE_COOKIE = "orbit-google-oauth";
export const GOOGLE_STATE_MAX_AGE = 10 * 60;

export interface GoogleOAuthState {
  state: string;
  nonce: string;
  verifier: string;
  /** Pode criar conta nova (cadastro aberto ou convite válido). */
  allowCreate: boolean;
  /** Tela para onde voltam os erros. */
  from: "login" | "signup";
}

export async function sealGoogleState(data: GoogleOAuthState): Promise<string> {
  return new SignJWT({ ...data, purpose: "google-oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GOOGLE_STATE_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function openGoogleState(token: string | undefined): Promise<GoogleOAuthState | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.purpose !== "google-oauth") return null;
    const { state, nonce, verifier, allowCreate, from } = payload;
    if (typeof state !== "string" || typeof nonce !== "string" || typeof verifier !== "string") return null;
    return { state, nonce, verifier, allowCreate: allowCreate === true, from: from === "signup" ? "signup" : "login" };
  } catch {
    return null;
  }
}
