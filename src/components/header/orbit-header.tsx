"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  CheckCircle2,
  Wallet,
  TrendingUp,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

interface OrbitHeaderProps {
  activeModule: "tasks" | "finance";
  onSelectModule: (module: "tasks" | "finance") => void;
  tasksCompletionRate: number;
  totalCompletedTasks: number;
  totalTasks: number;
  netBalance: number;
  onResetData: () => void;
}

export function OrbitHeader({
  activeModule,
  onSelectModule,
  tasksCompletionRate,
  totalCompletedTasks,
  totalTasks,
  netBalance,
  onResetData,
}: OrbitHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#090812]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#844DFE] shadow-sm shadow-[#844DFE]/30 text-white">
              <span className="text-lg">🪐</span>
              {/* Planetary Orbit Ring */}
              <div className="absolute inset-[-3px] rounded-xl border border-[#844DFE]/40 pointer-events-none" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                  ORBIT
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
                Hub Pessoal
              </p>
            </div>
          </div>

          {/* Module Switcher - Centered Clean Dock */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80">
            <button
              onClick={() => onSelectModule("tasks")}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer",
                activeModule === "tasks"
                  ? "text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {activeModule === "tasks" && (
                <motion.div
                  layoutId="activeModuleBubble"
                  className="absolute inset-0 bg-[#844DFE] rounded-lg shadow-sm shadow-[#844DFE]/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Calendar className="w-4 h-4" />
              <span>Tarefas</span>
            </button>

            <button
              onClick={() => onSelectModule("finance")}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer",
                activeModule === "finance"
                  ? "text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {activeModule === "finance" && (
                <motion.div
                  layoutId="activeModuleBubble"
                  className="absolute inset-0 bg-[#844DFE] rounded-lg shadow-sm shadow-[#844DFE]/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Wallet className="w-4 h-4" />
              <span>Finanças</span>
            </button>
          </nav>

          {/* Right Action Icons: Reset data, Theme toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetData}
              title="Restaurar dados de exemplo"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Restaurar</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
