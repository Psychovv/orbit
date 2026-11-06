"use client";

import { useEffect, useState } from "react";
import { Bot, LogOut, Trash2 } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { formatBRL, formatDate, formatRelative, loginLabel } from "../domain/admin.format";
import type { AdminUser, AdminUserDetail } from "../domain/admin.types";

interface Props {
  user: AdminUser | null;
  aiDailyLimit: number;
  busy: boolean;
  onClose: () => void;
  onRevoke: (user: AdminUser) => void;
  onResetAi: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function UserDetailDialog({ user, aiDailyLimit, busy, onClose, onRevoke, onResetAi, onDelete }: Props) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null);
    setError(null);
    fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Não foi possível carregar os detalhes.");
        setDetail((await res.json()) as AdminUserDetail);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Tente novamente.");
      });
    return () => controller.abort();
  }, [userId]);

  return (
    <Dialog isOpen={Boolean(user)} onClose={onClose} title={user?.email ?? ""} description={user ? `Conta criada em ${formatDate(user.createdAt)}` : undefined}>
      {user ? (
        <div className="space-y-4">
          <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <Row label="Login" value={loginLabel(user)} />
            <Row label="Última atividade" value={formatRelative(user.lastActivityAt)} />
            {detail ? (
              <>
                <Row label="Tarefas" value={`${detail.tasks.completed}/${detail.tasks.total} concluídas`} />
                <Row label="Categorias de tarefas" value={detail.taskCategories} />
                <Row label="Hábitos" value={`${detail.habits.total - detail.habits.archived} ativos · ${detail.habits.archived} arquivados`} />
                <Row label="Check-ins" value={detail.habits.checkins} />
                <Row label="Transações" value={detail.finance.transactions} />
                <Row label="Entradas" value={formatBRL(detail.finance.incomeCents)} />
                <Row label="Saídas" value={formatBRL(detail.finance.expenseCents)} />
                <Row label="Categorias financeiras" value={detail.finance.categories} />
                <Row label="IA hoje" value={`${detail.aiUsedToday}/${aiDailyLimit}`} />
              </>
            ) : error ? (
              <p className="py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <p className="py-3 text-sm text-zinc-500">Carregando…</p>
            )}
          </dl>

          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button type="button" disabled={busy} onClick={() => onRevoke(user)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <LogOut className="h-3.5 w-3.5" /> Encerrar sessões
            </button>
            <button type="button" disabled={busy || user.aiUsedToday === 0} onClick={() => onResetAi(user)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Bot className="h-3.5 w-3.5" /> Zerar cota de IA
            </button>
            <button type="button" disabled={busy} onClick={() => onDelete(user)} className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
