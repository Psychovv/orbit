import { Bot, Check, KeyRound, Landmark, Mail, X } from "lucide-react";
import type { AdminOverview } from "../domain/admin.types";

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function SignupsChart({ data }: { data: AdminOverview["signupsByDay"] }) {
  const peak = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-24 items-end gap-1" role="img" aria-label="Cadastros por dia nos últimos 14 dias">
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.count}`}>
            <div
              className="w-full rounded-t bg-brand/70 group-hover:bg-brand"
              style={{ height: d.count === 0 ? "2px" : `${Math.max(8, (d.count / peak) * 100)}%`, opacity: d.count === 0 ? 0.3 : 1 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
        <span>{data[0]?.date.slice(5).split("-").reverse().join("/")}</span>
        <span>{data.at(-1)?.date.slice(5).split("-").reverse().join("/")}</span>
      </div>
    </div>
  );
}

function Flag({ icon: Icon, label, on }: { icon: typeof Mail; label: string; on: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <Icon className="h-4 w-4 text-zinc-400" />
      <span className="flex-1">{label}</span>
      {on ? <Check className="h-4 w-4 text-emerald-500" aria-label="Ativo" /> : <X className="h-4 w-4 text-zinc-400" aria-label="Inativo" />}
    </li>
  );
}

export function AdminOverviewSection({ overview }: { overview: AdminOverview }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Usuários" value={overview.totalUsers} hint={`${overview.withPassword} senha · ${overview.withGoogle} Google`} />
        <Stat label="Novos (7 dias)" value={overview.newLast7Days} hint={`${overview.newLast30Days} em 30 dias`} />
        <Stat label="Ativos (7 dias)" value={overview.activeLast7Days} />
        <Stat
          label="Dados"
          value={overview.totals.tasks + overview.totals.habits + overview.totals.transactions}
          hint={`${overview.totals.tasks} tarefas · ${overview.totals.habits} hábitos · ${overview.totals.transactions} transações`}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cadastros nos últimos 14 dias</h2>
          <SignupsChart data={overview.signupsByDay} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sistema</h2>
          <ul className="space-y-2">
            <Flag icon={KeyRound} label="Cadastro com código de convite" on={overview.system.inviteRequired} />
            <Flag icon={Mail} label="Login com Google" on={overview.system.googleLogin} />
            <Flag icon={Bot} label={`Assistente de IA (${overview.system.aiDailyLimit}/dia)`} on={overview.system.aiConfigured} />
            <Flag icon={Landmark} label="Integração bancária (Pluggy)" on={overview.system.pluggyConfigured} />
          </ul>
          {!overview.system.inviteRequired ? (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              O cadastro está aberto: qualquer pessoa com o link pode criar conta. Defina SIGNUP_INVITE_CODE para restringir.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
