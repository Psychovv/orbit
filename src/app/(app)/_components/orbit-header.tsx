"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Calendar, Wallet, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { OrbitMark } from "@/shared/ui/orbit-mark";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { countCompleted } from "@/features/tasks/domain/task.selectors";
import { useTransactions } from "@/features/finance/hooks/use-finance";
import { netBalance } from "@/features/finance/domain/metrics";
import { formatBRL } from "@/features/finance/domain/money";

interface OrbitHeaderProps {
  onOpenMobileMenu: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export function OrbitHeader({ onOpenMobileMenu, isSidebarCollapsed = false, onToggleSidebarCollapse }: OrbitHeaderProps) {
  const isFinance = usePathname().startsWith("/finance");

  return (
    <header className="sticky top-0 z-20 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#090812]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Brand / Desktop Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle Button */}
            {onToggleSidebarCollapse && (
              <button
                onClick={onToggleSidebarCollapse}
                className="hidden md:flex p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title={isSidebarCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                aria-label={isSidebarCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-[#844DFE]" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 text-zinc-500 hover:text-[#844DFE]" />
                )}
              </button>
            )}

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
                    <Wallet className="w-4 h-4 text-[#844DFE]" />
                    <span>Planejamento Financeiro</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-[#844DFE]" />
                    <span>Tarefas & Calendário</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right: Quick info & Theme toggle */}
          <div className="flex items-center gap-3">
            {isFinance ? <BalanceSummary /> : <TasksSummary />}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

function BalanceSummary() {
  const { data } = useTransactions();
  if (!data) return null;
  return (
    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
      Saldo: {formatBRL(netBalance(data))}
    </div>
  );
}

function TasksSummary() {
  const { data } = useTasks();
  if (!data) return null;
  return (
    <div className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 hidden sm:block">
      {countCompleted(data)} de {data.length} concluídas
    </div>
  );
}
