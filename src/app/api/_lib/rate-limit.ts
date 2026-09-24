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

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "local";
}
