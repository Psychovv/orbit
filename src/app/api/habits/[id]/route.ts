import { NextResponse } from "next/server";
import { UpdateHabitSchema } from "@/features/habits/domain/habit.schema";
import { requireUser } from "@/server/auth-guard";
import { createServerHabitsRepository } from "@/server/db/repositories/habits.server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = UpdateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const habit = await createServerHabitsRepository(auth.userId).update(id, parsed.data);
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  await createServerHabitsRepository(auth.userId).remove(id);
  return new NextResponse(null, { status: 204 });
}
