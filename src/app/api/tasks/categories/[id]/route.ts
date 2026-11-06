import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { UpdateTaskCategorySchema } from "@/features/tasks/domain/task.schema";
import { createServerTaskCategoriesRepository } from "@/server/db/repositories/tasks.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTaskCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const category = await createServerTaskCategoriesRepository(auth.userId).update(id, parsed.data);
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  await createServerTaskCategoriesRepository(auth.userId).remove(id);
  return new NextResponse(null, { status: 204 });
}
