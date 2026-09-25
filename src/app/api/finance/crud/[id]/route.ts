import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { UpdateTransactionSchema, TransactionSchema } from "@/features/finance/domain/finance.schema";
import { transactionsRepository } from "@/server/db/repositories/finance.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await transactionsRepository.update(id, parsed.data);
  return NextResponse.json(transaction);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  await transactionsRepository.remove(id);
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = TransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await transactionsRepository.restore(parsed.data);
  return NextResponse.json(transaction);
}
