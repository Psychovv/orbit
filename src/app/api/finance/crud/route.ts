import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { CreateTransactionSchema } from "@/features/finance/domain/finance.schema";
import { createServerTransactionsRepository } from "@/server/db/repositories/finance.server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  const range = from && to ? { from, to } : undefined;
  const transactions = await createServerTransactionsRepository(auth.userId).list(range);
  
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const transaction = await createServerTransactionsRepository(auth.userId).create(parsed.data);
  return NextResponse.json(transaction);
}
