"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Preferência booleana de UI persistida no localStorage (ex.: sidebar recolhida). */
export function useLocalBoolean(key: string, fallback = false): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );

  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {}
      listeners.forEach((listener) => listener());
    },
    [key]
  );

  return [value === null ? fallback : value === "true", set];
}
