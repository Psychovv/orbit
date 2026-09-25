import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { UpdateTaskSchema } from "@/features/tasks/domain/task.schema";
import { tasksRepository } from "@/server/db/repositories/tasks.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const task = await tasksRepository.update(id, parsed.data);
  return NextResponse.json(task);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  await tasksRepository.remove(id);
  return new NextResponse(null, { status: 204 });
}
