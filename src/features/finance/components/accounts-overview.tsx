"use client";

import React from "react";
import { CreditCard, Landmark } from "lucide-react";
import type { BankAccount } from "../domain/bank.schema";
import { formatBRL } from "../domain/money";
import { cn } from "@/shared/lib/utils";
import { NubankIcon } from "./nubank-icon";

function last4(number: string | null): string | null {
  if (!number) return null;
  return number.length <= 4 ? number : number.slice(-4);
}

function utilization(account: BankAccount): number | null {
  if (!account.creditLimitCents || account.creditLimitCents <= 0) return null;
  return Math.min(100, Math.max(0, (account.balanceCents / account.creditLimitCents) * 100));
}

export function AccountsOverview({ accounts }: { accounts: BankAccount[] }) {
  if (accounts.length === 0) return null;

  const bankTotal = accounts.filter((a) => a.type === "BANK").reduce((s, a) => s + a.balanceCents, 0);
  const cardTotal = accounts.filter((a) => a.type === "CREDIT").reduce((s, a) => s + a.balanceCents, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-800/80 dark:bg-[#100e1e]/70">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Contas bancárias
            </h3>
          </div>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(bankTotal)}</span>
        </div>
        <ul className="space-y-2">
          {accounts
            .filter((a) => a.type === "BANK")
            .map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  {/nu\b/i.test(account.name) ? (
                    <NubankIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <Landmark className="h-4 w-4 shrink-0 text-zinc-400" />
                  )}
                  <span className="truncate">{/nu\b/i.test(account.name) ? "Nubank" : "Conta"}</span>
                </span>
                <span className="shrink-0 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(account.balanceCents)}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-800/80 dark:bg-[#100e1e]/70">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cartões de crédito
            </h3>
          </div>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(cardTotal)}</span>
        </div>
        <ul className="space-y-3">
          {accounts
            .filter((a) => a.type === "CREDIT")
            .map((account) => {
              const pct = utilization(account);
              return (
                <li key={account.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <NubankIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{account.name}</span>
                      {last4(account.number) ? (
                        <span className="text-[11px] text-zinc-400">xxxx {last4(account.number)}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatBRL(account.balanceCents)}
                    </span>
                  </div>
                  {pct != null && account.creditLimitCents ? (
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>{pct.toFixed(0)}% utilizado</span>
                        <span>Limite: {formatBRL(account.creditLimitCents)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 80 ? "bg-rose-500" : "bg-brand"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
