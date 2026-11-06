import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth-guard";
import { BACKUP_VERSION, OrbitBackupSchema } from "@/features/settings/domain/backup";
import { createServerFinanceCategoriesRepository, createServerTransactionsRepository } from "@/server/db/repositories/finance.server";
import { createServerTaskCategoriesRepository, createServerTasksRepository } from "@/server/db/repositories/tasks.server";
import { profilesRepository } from "@/server/db/repositories/profiles.server";
import { replaceAllFromBackup } from "@/server/db/repositories/backup.server";
import { nowIso } from "@/shared/lib/id";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const [tasks, taskCategories, transactions, financeCategories, profile] = await Promise.all([
    createServerTasksRepository(auth.userId).list(),
    createServerTaskCategoriesRepository(auth.userId).list(),
    createServerTransactionsRepository(auth.userId).list(),
    createServerFinanceCategoriesRepository(auth.userId).list(),
    profilesRepository.get(auth.userId),
  ]);

  return NextResponse.json({
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    tasks,
    taskCategories,
    transactions,
    financeCategories,
    profile,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = OrbitBackupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Arquivo de backup inválido" }, { status: 400 });
  }

  await replaceAllFromBackup(auth.userId, parsed.data);
  return NextResponse.json({ ok: true });
}
