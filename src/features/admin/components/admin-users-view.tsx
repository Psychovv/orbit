"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import type { AdminUser } from "@/server/db/repositories/admin.server";
import { toast } from "@/shared/ui/toast";

async function request(url: string, method: string): Promise<void> {
  const res = await fetch(url, { method });
  if (res.ok) return;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  throw new Error(body?.error ?? "Tente novamente.");
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleDateString("pt-BR");
}

export function AdminUsersView({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? users.filter((u) => u.email.includes(term)) : users;
  }, [users, query]);

  const handleDelete = async (user: AdminUser) => {
    const typed = window.prompt(
      `Isso exclui ${user.email} e TODOS os dados dele (tarefas, finanças, hábitos e perfil) de forma permanente. ` +
        "Para confirmar, digite o e-mail do usuário:"
    );
    if (typed?.trim().toLowerCase() !== user.email) return;
    setBusyId(user.id);
    try {
      await request(`/api/admin/users/${encodeURIComponent(user.id)}`, "DELETE");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast({ message: "Usuário excluído", description: user.email, tone: "success" });
    } catch (error) {
      toast({ message: "Falha ao excluir", description: error instanceof Error ? error.message : undefined, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (user: AdminUser) => {
    if (!window.confirm(`Encerrar todas as sessões de ${user.email}? Ele precisará entrar de novo.`)) return;
    setBusyId(user.id);
    try {
      await request(`/api/admin/users/${encodeURIComponent(user.id)}/sessions`, "DELETE");
      toast({ message: "Sessões encerradas", description: user.email, tone: "success" });
    } catch (error) {
      toast({ message: "Falha ao encerrar sessões", description: error instanceof Error ? error.message : undefined, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const totals = useMemo(
    () => ({
      tasks: users.reduce((sum, u) => sum + u.tasks, 0),
      habits: users.reduce((sum, u) => sum + u.habits, 0),
      transactions: users.reduce((sum, u) => sum + u.transactions, 0),
    }),
    [users]
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Orbit
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Administração</h1>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Usuários", users.length],
          ["Tarefas", totals.tasks],
          ["Hábitos", totals.habits],
          ["Transações", totals.transactions],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2 border-b border-zinc-100 p-4 dark:border-zinc-800">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Usuários cadastrados</h2>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por e-mail"
              aria-label="Buscar por e-mail"
              className="h-9 w-full rounded-xl border border-zinc-200 bg-transparent pl-8 pr-3 text-sm dark:border-zinc-800"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            {users.length === 0 ? "Nenhum usuário cadastrado ainda." : "Nenhum usuário encontrado."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.email}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Criado em {formatDate(user.createdAt)} ·{" "}
                    {[user.hasPassword && "senha", user.hasGoogle && "Google"].filter(Boolean).join(" + ") || "sem login"} ·{" "}
                    {user.tasks} tarefas · {user.habits} hábitos · {user.transactions} transações
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void handleRevoke(user)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Encerrar sessões
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void handleDelete(user)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {busyId === user.id ? "Aguarde…" : "Excluir"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
