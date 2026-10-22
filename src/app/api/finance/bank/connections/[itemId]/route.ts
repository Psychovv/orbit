import { NextResponse } from "next/server";
import { PluggyIdSchema } from "@/features/finance/domain/bank.schema";
import { bankConnectionsRepository } from "@/server/db/repositories/bank.server";
import { requireBankAccess } from "@/server/pluggy/guard";

type Ctx = { params: Promise<{ itemId: string }> };

/** Remove a conexão só no Orbit; os lançamentos já importados continuam. */
export async function DELETE(request: Request, ctx: Ctx) {
  const denied = await requireBankAccess(request);
  if (denied) return denied;

  const parsed = PluggyIdSchema.safeParse((await ctx.params).itemId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Item ID inválido." }, { status: 400 });
  }

  await bankConnectionsRepository.remove(parsed.data);
  return new NextResponse(null, { status: 204 });
}
