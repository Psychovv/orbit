const hits = new Map<string, number[]>();

/**
 * Limite simples em memória (janela deslizante). Vale por instância do servidor:
 * em produção com várias instâncias, trocar por um store compartilhado (ex.: Redis).
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.size > 5000) hits.clear();

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Ms até a janela liberar uma vaga, ou null se ainda há cota. */
export function rateLimitRetryAfterMs(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, recent);
  if (recent.length < limit) return null;
  const oldest = recent[0] ?? now;
  return Math.max(1000, oldest + windowMs - now);
}

export function resetRateLimit(key: string): void {
  hits.delete(key);
}

export function clientKeyFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerStore.get("x-real-ip") || "local";
}

export function clientKey(req: Request): string {
  return clientKeyFromHeaders(req.headers);
}
