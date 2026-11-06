import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";
import { OWNER_USER_ID } from "@/server/db/schema";

/** Lista os usuários cadastrados e o resumo geral. Só o dono. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const users = await adminRepository.listUsers();
    return NextResponse.json({ users, overview: adminRepository.overview(users) });
  } catch (error) {
    console.error("[api/admin/users GET]", error);
    return NextResponse.json({ error: "Não foi possível carregar os usuários." }, { status: 500 });
  }
}

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  confirm: z.literal("EXCLUIR"),
});

/** Exclui vários usuários e os dados deles. Exige `{ ids, confirm: "EXCLUIR" }`. O dono nunca é excluído. */
export async function DELETE(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const parsed = BulkDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe os usuários e confirme digitando EXCLUIR." }, { status: 400 });
  }
  if (parsed.data.ids.includes(OWNER_USER_ID)) {
    return NextResponse.json({ error: "A conta do dono não pode ser excluída." }, { status: 403 });
  }

  try {
    const deleted = await adminRepository.deleteUsers([...new Set(parsed.data.ids)]);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("[api/admin/users DELETE]", error);
    return NextResponse.json({ error: "Não foi possível excluir os usuários." }, { status: 500 });
  }
}
