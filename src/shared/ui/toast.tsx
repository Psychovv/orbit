"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type ToastTone = "default" | "success" | "error";

export interface ToastOptions {
  message: string;
  description?: string;
  tone?: ToastTone;
  /** Botão de ação, como "Desfazer". Clicar fecha o toast. */
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

interface ToastEntry extends ToastOptions {
  id: number;
}

const MAX_VISIBLE = 4;
const DEFAULT_DURATION_MS = 5000;

let toasts: ToastEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function toast(options: ToastOptions): number {
  const id = nextId++;
  toasts = [...toasts, { ...options, id }].slice(-MAX_VISIBLE);
  emit();
  return id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: ToastEntry[] = [];

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-20 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  default: <Info className="h-4 w-4 text-brand dark:text-brand-soft" />,
  success: <Check className="h-4 w-4 text-emerald-500" />,
  error: <AlertTriangle className="h-4 w-4 text-rose-500" />,
};

function ToastCard({ item }: { item: ToastEntry }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(item.id), item.durationMs ?? DEFAULT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, item.durationMs]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
      role={item.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl dark:bg-[#121020]/95",
        item.tone === "error"
          ? "border-rose-300/60 dark:border-rose-900/60"
          : "border-zinc-200/80 dark:border-zinc-800/80"
      )}
    >
      <span className="mt-0.5 shrink-0">{TONE_ICON[item.tone ?? "default"]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.message}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
        )}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            dismissToast(item.id);
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10 dark:text-brand-soft cursor-pointer"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-md p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
