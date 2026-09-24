const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** Converte o texto digitado ("12,50", "1.234,56", "12.5") em centavos. `null` se inválido ou não positivo. */
export function parseAmountInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return toCents(value);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
