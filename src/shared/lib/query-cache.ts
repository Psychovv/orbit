import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { DateRange } from "./date-utils";

/** Chave de lista por intervalo: `[entity, "list", from, to]` ou `[entity, "list", "all"]`. */
export function rangedListKey(entity: string, range?: DateRange): QueryKey {
  return range ? [entity, "list", range.from, range.to] : [entity, "list", "all"];
}

function rangeFromKey(key: QueryKey): DateRange | undefined {
  const [, , from, to] = key;
  return typeof from === "string" && typeof to === "string" ? { from, to } : undefined;
}

/**
 * Aplica `update` em todas as listas em cache da entidade (atualização otimista).
 * Retorna uma função que desfaz a alteração.
 */
export async function patchRangedLists<T>(
  queryClient: QueryClient,
  entity: string,
  update: (items: T[], range: DateRange | undefined) => T[]
): Promise<() => void> {
  await queryClient.cancelQueries({ queryKey: [entity, "list"] });
  const snapshot = queryClient.getQueriesData<T[]>({ queryKey: [entity, "list"] });

  for (const [key, items] of snapshot) {
    if (items) queryClient.setQueryData(key, update(items, rangeFromKey(key)));
  }

  return () => snapshot.forEach(([key, items]) => queryClient.setQueryData(key, items));
}
