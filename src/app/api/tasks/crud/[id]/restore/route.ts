import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { TaskSchema } from "@/features/tasks/domain/task.schema";
import { tasksRepository } from "@/server/db/repositories/tasks.server";

export async function PUT(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const task = await tasksRepository.restore(parsed.data);
  return NextResponse.json(task);
}
