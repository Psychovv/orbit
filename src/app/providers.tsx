"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000 },
    },
  });
}

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
