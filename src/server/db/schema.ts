import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
  /** Id da transação na Pluggy; nulo para lançamentos manuais. */
  externalId: text('external_id'),
  /** Banco de origem, quando o lançamento foi importado. */
  institution: text('institution'),
  /** Falso em pagamento de fatura: aparece no extrato, mas não entra no saldo de planejamento. */
  countsInBalance: integer('counts_in_balance', { mode: 'boolean' }).notNull().default(true),
  /** Compra de cartão ainda na fatura aberta (status PENDING na Pluggy). */
  pending: integer('pending', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [uniqueIndex('transactions_external_id_unique').on(t.externalId)]);

/** Faturas de cartão importadas. O total é o da fatura, não a soma das compras do mês. */
export const cardBills = sqliteTable('card_bills', {
  id: text('id').primaryKey(),
  dueDate: text('due_date').notNull(),
  closingDate: text('closing_date'),
  totalAmountCents: integer('total_amount_cents').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Conexões Pluggy (um item por banco). `GET /items` não existe no MeuPluggy, então o id fica guardado aqui. */
export const bankConnections = sqliteTable('bank_connections', {
  itemId: text('item_id').primaryKey(),
  institution: text('institution').notNull(),
  status: text('status').notNull(),
  errorCode: text('error_code'),
  consentExpiresAt: text('consent_expires_at'),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Transações importadas que o usuário excluiu; a sincronização não as recria. */
export const dismissedBankTransactions = sqliteTable('dismissed_bank_transactions', {
  externalId: text('external_id').primaryKey(),
  dismissedAt: text('dismissed_at').notNull(),
});

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name'),
  photo: text('photo'),
  bio: text('bio'),
  updatedAt: text('updated_at').notNull(),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  period: text('period', { enum: ['morning', 'afternoon', 'evening', 'anytime'] }).notNull(),
  type: text('type', { enum: ['boolean', 'numeric'] }).notNull(),
  targetValue: real('target_value'),
  unit: text('unit'),
  step: real('step'),
  frequencyType: text('frequency_type', {
    enum: ['daily', 'specific_days', 'weekly_target'],
  }).notNull(),
  /** JSON array of weekdays 0–6. */
  frequencyDays: text('frequency_days'),
  weeklyTargetCount: integer('weekly_target_count'),
  archivedAt: text('archived_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const habitCheckins = sqliteTable('habit_checkins', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  currentValue: real('current_value'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});
