import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { CreateFinanceCategorySchema } from "@/features/finance/domain/finance.schema";
import { financeCategoriesRepository } from "@/server/db/repositories/finance.server";

export async function GET() {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const categories = await financeCategoriesRepository.list();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateFinanceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const category = await financeCategoriesRepository.create(parsed.data);
  return NextResponse.json(category);
}
