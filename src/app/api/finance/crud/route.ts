import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { CreateTransactionSchema } from "@/features/finance/domain/finance.schema";
import { transactionsRepository } from "@/server/db/repositories/finance.server";

export async function GET(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  const range = from && to ? { from, to } : undefined;
  const transactions = await transactionsRepository.list(range);
  
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await transactionsRepository.create(parsed.data);
  return NextResponse.json(transaction);
}
