"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Timer, Wallet } from "lucide-react";
import { countCompleted } from "@/features/tasks/domain/task.selectors";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { netBalance } from "@/features/finance/domain/metrics";
import { formatBRL } from "@/features/finance/domain/money";
import { useTransactions } from "@/features/finance/hooks/use-finance";
import { GlowCard } from "@/shared/effects/glow-card";
import { OrbitMark } from "@/shared/ui/orbit-mark";

const MODULES = [
  {
    href: "/tasks",
    title: "Tarefas",
    description: "Semana, categorias e tempo de foco para o que você quer realizar.",
    icon: Calendar,
    glow: "purple",
  },
  {
    href: "/finance",
    title: "Finanças",
    description: "Saldo, gastos e lançamentos do mês em um só lugar.",
    icon: Wallet,
    glow: "emerald",
  },
] as const;

export function HomeView() {
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const completed = tasks ? countCompleted(tasks) : null;

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center py-6 sm:py-10">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#844DFE]/20 blur-3xl" />

      <div className="relative mb-10 sm:mb-14">
        <div className="mb-5 flex items-center gap-3">
          <OrbitMark className="h-11 w-11 shadow-lg shadow-[#844DFE]/30" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#844DFE] dark:text-[#b494ff]">
            Orbit
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Bem vindo Psy
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg">
          Seu hub pessoal. Entre em um módulo e continue de onde parou.
        </p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const detail =
            module.href === "/tasks"
              ? completed === null
                ? "Carregando tarefas"
                : `${completed} de ${tasks?.length ?? 0} concluídas`
              : transactions
                ? `Saldo ${formatBRL(netBalance(transactions))}`
                : "Carregando saldo";

          return (
            <Link key={module.href} href={module.href} className="group block">
              <GlowCard glowColor={module.glow} className="h-full p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={
                      module.href === "/finance"
                        ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "flex h-12 w-12 items-center justify-center rounded-2xl bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff]"
                    }
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <ArrowRight className="h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#844DFE] dark:text-zinc-600" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {module.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {module.description}
                </p>
                <p className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {module.href === "/tasks" ? <Timer className="h-3.5 w-3.5 text-[#844DFE]" /> : null}
                  {detail}
                </p>
              </GlowCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
