import { Task, TaskCategory, Transaction, FinanceCategory } from "@/types/orbit";
import {
  INITIAL_TASKS,
  INITIAL_TASK_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_FINANCE_CATEGORIES,
} from "./initial-data";

const STORAGE_KEYS = {
  TASKS: "orbit_tasks_v1",
  CATEGORIES: "orbit_categories_v1",
  TRANSACTIONS: "orbit_transactions_v1",
  FINANCE_CATEGORIES: "orbit_finance_categories_v1",
};

export const OrbitStorage = {
  // Tasks
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return INITIAL_TASKS;
      const parsed = JSON.parse(data) as Task[];
      return parsed.map((t) => {
        if (!t.date) {
          return {
            ...t,
            date: t.createdAt ? t.createdAt.slice(0, 10) : "2026-09-23",
          };
        }
        return t;
      });
    } catch {
      return INITIAL_TASKS;
    }
  },
  saveTasks: (tasks: Task[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  },

  // Task Categories
  getCategories: (): TaskCategory[] => {
    if (typeof window === "undefined") return INITIAL_TASK_CATEGORIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_TASK_CATEGORIES;
    } catch {
      return INITIAL_TASK_CATEGORIES;
    }
  },
  saveCategories: (categories: TaskCategory[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  },

  // Finance Transactions
  getTransactions: (): Transaction[] => {
    if (typeof window === "undefined") return INITIAL_TRANSACTIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },
  saveTransactions: (transactions: Transaction[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions", e);
    }
  },

  // Finance Categories
  getFinanceCategories: (): FinanceCategory[] => {
    if (typeof window === "undefined") return INITIAL_FINANCE_CATEGORIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINANCE_CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_FINANCE_CATEGORIES;
    } catch {
      return INITIAL_FINANCE_CATEGORIES;
    }
  },
  saveFinanceCategories: (categories: FinanceCategory[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.FINANCE_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error("Failed to save finance categories", e);
    }
  },

  // Reset to initial mock data
  resetAll: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.FINANCE_CATEGORIES);
    } catch (e) {
      console.error("Failed to reset storage", e);
    }
  },
};
