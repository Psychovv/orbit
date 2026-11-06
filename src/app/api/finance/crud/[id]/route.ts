import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { UpdateTransactionSchema, TransactionSchema } from "@/features/finance/domain/finance.schema";
import { createServerTransactionsRepository } from "@/server/db/repositories/finance.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await createServerTransactionsRepository(auth.userId).update(id, parsed.data);
  return NextResponse.json(transaction);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  await createServerTransactionsRepository(auth.userId).remove(id);
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = TransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await createServerTransactionsRepository(auth.userId).restore(parsed.data);
  return NextResponse.json(transaction);
}
