/** Limites do assistente de IA, compartilhados pela rota e pela página de administração. */
export const ASSISTANT_RATE_LIMIT = { limit: 20, windowMs: 60_000 };
export const ASSISTANT_DAILY_LIMIT = { limit: 300, windowMs: 24 * 60 * 60_000 };
export const ASSISTANT_DAILY_PREFIX = "assistant-daily:";
export const assistantDailyKey = (userId: string) => `${ASSISTANT_DAILY_PREFIX}${userId}`;
