import { NextResponse } from "next/server";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";
import { OWNER_USER_ID } from "@/server/db/schema";

type Ctx = { params: Promise<{ id: string }> };

/** Exclui um usuário e todos os dados dele. Só o dono; o dono não se exclui. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (id === OWNER_USER_ID) {
    return NextResponse.json({ error: "A conta do dono não pode ser excluída." }, { status: 403 });
  }
  if (!(await adminRepository.exists(id))) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  try {
    await adminRepository.deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[api/admin/users DELETE]", error);
    return NextResponse.json({ error: "Não foi possível excluir o usuário." }, { status: 500 });
  }
}
