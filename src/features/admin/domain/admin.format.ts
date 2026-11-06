export function formatDate(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleDateString("pt-BR");
}

/** "hoje", "ontem", "há 5 dias"… ou "nunca" sem data. */
export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return "nunca";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "–";
  const days = Math.floor((now - time) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "mês" : "meses"}`;
  return `há ${Math.floor(days / 365)} ${Math.floor(days / 365) === 1 ? "ano" : "anos"}`;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function loginLabel(user: { hasPassword: boolean; hasGoogle: boolean }): string {
  return [user.hasPassword && "Senha", user.hasGoogle && "Google"].filter(Boolean).join(" + ") || "Sem login";
}
