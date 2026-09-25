import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { CreateTaskCategorySchema } from "@/features/tasks/domain/task.schema";
import { taskCategoriesRepository } from "@/server/db/repositories/tasks.server";

export async function GET() {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const categories = await taskCategoriesRepository.list();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTaskCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const category = await taskCategoriesRepository.create(parsed.data);
  return NextResponse.json(category);
}
