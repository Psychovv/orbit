import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createSession, signInWithGoogle } from "@/server/auth";
import {
  exchangeCode,
  GOOGLE_CALLBACK_PATH,
  GoogleAuthError,
  isGoogleConfigured,
  verifyIdToken,
} from "@/server/google-oauth";
import { GOOGLE_STATE_COOKIE, openGoogleState } from "@/server/google-session";

/** Volta do Google: confere state, troca o code, valida o id_token e abre a sessão. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const cookieStore = await cookies();
  const saved = await openGoogleState(cookieStore.get(GOOGLE_STATE_COOKIE)?.value);
  cookieStore.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });

  const from = saved?.from ?? "login";
  const back = (error: string, page: string = from) =>
    NextResponse.redirect(new URL(`/${page}?error=${error}`, origin));

  if (!isGoogleConfigured()) return back("google_unavailable");
  // Usuário cancelou na tela do Google.
  if (searchParams.get("error")) return back("google_cancelled");

  const code = searchParams.get("code");
  if (!saved || !code || searchParams.get("state") !== saved.state) return back("google_failed");

  try {
    const idToken = await exchangeCode({
      code,
      verifier: saved.verifier,
      redirectUri: new URL(GOOGLE_CALLBACK_PATH, origin).toString(),
    });
    const identity = await verifyIdToken(idToken, {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      nonce: saved.nonce,
    });

    const result = await signInWithGoogle(identity, saved.allowCreate);
    if (result.error === "signup_required") return back("signup_required", "signup");
    if (result.error) return back(result.error);

    await createSession(result.userId);
    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    console.error("[google callback]", error instanceof GoogleAuthError ? error.message : "unexpected");
    return back("google_failed");
  }
}
