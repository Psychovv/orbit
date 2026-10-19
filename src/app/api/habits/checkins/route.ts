import { NextResponse } from "next/server";
import { UpsertHabitCheckinSchema } from "@/features/habits/domain/habit.schema";
import { requireAuth } from "@/server/auth-guard";
import { habitCheckinsRepository } from "@/server/db/repositories/habits.server";
import { DateKeySchema } from "@/shared/lib/schemas";

export async function GET(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromParsed = from ? DateKeySchema.safeParse(from) : null;
  const toParsed = to ? DateKeySchema.safeParse(to) : null;

  if (!fromParsed?.success || !toParsed?.success) {
    return NextResponse.json({ error: "Informe from e to (YYYY-MM-DD)" }, { status: 400 });
  }

  const checkins = await habitCheckinsRepository.list({
    from: fromParsed.data,
    to: toParsed.data,
  });
  return NextResponse.json(checkins);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = UpsertHabitCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const checkin = await habitCheckinsRepository.upsert(parsed.data);
  return NextResponse.json(checkin);
}
