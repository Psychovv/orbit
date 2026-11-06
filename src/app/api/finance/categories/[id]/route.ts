import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { UpdateFinanceCategorySchema } from "@/features/finance/domain/finance.schema";
import { createServerFinanceCategoriesRepository } from "@/server/db/repositories/finance.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateFinanceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const category = await createServerFinanceCategoriesRepository(auth.userId).update(id, parsed.data);
  return NextResponse.json(category);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  await createServerFinanceCategoriesRepository(auth.userId).remove(id);
  return new NextResponse(null, { status: 204 });
}
