"use client";

import Link from "next/link";
import { AlertTriangle, CheckSquare, Flame, Wallet } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useHomeAlerts } from "../hooks/use-home-alerts";
import type { HomeAlertTone } from "../domain/home-alerts";

const TONE_STYLES: Record<HomeAlertTone, string> = {
  danger:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
  info: "border-brand/25 bg-brand/5 text-zinc-700 dark:border-brand/20 dark:bg-brand/10 dark:text-zinc-200",
};

function AlertIcon({ href }: { href: string }) {
  const className = "h-4 w-4 shrink-0 opacity-80";
  if (href === "/habits") return <Flame className={className} />;
  if (href === "/finance") return <Wallet className={className} />;
  if (href === "/tasks") return <CheckSquare className={className} />;
  return <AlertTriangle className={className} />;
}

export function HomeAlerts() {
  const alerts = useHomeAlerts();
  if (alerts.length === 0) return null;

  return (
    <ul className="relative mb-8 space-y-2" aria-label="Alertas do dia">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <Link
            href={alert.href}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90",
              TONE_STYLES[alert.tone]
            )}
          >
            <AlertIcon href={alert.href} />
            <span className="leading-snug">{alert.message}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
