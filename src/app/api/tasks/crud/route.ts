import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { CreateTaskSchema } from "@/features/tasks/domain/task.schema";
import { tasksRepository } from "@/server/db/repositories/tasks.server";

export async function GET(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  const range = from && to ? { from, to } : undefined;
  const tasks = await tasksRepository.list(range);
  
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const task = await tasksRepository.create(parsed.data);
  return NextResponse.json(task);
}
