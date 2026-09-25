import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { profilesRepository } from "@/server/db/repositories/profiles.server";

export async function GET(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const profile = await profilesRepository.get("owner");
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const profile = await profilesRepository.update("owner", body);
  return NextResponse.json(profile);
}
