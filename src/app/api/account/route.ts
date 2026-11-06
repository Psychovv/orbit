import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSession } from "@/server/auth";
import { requireUser } from "@/server/auth-guard";
import { deleteUserAccount } from "@/server/db/repositories/account.server";
import { OWNER_USER_ID } from "@/server/db/schema";

const DELETE_ACCOUNT_CONFIRMATION = "EXCLUIR";

const DeleteAccountSchema = z.object({ confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION) });

/** Exclui a conta do usuário logado e todos os dados dele (LGPD). Exige `{ "confirm": "EXCLUIR" }`. */
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  if (auth.userId === OWNER_USER_ID) {
    return NextResponse.json(
      { error: "A conta do dono é configurada no servidor e não pode ser excluída por aqui." },
      { status: 403 }
    );
  }

  if (!DeleteAccountSchema.safeParse(await request.json().catch(() => null)).success) {
    return NextResponse.json({ error: `Confirme digitando ${DELETE_ACCOUNT_CONFIRMATION}.` }, { status: 400 });
  }

  await deleteUserAccount(auth.userId);
  await deleteSession();
  return new NextResponse(null, { status: 204 });
}
