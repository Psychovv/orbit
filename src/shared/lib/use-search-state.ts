"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type SearchPatch = Record<string, string | null | undefined>;

export function buildHref(pathname: string, current: URLSearchParams | string, patch: SearchPatch): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Lê e atualiza query params da rota atual sem criar entradas no histórico. */
export function useSearchState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const update = useCallback(
    (patch: SearchPatch) => {
      router.replace(buildHref(pathname, searchParams.toString(), patch), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return { searchParams, update };
}
