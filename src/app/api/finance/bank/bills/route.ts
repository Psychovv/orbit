import { NextResponse } from "next/server";
import { cardBillsRepository } from "@/server/db/repositories/bank.server";
import { requireBankAccess } from "@/server/pluggy/guard";

export async function GET(request: Request) {
  const denied = await requireBankAccess(request);
  if (denied) return denied;

  return NextResponse.json(await cardBillsRepository.list());
}
