import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { TaskSchema } from "@/features/tasks/domain/task.schema";
import { createServerTasksRepository } from "@/server/db/repositories/tasks.server";

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const task = await createServerTasksRepository(auth.userId).restore(parsed.data);
  return NextResponse.json(task);
}
