import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { CreateTaskCategorySchema } from "@/features/tasks/domain/task.schema";
import { createServerTaskCategoriesRepository } from "@/server/db/repositories/tasks.server";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const categories = await createServerTaskCategoriesRepository(auth.userId).list();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTaskCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const category = await createServerTaskCategoriesRepository(auth.userId).create(parsed.data);
  return NextResponse.json(category);
}
