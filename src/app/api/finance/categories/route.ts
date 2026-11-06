import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { CreateFinanceCategorySchema } from "@/features/finance/domain/finance.schema";
import { createServerFinanceCategoriesRepository } from "@/server/db/repositories/finance.server";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const categories = await createServerFinanceCategoriesRepository(auth.userId).list();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateFinanceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const category = await createServerFinanceCategoriesRepository(auth.userId).create(parsed.data);
  return NextResponse.json(category);
}
