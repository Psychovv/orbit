"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Pencil, Timer, Wallet } from "lucide-react";
import { useTodayTasksSummary } from "@/features/tasks/hooks/use-today-tasks";
import { useMonthBalance } from "@/features/finance/hooks/use-month-balance";
import { formatBRL } from "@/features/finance/domain/money";
import { GlowCard } from "@/shared/effects/glow-card";
import { useLocalString } from "@/shared/lib/use-local-preference";
import { OrbitMark } from "@/shared/ui/orbit-mark";

const USER_NAME_KEY = "orbit_user_name";

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
  const today = useTodayTasksSummary();
  const balance = useMonthBalance();

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center py-6 sm:py-10">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mb-10 sm:mb-14">
        <div className="mb-5 flex items-center gap-3">
          <OrbitMark className="h-11 w-11 shadow-lg shadow-brand/30" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand dark:text-brand-soft">
            Orbit
          </span>
        </div>
        <Greeting />
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg">
          Seu hub pessoal. Entre em um módulo e continue de onde parou.
        </p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const detail =
            module.href === "/tasks"
              ? today === null
                ? "Carregando tarefas"
                : today.total === 0
                  ? "Nada agendado para hoje"
                  : `Hoje: ${today.completed} de ${today.total} concluídas`
              : balance === null
                ? "Carregando saldo"
                : `Saldo do mês ${formatBRL(balance)}`;

          return (
            <Link key={module.href} href={module.href} className="group block">
              <GlowCard glowColor={module.glow} className="h-full p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={
                      module.href === "/finance"
                        ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand dark:text-brand-soft"
                    }
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <ArrowRight className="h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand dark:text-zinc-600" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {module.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {module.description}
                </p>
                <p className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {module.href === "/tasks" ? <Timer className="h-3.5 w-3.5 text-brand" /> : null}
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

/** Saudação com o nome salvo no navegador; clique para editar. */
function Greeting() {
  const [name, setName] = useLocalString(USER_NAME_KEY);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft !== null) setName(draft.trim().slice(0, 40));
    setDraft(null);
  };

  if (draft !== null) {
    return (
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Bem-vindo,
        </span>
        <input
          autoFocus
          value={draft}
          maxLength={40}
          placeholder="seu nome"
          aria-label="Seu nome"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(null);
          }}
          className="w-full max-w-xs border-b-2 border-brand/40 bg-transparent text-4xl font-black tracking-tight text-zinc-900 placeholder:text-zinc-300 focus:border-brand focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-700 sm:text-6xl"
        />
      </div>
    );
  }

  return (
    <h1 className="group flex flex-wrap items-center gap-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
      <span>{name ? `Bem-vindo, ${name}` : "Bem-vindo"}</span>
      <button
        type="button"
        onClick={() => setDraft(name ?? "")}
        title={name ? "Alterar nome" : "Definir seu nome"}
        aria-label={name ? "Alterar nome" : "Definir seu nome"}
        className={
          name
            ? "rounded-xl p-2 text-zinc-300 opacity-100 transition-opacity hover:bg-brand/10 hover:text-brand sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 dark:text-zinc-600 cursor-pointer"
            : "inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand/40 px-3 py-1.5 text-sm font-semibold tracking-normal text-brand hover:bg-brand/10 dark:text-brand-soft cursor-pointer"
        }
      >
        <Pencil className={name ? "h-5 w-5" : "h-3.5 w-3.5"} />
        {!name && <span>Definir nome</span>}
      </button>
    </h1>
  );
}
