import { NextResponse } from "next/server";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";

/** Células que começam com estes caracteres viram fórmula no Excel/Sheets. */
function csvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Exporta os usuários em CSV (sem hashes nem identificadores do Google). Só o dono. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const users = await adminRepository.listUsers();
  const header = ["email", "criado_em", "login", "tarefas", "habitos", "transacoes", "ultima_atividade", "ia_hoje"];
  const rows = users.map((u) => [
    u.email,
    u.createdAt,
    [u.hasPassword && "senha", u.hasGoogle && "google"].filter(Boolean).join("+"),
    u.tasks,
    u.habits,
    u.transactions,
    u.lastActivityAt,
    u.aiUsedToday,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(cell as string | number | null)).join(",")).join("\r\n");

  return new NextResponse(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orbit-usuarios-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
