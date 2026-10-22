"use client";

import React, { useState } from "react";
import { Landmark, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PluggyIdSchema, type BankConnection, type BankSyncResult } from "../domain/bank.schema";
import {
  useAddBankConnection,
  useBankConnections,
  useRemoveBankConnection,
  useSyncBankConnections,
} from "../hooks/use-bank-connections";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { toast } from "@/shared/ui/toast";
import { cn } from "@/shared/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  UPDATED: "Atualizado",
  UPDATING: "Atualizando",
  OUTDATED: "Desatualizado",
  LOGIN_ERROR: "Precisa reautorizar",
  WAITING_USER_INPUT: "Aguardando ação",
  WAITING_USER_ACTION: "Aguardando ação",
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function formatDate(iso: string | null, format = dateTimeFormat): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : format.format(date);
}

function needsAttention(c: BankConnection): boolean {
  if (c.status === "LOGIN_ERROR" || c.status === "OUTDATED") return true;
  const expires = c.consentExpiresAt ? new Date(c.consentExpiresAt).getTime() : NaN;
  return Number.isFinite(expires) && expires < Date.now();
}

function summarizeSync(results: BankSyncResult[]): { message: string; description: string } {
  const imported = results.reduce((sum, r) => sum + r.imported, 0);
  const failed = results.filter((r) => r.error);
  return {
    message: failed.length ? "Sincronização com falhas" : "Sincronização concluída",
    description: failed.length
      ? `${imported} lançamento(s) novo(s). ${failed[0].error}`
      : `${imported} lançamento(s) novo(s).`,
  };
}

export function BankConnectionsPanel() {
  const { data: connections, isLoading, error } = useBankConnections();
  const addConnection = useAddBankConnection();
  const removeConnection = useRemoveBankConnection();
  const syncAll = useSyncBankConnections();
  const [itemId, setItemId] = useState("");
  const [inputError, setInputError] = useState<string>();

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = PluggyIdSchema.safeParse(itemId.trim());
    if (!parsed.success) {
      setInputError("Cole o Item ID (formato UUID) do painel da Pluggy.");
      return;
    }
    setInputError(undefined);
    addConnection.mutate(parsed.data, {
      onSuccess: ({ connection, sync }) => {
        setItemId("");
        toast({
          message: `${connection.institution} conectado`,
          description: sync.error ?? `${sync.imported} lançamento(s) importado(s).`,
          tone: sync.error ? "error" : "success",
        });
      },
      onError: (e) => toast({ message: "Falha ao conectar", description: e.message, tone: "error" }),
    });
  };

  const handleSync = () =>
    syncAll.mutate(undefined, {
      onSuccess: (results) => toast({ ...summarizeSync(results), tone: results.some((r) => r.error) ? "error" : "success" }),
      onError: (e) => toast({ message: "Falha ao sincronizar", description: e.message, tone: "error" }),
    });

  const handleRemove = (c: BankConnection) => {
    if (!window.confirm(`Desconectar ${c.institution}? Os lançamentos já importados continuam no extrato.`)) return;
    removeConnection.mutate(c.itemId, {
      onError: (e) => toast({ message: "Falha ao desconectar", description: e.message, tone: "error" }),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Importa extratos via Open Finance (MeuPluggy). Conecte os bancos em meu.pluggy.ai, autorize o MeuPluggy
        no painel da Pluggy e cole aqui o Item ID de cada banco. Com o webhook configurado, novos itens entram sozinhos.
      </p>

      {error ? (
        <p className="text-sm text-rose-500">{error.message}</p>
      ) : isLoading ? (
        <p className="text-sm text-zinc-400">Carregando conexões…</p>
      ) : connections && connections.length > 0 ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          {connections.map((c) => {
            const lastSync = formatDate(c.lastSyncedAt);
            const expires = formatDate(c.consentExpiresAt, dateFormat);
            return (
              <li key={c.itemId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    <Landmark className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="truncate">{c.institution}</span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                        needsAttention(c)
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {lastSync ? `Última sincronização: ${lastSync}` : "Ainda não sincronizado"}
                    {expires ? ` · Autorização até ${expires}` : ""}
                    {c.errorCode === "USER_AUTHORIZATION_EXPIRED" ? " · Renove a autorização no painel da Pluggy" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(c)}
                  disabled={removeConnection.isPending}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
                  title="Desconectar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400">Nenhum banco conectado ainda.</p>
      )}

      <form onSubmit={handleAdd} className="flex items-start gap-2">
        <Input
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          placeholder="Item ID da Pluggy"
          aria-label="Item ID da Pluggy"
          autoComplete="off"
          spellCheck={false}
          error={inputError}
          className="h-10 font-mono text-xs"
        />
        <Button type="submit" variant="outline" disabled={addConnection.isPending} className="shrink-0">
          <Plus className="h-3.5 w-3.5" />
          {addConnection.isPending ? "Conectando…" : "Conectar"}
        </Button>
      </form>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSync}
          disabled={syncAll.isPending || !connections?.length}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncAll.isPending && "animate-spin")} />
          {syncAll.isPending ? "Sincronizando…" : "Sincronizar agora"}
        </Button>
      </div>
    </div>
  );
}
