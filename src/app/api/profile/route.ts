import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { profilesRepository } from "@/server/db/repositories/profiles.server";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const profile = await profilesRepository.get(auth.userId);
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
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const profile = await profilesRepository.update(auth.userId, body);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[api/profile PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o perfil." },
      { status: 500 }
    );
  }
}
