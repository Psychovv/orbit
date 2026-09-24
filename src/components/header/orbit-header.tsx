"use client";

import React from "react";
import { Menu, Calendar, Wallet, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { OrbitMark } from "@/components/orbit-mark";

interface OrbitHeaderProps {
  activeModule: "tasks" | "finance";
  onSelectModule: (module: "tasks" | "finance") => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  netBalance: number;
  totalCompletedTasks: number;
  totalTasks: number;
}

export function OrbitHeader({
  activeModule,
  onSelectModule,
  onOpenMobileMenu,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  netBalance,
  totalCompletedTasks,
  totalTasks,
}: OrbitHeaderProps) {
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

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
                {activeModule === "tasks" ? (
                  <>
                    <Calendar className="w-4 h-4 text-[#844DFE]" />
                    <span>Tarefas & Calendário</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-[#844DFE]" />
                    <span>Planejamento Financeiro</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right: Quick info & Theme toggle */}
          <div className="flex items-center gap-3">
            {activeModule === "finance" ? (
              <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
                Saldo: {formatBRL(netBalance)}
              </div>
            ) : (
              <div className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 hidden sm:block">
                {totalCompletedTasks} de {totalTasks} concluídas
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
