import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl, GOOGLE_CALLBACK_PATH, isGoogleConfigured, randomToken } from "@/server/google-oauth";
import { GOOGLE_STATE_COOKIE, GOOGLE_STATE_MAX_AGE, sealGoogleState } from "@/server/google-session";
import { clientKey, rateLimit } from "@/server/rate-limit";
import { inviteCodeMatches, inviteRequired } from "@/server/signup-policy";

/** Começa o login com Google: `?mode=signup&invite=...` vem da tela de cadastro. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const from = searchParams.get("mode") === "signup" ? "signup" : "login";
  const back = (error: string) => NextResponse.redirect(new URL(`/${from}?error=${error}`, origin));

  if (!isGoogleConfigured()) return back("google_unavailable");
  if (!rateLimit(`google-start:${clientKey(request)}`, 20, 15 * 60_000)) return back("rate_limited");

  const invite = searchParams.get("invite") ?? "";
  if (from === "signup" && inviteRequired() && !inviteCodeMatches(invite)) return back("invite");

  const verifier = randomToken();
  const state = randomToken();
  const nonce = randomToken();
  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_STATE_COOKIE,
    await sealGoogleState({ state, nonce, verifier, allowCreate: inviteCodeMatches(invite), from }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: GOOGLE_STATE_MAX_AGE,
      path: "/api/auth/google",
    }
  );

  return NextResponse.redirect(
    buildAuthUrl({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      redirectUri: new URL(GOOGLE_CALLBACK_PATH, origin).toString(),
      state,
      nonce,
      verifier,
    })
  );
}
