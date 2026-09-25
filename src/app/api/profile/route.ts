import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { profilesRepository } from "@/server/db/repositories/profiles.server";

export async function GET() {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  try {
    const profile = await profilesRepository.get("owner");
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[api/profile GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o perfil." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const profile = await profilesRepository.update("owner", body);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[api/profile PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o perfil." },
      { status: 500 }
    );
  }
}
