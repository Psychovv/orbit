"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Wallet,
  Plus,
  SlidersHorizontal,
  RotateCcw,
  X,
  Layers,
} from "lucide-react";
import { ThemeToggle } from "@/components/header/theme-toggle";
import { Task, TaskCategory, Transaction } from "@/types/orbit";
import { cn } from "@/lib/utils";

interface OrbitSidebarProps {
  activeModule: "tasks" | "finance";
  onSelectModule: (module: "tasks" | "finance") => void;
  categories: TaskCategory[];
  tasks: Task[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenCategoriesModal: () => void;
  onOpenAddTaskModal: () => void;
  onResetData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function OrbitSidebar({
  activeModule,
  onSelectModule,
  categories,
  tasks,
  selectedCategoryId,
  onSelectCategory,
  onOpenCategoriesModal,
  onOpenAddTaskModal,
  onResetData,
  isOpenMobile,
  onCloseMobile,
}: OrbitSidebarProps) {
  const completedTasks = tasks.filter((t) => t.completed).length;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#844DFE] shadow-sm shadow-[#844DFE]/30 text-white">
            <span className="text-lg">🪐</span>
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
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Hub Pessoal
            </p>
          </div>
        </div>

        {/* Close button on mobile */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="px-3 pt-5 pb-3">
        <p className="px-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          Navegação
        </p>
        <div className="space-y-1">
          {/* Tarefas */}
          <button
            onClick={() => {
              onSelectModule("tasks");
              onCloseMobile();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
              activeModule === "tasks"
                ? "bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Calendar className={cn("w-4 h-4", activeModule === "tasks" ? "text-[#844DFE]" : "text-zinc-400")} />
              <span>Tarefas</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              {completedTasks}/{tasks.length}
            </span>
          </button>

          {/* Finanças */}
          <button
            onClick={() => {
              onSelectModule("finance");
              onCloseMobile();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
              activeModule === "finance"
                ? "bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className={cn("w-4 h-4", activeModule === "finance" ? "text-[#844DFE]" : "text-zinc-400")} />
              <span>Finanças</span>
            </div>
          </button>
        </div>
      </div>

      {/* Task Categories Section */}
      <div className="px-3 pt-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Categorias
          </p>
          <button
            onClick={onOpenCategoriesModal}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Gerenciar categorias"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {/* Todas as Tarefas */}
          <button
            onClick={() => {
              onSelectCategory("all");
              if (activeModule !== "tasks") onSelectModule("tasks");
              onCloseMobile();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
              selectedCategoryId === "all" && activeModule === "tasks"
                ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Todas as tarefas</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {tasks.length}
            </span>
          </button>

          {/* Categories List */}
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id && activeModule === "tasks";

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  if (activeModule !== "tasks") onSelectModule("tasks");
                  onCloseMobile();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold ring-1 ring-[#844DFE]/30"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Quick Actions */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        {/* Quick Add Button */}
        <button
          onClick={() => {
            onOpenAddTaskModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#844DFE] hover:bg-[#723ce6] text-white text-xs font-semibold shadow-sm shadow-[#844DFE]/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>

        {/* Theme Toggle & Reset Data */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onResetData}
            title="Restaurar dados iniciais"
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#090812]/90 backdrop-blur-xl z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-over panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#0c0a18] shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
