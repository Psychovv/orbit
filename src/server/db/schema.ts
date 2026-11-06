import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

/**
 * Id fixo do dono (login por `AUTH_EMAIL`/`AUTH_PASSWORD`). Os dados de antes do multiusuário
 * ficam com ele pelo default da coluna `user_id`.
 */
export const OWNER_USER_ID = 'owner';

/** Dono do registro. Default `owner` para o `drizzle-kit push` adicionar a coluna sem perder dados. */
const userId = () => text('user_id').notNull().default(OWNER_USER_ID);

/** Usuários cadastrados pelo `/signup`. O dono não está aqui: entra pelas variáveis de ambiente. */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  /** Sempre em minúsculas. */
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('users_email_unique').on(t.email)]);

export const taskCategories = sqliteTable('task_categories', {
  id: text('id').primaryKey(),
  userId: userId(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
}, (t) => [index('task_categories_user_id_idx').on(t.userId)]);

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: userId(),
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
}, (t) => [index('tasks_user_id_idx').on(t.userId)]);

export const financeCategories = sqliteTable('finance_categories', {
  id: text('id').primaryKey(),
  userId: userId(),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  monthlyBudgetCents: integer('monthly_budget_cents'),
}, (t) => [index('finance_categories_user_id_idx').on(t.userId)]);

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: userId(),
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
}, (t) => [index('transactions_user_id_idx').on(t.userId), uniqueIndex('transactions_external_id_unique').on(t.externalId)]);

/** Faturas de cartão importadas. O total é o da fatura fechada, não o saldo em aberto. */
export const cardBills = sqliteTable('card_bills', {
  id: text('id').primaryKey(),
  dueDate: text('due_date').notNull(),
  closingDate: text('closing_date'),
  totalAmountCents: integer('total_amount_cents').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Contas e cartões da Pluggy, com saldo atual (o mesmo do Overview do Meu Pluggy). */
export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull(),
  type: text('type', { enum: ['BANK', 'CREDIT'] }).notNull(),
  subtype: text('subtype'),
  name: text('name').notNull(),
  number: text('number'),
  balanceCents: integer('balance_cents').notNull(),
  creditLimitCents: integer('credit_limit_cents'),
  availableLimitCents: integer('available_limit_cents'),
  dueDate: text('due_date'),
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
  userId: userId(),
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
}, (t) => [index('habits_user_id_idx').on(t.userId)]);

export const habitCheckins = sqliteTable('habit_checkins', {
  id: text('id').primaryKey(),
  userId: userId(),
  habitId: text('habit_id').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  currentValue: real('current_value'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('habit_checkins_user_id_idx').on(t.userId), uniqueIndex('habit_checkins_habit_date_unique').on(t.habitId, t.date)]);
