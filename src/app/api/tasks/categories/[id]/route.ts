import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { UpdateTaskCategorySchema } from "@/features/tasks/domain/task.schema";
import { taskCategoriesRepository } from "@/server/db/repositories/tasks.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTaskCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const category = await taskCategoriesRepository.update(id, parsed.data);
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  await taskCategoriesRepository.remove(id);
  return new NextResponse(null, { status: 204 });
}
