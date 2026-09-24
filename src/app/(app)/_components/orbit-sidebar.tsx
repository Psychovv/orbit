"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Wallet,
  Plus,
  SlidersHorizontal,
  RotateCcw,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { dataSource, resetLocalData } from "@/config/data-source";
import { useTaskDialogs } from "@/features/tasks/components/task-dialogs";
import { ALL_CATEGORIES, countByCategory, countCompleted } from "@/features/tasks/domain/task.selectors";
import { useTaskCategories, useTasks } from "@/features/tasks/hooks/use-tasks";
import { TASKS_PATH, tasksHref } from "@/features/tasks/hooks/use-tasks-view-state";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { OrbitMark } from "@/shared/ui/orbit-mark";
import { cn } from "@/shared/lib/utils";

const FINANCE_PATH = "/finance";

interface OrbitSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function OrbitSidebar({ isOpenMobile, onCloseMobile, isCollapsed = false, onToggleCollapse }: OrbitSidebarProps) {
  const pathname = usePathname();
  const activeModule = pathname.startsWith(FINANCE_PATH) ? "finance" : "tasks";
  const [isTaskCategoriesExpanded, setIsTaskCategoriesExpanded] = useState(true);
  const dialogs = useTaskDialogs();
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useTasks();
  const completedTasks = countCompleted(tasks);

  const handleResetData = () => {
    if (window.confirm("Deseja restaurar as tarefas e finanças para os dados de demonstração?")) {
      resetLocalData();
      queryClient.resetQueries();
    }
  };

  // Render content when expanded
  const expandedContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header with Collapse Toggle */}
      <div className="flex items-center justify-between p-4.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <OrbitMark className="h-9 w-9" />
            <div className="absolute inset-[-2px] rounded-xl border border-[#844DFE]/40 pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-zinc-900 dark:text-zinc-100">
                ORBIT
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded-full bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/20">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Hub Pessoal
            </p>
          </div>
        </div>

        {/* Desktop Collapse Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Recolher barra lateral"
            aria-label="Recolher barra lateral"
          >
            <PanelLeftClose className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation with Nested Categories in Tasks */}
      <div className="px-3 pt-4 flex-1 overflow-y-auto space-y-4">
        <div>
          <p className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Módulos
          </p>

          <div className="space-y-1">
            {/* Item 1: Tarefas & Categorias Agrupadas */}
            <div>
              <Link
                href={TASKS_PATH}
                onClick={(e) => {
                  if (activeModule === "tasks") {
                    e.preventDefault();
                    setIsTaskCategoriesExpanded((prev) => !prev);
                  } else {
                    setIsTaskCategoriesExpanded(true);
                    onCloseMobile();
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeModule === "tasks"
                    ? "bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar
                    className={cn(
                      "w-4 h-4",
                      activeModule === "tasks" ? "text-[#844DFE]" : "text-zinc-400"
                    )}
                  />
                  <span>Tarefas</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {completedTasks}/{tasks.length}
                  </span>
                  {activeModule === "tasks" && (
                    <span className="text-zinc-400">
                      {isTaskCategoriesExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </Link>

              {/* Categorias como parte interna de Tarefas */}
              <AnimatePresence initial={false}>
                {activeModule === "tasks" && isTaskCategoriesExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-2.5 my-1.5 border-l-2 border-[#844DFE]/20 space-y-0.5">
                      <div className="flex items-center justify-between pr-2 py-1">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Categorias
                        </span>
                        <button
                          onClick={dialogs.openCategories}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Gerenciar categorias"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                        </button>
                      </div>

                      <Suspense fallback={null}>
                        <CategoryLinks onNavigate={onCloseMobile} />
                      </Suspense>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Item 2: Finanças (Totalmente separado, sem categorias de tarefas) */}
            <div>
              <Link
                href={FINANCE_PATH}
                onClick={onCloseMobile}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeModule === "finance"
                    ? "bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet
                    className={cn(
                      "w-4 h-4",
                      activeModule === "finance" ? "text-[#844DFE]" : "text-zinc-400"
                    )}
                  />
                  <span>Finanças</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Quick Actions */}
      <div className="p-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5">
        {/* Quick Add Button */}
        <button
          onClick={() => {
            dialogs.openAddTask();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#844DFE] hover:bg-[#723ce6] text-white text-xs font-semibold shadow-sm shadow-[#844DFE]/25 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tarefa</span>
        </button>

        {/* Theme Toggle & Reset Data */}
        <div className="flex items-center justify-between pt-1">
          {dataSource === "local" ? (
            <button
              onClick={handleResetData}
              title="Restaurar dados iniciais"
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
          ) : (
            <span />
          )}

          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  // Render content when collapsed (Compact 72px rail)
  const collapsedContent = (
    <div className="flex flex-col h-full items-center py-4 justify-between">
      {/* Top: Logo & Expand Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="relative flex h-10 w-10 items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm shadow-[#844DFE]/30 rounded-xl"
          title="Orbit • Clique para expandir"
        >
          <OrbitMark className="h-10 w-10" />
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-zinc-400 hover:text-[#844DFE] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Expandir barra lateral"
            aria-label="Expandir barra lateral"
          >
            <PanelLeftOpen className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Middle: Icon Module Navigation with Tooltips */}
      <div className="space-y-3 flex flex-col items-center">
        {/* Tarefas Icon */}
        <div className="relative group">
          <Link
            href={TASKS_PATH}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer",
              activeModule === "tasks"
                ? "bg-[#844DFE] text-white shadow-sm shadow-[#844DFE]/30"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
            aria-label="Módulo de Tarefas"
          >
            <Calendar className="w-5 h-5" />
          </Link>

          {/* Hover Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            Tarefas ({completedTasks}/{tasks.length})
          </div>
        </div>

        {/* Finanças Icon */}
        <div className="relative group">
          <Link
            href={FINANCE_PATH}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer",
              activeModule === "finance"
                ? "bg-[#844DFE] text-white shadow-sm shadow-[#844DFE]/30"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
            aria-label="Módulo de Finanças"
          >
            <Wallet className="w-5 h-5" />
          </Link>

          {/* Hover Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            Planejamento Financeiro
          </div>
        </div>

        {/* Quick Add Task */}
        <div className="relative group pt-2">
          <button
            onClick={() => dialogs.openAddTask()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#844DFE]/15 hover:bg-[#844DFE] text-[#844DFE] hover:text-white transition-all cursor-pointer"
            aria-label="Adicionar tarefa"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            Nova Tarefa
          </div>
        </div>
      </div>

      {/* Bottom: Theme Toggle */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (Collapsible width) */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#090812]/90 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {isCollapsed ? collapsedContent : expandedContent}
      </aside>

      {/* Mobile Drawer (always full width when opened) */}
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
              {expandedContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryLinks({ onNavigate }: { onNavigate: () => void }) {
  const searchParams = useSearchParams();
  const { data: categories = [] } = useTaskCategories();
  const { data: tasks = [] } = useTasks();
  const counts = countByCategory(tasks);
  const selectedCategoryId = searchParams.get("category") ?? ALL_CATEGORIES;

  return (
    <>
      {/* Todas as Tarefas */}
      <Link
        href={tasksHref(searchParams, { category: ALL_CATEGORIES })}
        onClick={onNavigate}
        scroll={false}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
          selectedCategoryId === ALL_CATEGORIES
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs border border-zinc-200/80 dark:border-zinc-700/80"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
        )}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>Todas</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">{tasks.length}</span>
      </Link>

      {/* Lista de Categorias de Tarefas */}
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={tasksHref(searchParams, { category: cat.id })}
          onClick={onNavigate}
          scroll={false}
          className={cn(
            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
            selectedCategoryId === cat.id
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs border border-[#844DFE]/30"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs shrink-0">{cat.icon}</span>
            <span className="truncate">{cat.name}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 shrink-0">{counts.get(cat.id) ?? 0}</span>
        </Link>
      ))}
    </>
  );
}
