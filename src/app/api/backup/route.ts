import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { BACKUP_VERSION, OrbitBackupSchema } from "@/features/settings/domain/backup";
import { financeCategoriesRepository, transactionsRepository } from "@/server/db/repositories/finance.server";
import { taskCategoriesRepository, tasksRepository } from "@/server/db/repositories/tasks.server";
import { profilesRepository } from "@/server/db/repositories/profiles.server";
import { replaceAllFromBackup } from "@/server/db/repositories/backup.server";
import { nowIso } from "@/shared/lib/id";

export async function GET() {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const [tasks, taskCategories, transactions, financeCategories, profile] = await Promise.all([
    tasksRepository.list(),
    taskCategoriesRepository.list(),
    transactionsRepository.list(),
    financeCategoriesRepository.list(),
    profilesRepository.get("owner"),
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
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => null);
  const parsed = OrbitBackupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Arquivo de backup inválido" }, { status: 400 });
  }

  await replaceAllFromBackup(parsed.data);
  return NextResponse.json({ ok: true });
}
