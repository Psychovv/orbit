export type DayOfWeek = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type Priority = "baixa" | "media" | "alta";

export interface TaskCategory {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  icon: string; // Emoji or Lucide icon identifier
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  day: DayOfWeek;
  categoryId: string;
  completed: boolean;
  priority: Priority;
  time?: string;
  createdAt: string;
}

export type TransactionType = "income" | "expense";

export interface FinanceCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  monthlyBudget?: number; // Budget target for expenses
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date string YYYY-MM-DD
  paymentMethod: "pix" | "cartao" | "dinheiro" | "boleto" | "transferencia";
  notes?: string;
}

export interface WeekDayInfo {
  key: DayOfWeek;
  name: string;
  shortName: string;
  description: string;
}
