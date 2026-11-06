import { NextResponse } from "next/server";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";

/** Lista os usuários cadastrados. Só o dono. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json(await adminRepository.listUsers());
  } catch (error) {
    console.error("[api/admin/users GET]", error);
    return NextResponse.json({ error: "Não foi possível carregar os usuários." }, { status: 500 });
  }
}
