import { NextResponse } from "next/server";
import { AddBankConnectionSchema } from "@/features/finance/domain/bank.schema";
import { bankConnectionsRepository } from "@/server/db/repositories/bank.server";
import { PluggyError } from "@/server/pluggy/client";
import { requireBankAccess } from "@/server/pluggy/guard";
import { registerConnection, syncConnection } from "@/server/pluggy/sync";

export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = await requireBankAccess(request);
  if (denied) return denied;

  return NextResponse.json(await bankConnectionsRepository.list());
}

export async function POST(request: Request) {
  const denied = await requireBankAccess(request, { max: 10, windowMs: 60_000 });
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const parsed = AddBankConnectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Item ID inválido." }, { status: 400 });
  }

  try {
    const connection = await registerConnection(parsed.data.itemId);
    const sync = await syncConnection(connection.itemId);
    return NextResponse.json({ connection, sync });
  } catch (error) {
    if (error instanceof PluggyError && (error.status === 400 || error.status === 404)) {
      return NextResponse.json({ error: "Item não encontrado nesta aplicação da Pluggy." }, { status: 400 });
    }
    console.error("[pluggy] register failed", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Não foi possível falar com a Pluggy." }, { status: 502 });
  }
}
