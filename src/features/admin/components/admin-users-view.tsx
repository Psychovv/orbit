"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "@/shared/ui/toast";
import { formatDate, formatRelative, loginLabel } from "../domain/admin.format";
import type { AdminUser, AdminUsersPayload } from "../domain/admin.types";
import { AdminOverviewSection } from "./admin-overview";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { UserDetailDialog } from "./user-detail-dialog";

const PAGE_SIZE = 20;

type Filter = "all" | "password" | "google" | "inactive";
type Sort = "recent" | "oldest" | "email" | "data" | "activity";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "password", label: "Com senha" },
  { value: "google", label: "Google" },
  { value: "inactive", label: "Sem atividade (30 dias)" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "email", label: "E-mail (A–Z)" },
  { value: "data", label: "Mais dados" },
  { value: "activity", label: "Atividade recente" },
];

const dataVolume = (u: AdminUser) => u.tasks + u.habits + u.transactions;

async function call(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok) return res;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  throw new Error(body?.error ?? "Tente novamente.");
}

function fail(message: string, error: unknown) {
  toast({ message, description: error instanceof Error ? error.message : undefined, tone: "error" });
}

export function AdminUsersView({ initial }: { initial: AdminUsersPayload }) {
  const [{ users, overview }, setData] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** Referência de "agora" para o filtro de inatividade; renovada a cada atualização. */
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await call("/api/admin/users");
      const payload = (await res.json()) as AdminUsersPayload;
      setData(payload);
      setNow(Date.now());
      setSelected((prev) => new Set([...prev].filter((id) => payload.users.some((u) => u.id === id))));
    } catch (error) {
      fail("Falha ao atualizar", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const cutoff = new Date(now - 30 * 86_400_000).toISOString();
    const list = users.filter((u) => {
      if (term && !u.email.includes(term)) return false;
      if (filter === "password") return u.hasPassword;
      if (filter === "google") return u.hasGoogle;
      if (filter === "inactive") return (u.lastActivityAt ?? u.createdAt) < cutoff;
      return true;
    });
    const sorters: Record<Sort, (a: AdminUser, b: AdminUser) => number> = {
      recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      email: (a, b) => a.email.localeCompare(b.email),
      data: (a, b) => dataVolume(b) - dataVolume(a),
      activity: (a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
    };
    return [...list].sort(sorters[sort]);
  }, [users, query, filter, sort, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((u) => selected.has(u.id));
  const detailUser = users.find((u) => u.id === detailId) ?? null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const u of visible) {
        if (allVisibleSelected) next.delete(u.id);
        else next.add(u.id);
      }
      return next;
    });

  const confirmDelete = async () => {
    const targets = toDelete;
    setBusy(true);
    try {
      if (targets.length === 1) {
        await call(`/api/admin/users/${encodeURIComponent(targets[0].id)}`, { method: "DELETE" });
      } else {
        await call("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: targets.map((u) => u.id), confirm: "EXCLUIR" }),
        });
      }
      toast({ message: targets.length === 1 ? "Usuário excluído" : `${targets.length} usuários excluídos`, tone: "success" });
      setToDelete([]);
      setDetailId(null);
      await refresh();
    } catch (error) {
      fail("Falha ao excluir", error);
    } finally {
      setBusy(false);
    }
  };

  const revokeSessions = async (user: AdminUser) => {
    if (!window.confirm(`Encerrar todas as sessões de ${user.email}? Ele precisará entrar de novo.`)) return;
    setBusy(true);
    try {
      await call(`/api/admin/users/${encodeURIComponent(user.id)}/sessions`, { method: "DELETE" });
      toast({ message: "Sessões encerradas", description: user.email, tone: "success" });
    } catch (error) {
      fail("Falha ao encerrar sessões", error);
    } finally {
      setBusy(false);
    }
  };

  const resetAi = async (user: AdminUser) => {
    setBusy(true);
    try {
      await call(`/api/admin/users/${encodeURIComponent(user.id)}/ai-limit`, { method: "DELETE" });
      toast({ message: "Cota de IA zerada", description: user.email, tone: "success" });
      await refresh();
    } catch (error) {
      fail("Falha ao zerar a cota", error);
    } finally {
      setBusy(false);
    }
  };

  const selectedUsers = users.filter((u) => selected.has(u.id));
  const selectClass =
    "h-9 rounded-xl border border-zinc-200 bg-transparent px-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-300";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Voltar às configurações
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Administração</h1>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
            </button>
            {/* Download de arquivo, não navegação de página. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/users/export" download className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </a>
          </div>
        </div>
      </header>

      <AdminOverviewSection overview={overview} />

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-4 dark:border-zinc-800">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Usuários <span className="font-normal text-zinc-500">({filtered.length})</span>
          </h2>
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Buscar por e-mail"
              aria-label="Buscar por e-mail"
              className="h-9 w-full rounded-xl border border-zinc-200 bg-transparent pl-8 pr-3 text-sm dark:border-zinc-800"
            />
          </div>
          <select aria-label="Filtrar" value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(0); }} className={selectClass}>
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {selected.size > 0 ? (
          <div className="flex items-center gap-3 border-b border-zinc-100 bg-brand/5 px-4 py-2 text-sm dark:border-zinc-800">
            <span className="text-zinc-700 dark:text-zinc-300">{selected.size} selecionado(s)</span>
            <button type="button" onClick={() => setSelected(new Set())} className="cursor-pointer text-xs text-zinc-500 hover:underline">Limpar</button>
            <button type="button" disabled={busy} onClick={() => setToDelete(selectedUsers)} className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
              <Trash2 className="h-3.5 w-3.5" /> Excluir selecionados
            </button>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            {users.length === 0 ? "Nenhum usuário cadastrado ainda." : "Nenhum usuário encontrado."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <li className="flex items-center gap-3 px-4 py-2 text-xs text-zinc-500">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="Selecionar todos desta página" className="h-4 w-4 cursor-pointer accent-[var(--color-brand,#7c3aed)]" />
              Selecionar página
            </li>
            {visible.map((user) => (
              <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggle(user.id)} aria-label={`Selecionar ${user.email}`} className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-brand,#7c3aed)]" />
                <button type="button" onClick={() => setDetailId(user.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                  <p className="truncate text-sm font-medium text-zinc-900 hover:text-brand dark:text-zinc-100">{user.email}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {loginLabel(user)} · criado em {formatDate(user.createdAt)} · ativo {formatRelative(user.lastActivityAt)} ·{" "}
                    {user.tasks} tarefas · {user.habits} hábitos · {user.transactions} transações
                  </p>
                </button>
                <button type="button" disabled={busy} onClick={() => setToDelete([user])} aria-label={`Excluir ${user.email}`} className="shrink-0 cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800">
            <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="cursor-pointer rounded-lg px-2 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">Anterior</button>
            <span>Página {currentPage + 1} de {pageCount}</span>
            <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="cursor-pointer rounded-lg px-2 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">Próxima</button>
          </div>
        ) : null}
      </section>

      <UserDetailDialog
        user={detailUser}
        aiDailyLimit={overview.system.aiDailyLimit}
        busy={busy}
        onClose={() => setDetailId(null)}
        onRevoke={(u) => void revokeSessions(u)}
        onResetAi={(u) => void resetAi(u)}
        onDelete={(u) => setToDelete([u])}
      />
      <ConfirmDeleteDialog
        emails={toDelete.map((u) => u.email)}
        busy={busy}
        onCancel={() => setToDelete([])}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
