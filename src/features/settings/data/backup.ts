import { dataSource, repositories } from "@/config/data-source";
import { FINANCE_STORAGE_KEYS } from "@/features/finance/data/finance.local";
import { HABITS_STORAGE_KEYS } from "@/features/habits/data/habits.local";
import { PROFILE_STORAGE_KEYS } from "@/features/profile/data/profile.local";
import { TASKS_STORAGE_KEYS } from "@/features/tasks/data/tasks.local";
import { nowIso } from "@/shared/lib/id";
import { writeJson } from "@/shared/lib/local-store";
import {
  BACKUP_VERSION,
  parseOrbitBackup,
  type OrbitBackup,
} from "../domain/backup";

/** Monta um backup completo a partir dos repositórios ativos. */
export async function buildOrbitBackup(): Promise<OrbitBackup> {
  const [tasks, taskCategories, transactions, financeCategories, habits, habitCheckins, profile] =
    await Promise.all([
      repositories.tasks.list(),
      repositories.taskCategories.list(),
      repositories.transactions.list(),
      repositories.financeCategories.list(),
      repositories.habits.list(true),
      // Intervalo amplo para exportar o histórico de check-ins.
      repositories.habitCheckins.list({ from: "1970-01-01", to: "2100-12-31" }),
      repositories.profile.get(),
    ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    tasks,
    taskCategories,
    transactions,
    financeCategories,
    habits,
    habitCheckins,
    profile: {
      id: profile.id,
      name: profile.name,
      photo: profile.photo,
      bio: profile.bio,
    },
  };
}

function applyLocalBackup(backup: OrbitBackup): void {
  writeJson(TASKS_STORAGE_KEYS.tasks, backup.tasks);
  writeJson(TASKS_STORAGE_KEYS.categories, backup.taskCategories);
  writeJson(FINANCE_STORAGE_KEYS.transactions, backup.transactions);
  writeJson(FINANCE_STORAGE_KEYS.categories, backup.financeCategories);
  writeJson(HABITS_STORAGE_KEYS.habits, backup.habits);
  writeJson(HABITS_STORAGE_KEYS.checkins, backup.habitCheckins);

  if (typeof window !== "undefined") {
    try {
      if (backup.profile.name) localStorage.setItem(PROFILE_STORAGE_KEYS.NAME, backup.profile.name);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.NAME);
      if (backup.profile.photo) localStorage.setItem(PROFILE_STORAGE_KEYS.PHOTO, backup.profile.photo);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.PHOTO);
      if (backup.profile.bio) localStorage.setItem(PROFILE_STORAGE_KEYS.BIO, backup.profile.bio);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.BIO);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // quota / private mode
    }
  }
}

/** Restaura um backup validado no modo local ou via API no modo http. */
export async function restoreOrbitBackup(raw: unknown): Promise<OrbitBackup> {
  const backup = parseOrbitBackup(raw);

  if (dataSource === "local") {
    applyLocalBackup(backup);
    return backup;
  }

  const res = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(backup),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return backup;
}

export function downloadOrbitBackup(backup: OrbitBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = backup.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `orbit-backup-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
