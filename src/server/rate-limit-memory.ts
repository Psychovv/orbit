interface Entry {
  hits: number[];
  windowMs: number;
}

const hits = new Map<string, Entry>();

/** Teto de chaves em memória (~poucos MB). Alto o bastante para um flood não expulsar contadores ativos. */
const MAX_KEYS = 50_000;

/**
 * Limite em memória (janela deslizante). Vale por instância: é só o plano B de `rate-limit.ts`
 * quando o banco compartilhado está indisponível.
 */

/**
 * Abre espaço sem zerar contadores ativos: primeiro descarta janelas vencidas; só se ainda faltar
 * espaço descarta as chaves mais antigas.
 */
function evict(now: number): void {
  for (const [key, entry] of hits) {
    const last = entry.hits[entry.hits.length - 1] ?? 0;
    if (now - last >= entry.windowMs) hits.delete(key);
  }
  if (hits.size <= MAX_KEYS) return;
  let excess = hits.size - Math.floor(MAX_KEYS * 0.9);
  for (const key of hits.keys()) {
    if (excess-- <= 0) break;
    hits.delete(key);
  }
}

function recentHits(key: string, windowMs: number, now: number): number[] {
  return (hits.get(key)?.hits ?? []).filter((t) => now - t < windowMs);
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = recentHits(key, windowMs, now);

  if (!hits.has(key) && hits.size >= MAX_KEYS) evict(now);

  if (recent.length >= limit) {
    hits.set(key, { hits: recent, windowMs });
    return false;
  }
  recent.push(now);
  hits.set(key, { hits: recent, windowMs });
  return true;
}

/** Ms até a janela liberar uma vaga, ou null se ainda há cota. */
export function rateLimitRetryAfterMs(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  const recent = recentHits(key, windowMs, now);
  if (recent.length) hits.set(key, { hits: recent, windowMs });
  else hits.delete(key);
  if (recent.length < limit) return null;
  const oldest = recent[0] ?? now;
  return Math.max(1000, oldest + windowMs - now);
}

export function resetRateLimit(key: string): void {
  hits.delete(key);
}
