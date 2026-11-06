/** Tipos compartilhados entre o servidor e a página de administração. Sem dependências de servidor. */

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  tasks: number;
  habits: number;
  transactions: number;
  /** Última atividade registrada (tarefa, hábito ou check-in), ou null se nunca usou. */
  lastActivityAt: string | null;
  /** Chamadas ao assistente de IA na janela diária atual. */
  aiUsedToday: number;
}

export interface AdminOverview {
  totalUsers: number;
  newLast7Days: number;
  newLast30Days: number;
  withPassword: number;
  withGoogle: number;
  /** Usuários com atividade nos últimos 7 dias. */
  activeLast7Days: number;
  totals: { tasks: number; habits: number; transactions: number };
  /** Cadastros por dia (AAAA-MM-DD, UTC), dos últimos 14 dias, do mais antigo ao mais recente. */
  signupsByDay: { date: string; count: number }[];
  /** Configuração do servidor: só se está ativa, nunca os valores. */
  system: {
    inviteRequired: boolean;
    googleLogin: boolean;
    aiConfigured: boolean;
    pluggyConfigured: boolean;
    aiDailyLimit: number;
  };
}

export interface AdminUserDetail {
  id: string;
  email: string;
  createdAt: string;
  tasks: { total: number; completed: number };
  habits: { total: number; archived: number; checkins: number };
  finance: { transactions: number; incomeCents: number; expenseCents: number; categories: number };
  taskCategories: number;
  aiUsedToday: number;
}

export interface AdminUsersPayload {
  users: AdminUser[];
  overview: AdminOverview;
}
