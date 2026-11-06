import { NextResponse } from "next/server";
import { CreateHabitSchema } from "@/features/habits/domain/habit.schema";
import { requireUser } from "@/server/auth-guard";
import { createServerHabitsRepository } from "@/server/db/repositories/habits.server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";
  const habits = await createServerHabitsRepository(auth.userId).list(includeArchived);
  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const habit = await createServerHabitsRepository(auth.userId).create(parsed.data);
  return NextResponse.json(habit);
}
