"use client";

import React, { useMemo } from "react";
import { Flame, Percent, Trophy } from "lucide-react";
import { GlowCard } from "@/shared/effects/glow-card";
import { formatShortDate, todayKey } from "@/shared/lib/date-utils";
import { cn } from "@/shared/lib/utils";
import { ALL_CATEGORIES, filterByCategory } from "../domain/task.selectors";
import { computeTaskStreakStats, streakRange } from "../domain/task.streak";
import { useTasks } from "../hooks/use-tasks";

const STREAK_DAYS = 28;

interface TaskStreakChartProps {
  categoryId?: string;
}

export function TaskStreakChart({ categoryId = ALL_CATEGORIES }: TaskStreakChartProps) {
  const range = useMemo(() => streakRange(STREAK_DAYS), []);
  const { data, isPending } = useTasks(range);

  const stats = useMemo(() => {
    const tasks = filterByCategory(data ?? [], categoryId);
    return computeTaskStreakStats(tasks, STREAK_DAYS);
  }, [data, categoryId]);

  if (isPending && !data) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-zinc-200/70 bg-zinc-100/60 dark:border-zinc-800/70 dark:bg-zinc-900/40" />
    );
  }

  const today = todayKey();
  const streakLabel = stats.currentStreak === 1 ? "dia" : "dias";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GlowCard glowColor="amber" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Streak atual
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/10 text-amber-600 dark:border-amber-800/40 dark:bg-amber-500/20 dark:text-amber-400">
              <Flame className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 sm:text-3xl">
            {stats.currentStreak}
            <span className="ml-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {streakLabel}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Dias seguidos com 100% das tarefas
          </p>
        </GlowCard>

        <GlowCard glowColor="purple" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Melhor streak
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand dark:text-brand-soft">
              <Trophy className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {stats.bestStreak}
            <span className="ml-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {stats.bestStreak === 1 ? "dia" : "dias"}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Recorde nos últimos {STREAK_DAYS} dias
          </p>
        </GlowCard>

        <GlowCard glowColor="emerald" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Conclusão
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            {stats.completionPercent}%
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {stats.perfectDays} de {stats.activeDays} dias perfeitos
          </p>
        </GlowCard>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#100e1e]/70 sm:p-5">
        <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Progresso diário
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              % de tarefas concluídas por dia · últimos {STREAK_DAYS} dias
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
              Sem tarefas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-brand/40" />
              Parcial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              100%
            </span>
          </div>
        </div>

        <div
          className="mt-4 flex h-32 items-end gap-1 sm:gap-1.5"
          role="img"
          aria-label={`Gráfico de conclusão dos últimos ${STREAK_DAYS} dias. Streak atual: ${stats.currentStreak} ${streakLabel}. Conclusão geral: ${stats.completionPercent}%.`}
        >
          {stats.days.map((day) => {
            const isToday = day.date === today;
            const height = day.percent === null ? 8 : Math.max(12, day.percent);
            const title =
              day.percent === null
                ? `${formatShortDate(day.date)}: sem tarefas`
                : `${formatShortDate(day.date)}: ${day.completed}/${day.total} (${day.percent}%)`;

            return (
              <div
                key={day.date}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div
                  title={title}
                  className={cn(
                    "w-full max-w-3 rounded-t-md transition-all duration-300",
                    day.percent === null && "bg-zinc-100 dark:bg-zinc-800/80",
                    day.percent !== null && day.perfect && "bg-emerald-500",
                    day.percent !== null &&
                      !day.perfect &&
                      day.percent >= 50 &&
                      "bg-brand/70",
                    day.percent !== null &&
                      !day.perfect &&
                      day.percent < 50 &&
                      "bg-brand/35",
                    isToday && "ring-2 ring-brand/50 ring-offset-1 ring-offset-white dark:ring-offset-[#100e1e]"
                  )}
                  style={{ height: `${height}%` }}
                />
                <span
                  className={cn(
                    "mt-1.5 hidden text-[9px] font-mono sm:block",
                    isToday
                      ? "font-bold text-brand dark:text-brand-soft"
                      : "text-zinc-400 dark:text-zinc-600"
                  )}
                >
                  {day.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
