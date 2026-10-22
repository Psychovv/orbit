import "server-only";
import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { clientKey, rateLimit } from "@/server/rate-limit";
import { isPluggyConfigured } from "./client";

/**
 * Rotas de banco exigem modo http (com login) mesmo que as credenciais existam:
 * no modo local as APIs ficam sem autenticação.
 */
export async function requireBankAccess(
  request: Request,
  limit = { max: 20, windowMs: 60_000 }
): Promise<NextResponse | null> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "http") {
    return NextResponse.json({ error: "Disponível só no modo nuvem." }, { status: 404 });
  }

  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const key = `bank:${request.method}:${new URL(request.url).pathname}:${clientKey(request)}`;
  if (!rateLimit(key, limit.max, limit.windowMs)) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde um pouco." }, { status: 429 });
  }

  if (!isPluggyConfigured()) {
    return NextResponse.json({ error: "Integração bancária não configurada no servidor." }, { status: 503 });
  }
  return null;
}
