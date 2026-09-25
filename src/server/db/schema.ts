import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const taskCategories = sqliteTable('task_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  time: text('time'),
  categoryId: text('category_id'),
  priority: text('priority', { enum: ['baixa', 'media', 'alta'] }).notNull(),
  completedAt: text('completed_at'),
  focusSeconds: integer('focus_seconds').notNull().default(0),
  focusStartedAt: text('focus_started_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const financeCategories = sqliteTable('finance_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  monthlyBudgetCents: integer('monthly_budget_cents'),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  categoryId: text('category_id'),
  date: text('date').notNull(),
  paymentMethod: text('payment_method', { enum: ['pix', 'cartao', 'dinheiro', 'boleto', 'transferencia'] }).notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
