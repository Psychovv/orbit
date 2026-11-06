import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { CreateTaskSchema } from "@/features/tasks/domain/task.schema";
import { createServerTasksRepository } from "@/server/db/repositories/tasks.server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  const range = from && to ? { from, to } : undefined;
  const tasks = await createServerTasksRepository(auth.userId).list(range);
  
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const task = await createServerTasksRepository(auth.userId).create(parsed.data);
  return NextResponse.json(task);
}
