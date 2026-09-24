import type { z } from "zod";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRaw(key: string): unknown {
  const raw = storage()?.getItem(key);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Lê uma lista e descarta itens que não passam no schema. `undefined` se a chave não existir. */
export function readList<T>(key: string, schema: z.ZodType<T>): T[] | undefined {
  const data = readRaw(key);
  if (!Array.isArray(data)) return undefined;
  return data.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key}`, error);
  }
}

export function removeKeys(...keys: string[]): void {
  const s = storage();
  keys.forEach((key) => s?.removeItem(key));
}

let queue: Promise<unknown> = Promise.resolve();

/** Executa leitura + escrita em série, para que operações concorrentes não se sobrescrevam. */
export function withStoreLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation, operation);
  queue = result.catch(() => undefined);
  return result;
}

interface VersionedListOptions<T> {
  key: string;
  legacyKey: string;
  schema: z.ZodType<T>;
  migrate: (raw: unknown) => T | null;
  seed: () => Promise<T[]>;
}

/**
 * Carrega uma lista versionada. Na primeira leitura, migra os dados da chave antiga
 * ou, se não houver nada salvo, grava os dados de `seed`.
 */
export async function loadVersionedList<T>({
  key,
  legacyKey,
  schema,
  migrate,
  seed,
}: VersionedListOptions<T>): Promise<T[]> {
  const current = readList(key, schema);
  if (current) return current;

  const legacy = readRaw(legacyKey);
  const items = Array.isArray(legacy)
    ? legacy.flatMap((raw) => {
        const item = migrate(raw);
        return item ? [item] : [];
      })
    : await seed();

  writeJson(key, items);
  if (Array.isArray(legacy)) removeKeys(legacyKey);
  return items;
}
