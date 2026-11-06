import { NextResponse } from "next/server";
import { UpsertHabitCheckinSchema } from "@/features/habits/domain/habit.schema";
import { requireUser } from "@/server/auth-guard";
import { createServerHabitCheckinsRepository } from "@/server/db/repositories/habits.server";
import { DateKeySchema } from "@/shared/lib/schemas";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromParsed = from ? DateKeySchema.safeParse(from) : null;
  const toParsed = to ? DateKeySchema.safeParse(to) : null;

  if (!fromParsed?.success || !toParsed?.success) {
    return NextResponse.json({ error: "Informe from e to (YYYY-MM-DD)" }, { status: 400 });
  }

  const checkins = await createServerHabitCheckinsRepository(auth.userId).list({
    from: fromParsed.data,
    to: toParsed.data,
  });
  return NextResponse.json(checkins);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = UpsertHabitCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const checkin = await createServerHabitCheckinsRepository(auth.userId).upsert(parsed.data);
  return NextResponse.json(checkin);
}
