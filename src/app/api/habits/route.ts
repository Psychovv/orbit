import { NextResponse } from "next/server";
import { CreateHabitSchema } from "@/features/habits/domain/habit.schema";
import { requireAuth } from "@/server/auth-guard";
import { habitsRepository } from "@/server/db/repositories/habits.server";

export async function GET(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";
  const habits = await habitsRepository.list(includeArchived);
  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const habit = await habitsRepository.create(parsed.data);
  return NextResponse.json(habit);
}
