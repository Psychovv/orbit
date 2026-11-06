import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { profilesRepository } from "@/server/db/repositories/profiles.server";
import { UpdateProfileSchema } from "@/features/profile/domain/profile.schema";

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
    const parsed = UpdateProfileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }
    const profile = await profilesRepository.update(auth.userId, parsed.data);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[api/profile PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o perfil." },
      { status: 500 }
    );
  }
}
