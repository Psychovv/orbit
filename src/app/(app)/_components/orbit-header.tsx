"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Menu, Calendar, House, Settings, Wallet } from "lucide-react";
import { OrbitMark } from "@/shared/ui/orbit-mark";
import { formatShortMonth } from "@/shared/lib/date-utils";
import { useTodayTasksSummary } from "@/features/tasks/hooks/use-today-tasks";
import { useFinanceViewState } from "@/features/finance/hooks/use-finance-view-state";
import { useMonthBalance } from "@/features/finance/hooks/use-month-balance";
import { formatBRL } from "@/features/finance/domain/money";
import { UserAvatarLink } from "./user-avatar-link";

interface OrbitHeaderProps {
  onOpenMobileMenu: () => void;
}

export function OrbitHeader({ onOpenMobileMenu }: OrbitHeaderProps) {
  const pathname = usePathname();
  const isFinance = pathname.startsWith("/finance");
  const isTasks = pathname.startsWith("/tasks");
  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-20 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#090812]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Brand / Desktop Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <OrbitMark className="h-8 w-8" />
              <span className="font-bold text-sm tracking-wider text-zinc-900 dark:text-zinc-100">
                ORBIT
              </span>
            </div>

            {/* Desktop Module Indicator / Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {isFinance ? (
                  <>
                    <Wallet className="w-4 h-4 text-brand" />
                    <span>Planejamento Financeiro</span>
                  </>
                ) : isTasks ? (
                  <>
                    <Calendar className="w-4 h-4 text-brand" />
                    <span>Tarefas & Calendário</span>
                  </>
                ) : isSettings ? (
                  <>
                    <Settings className="w-4 h-4 text-brand" />
                    <span>Configurações</span>
                  </>
                ) : (
                  <>
                    <House className="w-4 h-4 text-brand" />
                    <span>Início</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right: Quick info + profile */}
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              {isFinance ? <BalanceSummary /> : isTasks ? <TasksSummary /> : null}
            </Suspense>
            <UserAvatarLink />
          </div>
        </div>
      </div>
    </header>
  );
}

function BalanceSummary() {
  const { monthKey, isCurrentMonth } = useFinanceViewState();
  const balance = useMonthBalance(monthKey);
  if (balance === null) return null;
  return (
    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
      {isCurrentMonth ? "Saldo do mês" : `Saldo de ${formatShortMonth(monthKey)}`}: {formatBRL(balance)}
    </div>
  );
}

function TasksSummary() {
  const today = useTodayTasksSummary();
  if (!today) return null;
  return (
    <div className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 hidden sm:block">
      {today.total === 0 ? "Nada para hoje" : `Hoje: ${today.completed} de ${today.total} concluídas`}
    </div>
  );
}
