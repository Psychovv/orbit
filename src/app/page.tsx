"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { OrbitHeader } from "@/components/header/orbit-header";
import { OrbitSidebar } from "@/components/sidebar/orbit-sidebar";
import { CosmicBackground } from "@/components/magic/cosmic-background";
import { TasksModule } from "@/components/tasks/tasks-module";
import { FinanceModule } from "@/components/finance/finance-module";
import { OrbitStorage } from "@/lib/storage";
import { Task, TaskCategory, Transaction, FinanceCategory } from "@/types/orbit";
import {
  INITIAL_TASKS,
  INITIAL_TASK_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_FINANCE_CATEGORIES,
} from "@/lib/initial-data";
import { Sparkles } from "lucide-react";

export default function OrbitApp() {
  const [activeModule, setActiveModule] = useState<"tasks" | "finance">("tasks");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>(INITIAL_TASK_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(INITIAL_FINANCE_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data on client mount
  useEffect(() => {
    const loadedTasks = OrbitStorage.getTasks();
    const loadedCats = OrbitStorage.getCategories();
    const loadedTxs = OrbitStorage.getTransactions();
    const loadedFinCats = OrbitStorage.getFinanceCategories();

    setTasks(loadedTasks);
    setTaskCategories(loadedCats);
    setTransactions(loadedTxs);
    setFinanceCategories(loadedFinCats);
    setIsLoaded(true);
  }, []);

  // Save changes to storage whenever state updates
  useEffect(() => {
    if (!isLoaded) return;
    OrbitStorage.saveTasks(tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    OrbitStorage.saveCategories(taskCategories);
  }, [taskCategories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    OrbitStorage.saveTransactions(transactions);
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    OrbitStorage.saveFinanceCategories(financeCategories);
  }, [financeCategories, isLoaded]);

  // Tasks handlers
  const handleAddTask = (newTaskData: Omit<Task, "id" | "createdAt" | "completed">) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddCategory = (newCat: TaskCategory) => {
    setTaskCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    setTaskCategories((prev) => prev.filter((c) => c.id !== catId));
    if (selectedCategoryId === catId) {
      setSelectedCategoryId("all");
    }
  };

  // Finance handlers
  const handleAddTransaction = (newTxData: Omit<Transaction, "id">) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Reset to initial mock
  const handleResetData = () => {
    if (window.confirm("Deseja restaurar as tarefas e finanças para os dados de demonstração?")) {
      OrbitStorage.resetAll();
      setTasks(INITIAL_TASKS);
      setTaskCategories(INITIAL_TASK_CATEGORIES);
      setTransactions(INITIAL_TRANSACTIONS);
      setFinanceCategories(INITIAL_FINANCE_CATEGORIES);
      setSelectedCategoryId("all");
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const netBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }, [transactions]);

  return (
    <div className="relative min-h-screen flex flex-col transition-colors duration-300">
      {/* Cosmic background with canvas stars & meteors */}
      <CosmicBackground />

      {/* Fixed Sidebar on Left (Desktop) & Drawer (Mobile) */}
      <OrbitSidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        categories={taskCategories}
        tasks={tasks}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onOpenCategoriesModal={() => setIsCategoriesModalOpen(true)}
        onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area - Shifted Right on Desktop */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        {/* Streamlined Top Header */}
        <OrbitHeader
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          netBalance={netBalance}
          totalCompletedTasks={completedTasks}
          totalTasks={totalTasks}
        />

        {/* Main Content View with Page Transitions */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {activeModule === "tasks" ? (
              <motion.div
                key="tasks-module"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <TasksModule
                  tasks={tasks}
                  categories={taskCategories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  onAddTask={handleAddTask}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  isAddModalOpen={isAddTaskModalOpen}
                  setIsAddModalOpen={setIsAddTaskModalOpen}
                  isCategoriesModalOpen={isCategoriesModalOpen}
                  setIsCategoriesModalOpen={setIsCategoriesModalOpen}
                />
              </motion.div>
            ) : (
              <motion.div
                key="finance-module"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <FinanceModule
                  transactions={transactions}
                  categories={financeCategories}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 mt-12 bg-white/60 dark:bg-[#070512]/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[#844DFE] font-bold">ORBIT</span>
              <span>&bull;</span>
              <span>Hub Pessoal de Organização & Finanças</span>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Sua vida em harmonia</span>
              <Sparkles className="w-3.5 h-3.5 text-[#844DFE]" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
