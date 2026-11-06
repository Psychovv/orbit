import { NextResponse } from "next/server";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";

type Ctx = { params: Promise<{ id: string }> };

/** Encerra todas as sessões de um usuário (ele precisa entrar de novo). Só o dono. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!(await adminRepository.exists(id))) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await adminRepository.revokeSessions(id);
  return new NextResponse(null, { status: 204 });
}
