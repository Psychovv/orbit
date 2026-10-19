import { NextResponse } from "next/server";
import { UpdateHabitSchema } from "@/features/habits/domain/habit.schema";
import { requireAuth } from "@/server/auth-guard";
import { habitsRepository } from "@/server/db/repositories/habits.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const habit = await habitsRepository.update(id, parsed.data);
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  await habitsRepository.remove(id);
  return new NextResponse(null, { status: 204 });
}
