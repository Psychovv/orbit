import { NextResponse } from "next/server";
import { requireBankAccess } from "@/server/pluggy/guard";
import { syncAllConnections } from "@/server/pluggy/sync";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await requireBankAccess(request, { max: 5, windowMs: 60_000 });
  if (denied) return denied;

  return NextResponse.json(await syncAllConnections());
}
