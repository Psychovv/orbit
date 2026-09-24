import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `[[2, "criada", "criadas"], [1, "excluída", "excluídas"]]` → `"2 criadas · 1 excluída"`. Contagens zeradas somem. */
export function pluralSummary(parts: [count: number, singular: string, plural: string][]): string {
  return parts
    .filter(([count]) => count > 0)
    .map(([count, singular, plural]) => `${count} ${count === 1 ? singular : plural}`)
    .join(" · ");
}
