import "server-only";
import type { BankConnection, BankSyncResult } from "@/features/finance/domain/bank.schema";
import {
  bankConnectionsRepository,
  importedTransactionsRepository,
} from "@/server/db/repositories/bank.server";
import { nowIso } from "@/shared/lib/id";
import { getAccount, getAccounts, getItem, listTransactions, PluggyError } from "./client";
import { institutionName, isImportableAccount, mapPluggyTransaction, type ImportedTransaction } from "./mapping";
import type { PluggyItem } from "./types";

/** Histórico trazido na primeira sincronização de um banco. */
const INITIAL_HISTORY_DAYS = 90;
/** Margem nas sincronizações seguintes para pegar lançamentos que o banco publica com atraso. */
const OVERLAP_DAYS = 7;
const MAX_IDS_PER_REQUEST = 500;

const running = new Map<string, Promise<BankSyncResult>>();

function daysAgo(fromIso: string, days: number): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function connectionFromItem(item: PluggyItem, institution: string) {
  return {
    itemId: item.id,
    institution,
    status: item.status,
    errorCode: item.error?.code ?? null,
    consentExpiresAt: item.consentExpiresAt ?? null,
  };
}

function describeError(error: unknown): string {
  if (error instanceof PluggyError) {
    if (error.status === 404) return "Conexão não encontrada na Pluggy.";
    if (error.status === 401 || error.status === 403) return "Credenciais da Pluggy recusadas.";
    return error.message;
  }
  return "Falha inesperada na sincronização.";
}

/** Confere o item na Pluggy (garante que pertence à nossa aplicação) e salva a conexão. */
export async function registerConnection(itemId: string): Promise<BankConnection> {
  const [item, accounts] = await Promise.all([getItem(itemId), getAccounts(itemId)]);
  return bankConnectionsRepository.upsert(connectionFromItem(item, institutionName(item.connector?.name, accounts)));
}

/** Atualiza o status salvo a partir da Pluggy. Retorna `null` se o item não estiver conectado aqui. */
export async function refreshConnectionStatus(itemId: string): Promise<BankConnection | null> {
  const existing = await bankConnectionsRepository.get(itemId);
  if (!existing) return null;
  return bankConnectionsRepository.upsert(connectionFromItem(await getItem(itemId), existing.institution));
}

async function runSync(connection: BankConnection): Promise<BankSyncResult> {
  const startedAt = nowIso();
  const [item, allAccounts] = await Promise.all([getItem(connection.itemId), getAccounts(connection.itemId)]);
  const saved = await bankConnectionsRepository.upsert(
    connectionFromItem(item, institutionName(item.connector?.name, allAccounts))
  );

  const dateFrom = saved.lastSyncedAt
    ? daysAgo(saved.lastSyncedAt, OVERLAP_DAYS)
    : daysAgo(startedAt, INITIAL_HISTORY_DAYS);

  const accounts = allAccounts.filter(isImportableAccount);
  let imported = 0;
  for (const account of accounts) {
    const txs = await listTransactions(account.id, { dateFrom });
    const rows = txs.flatMap((tx) => mapPluggyTransaction(tx, account, saved.institution) ?? []);
    imported += await importedTransactionsRepository.insertNew(rows);
  }

  await bankConnectionsRepository.markSynced(connection.itemId, startedAt);
  return { itemId: connection.itemId, imported };
}

/** Sincroniza um banco já conectado. Chamadas simultâneas para o mesmo item reaproveitam a mesma execução. */
export function syncConnection(itemId: string): Promise<BankSyncResult> {
  const current = running.get(itemId);
  if (current) return current;

  const task = (async (): Promise<BankSyncResult> => {
    const connection = await bankConnectionsRepository.get(itemId);
    if (!connection) return { itemId, imported: 0, error: "Conexão não cadastrada." };
    try {
      return await runSync(connection);
    } catch (error) {
      console.error("[pluggy] sync failed", { itemId, error: describeError(error) });
      return { itemId, imported: 0, error: describeError(error) };
    }
  })().finally(() => running.delete(itemId));

  running.set(itemId, task);
  return task;
}

export async function syncAllConnections(): Promise<BankSyncResult[]> {
  const connections = await bankConnectionsRepository.list();
  const results: BankSyncResult[] = [];
  for (const c of connections) results.push(await syncConnection(c.itemId));
  return results;
}

/** Reaplica transações alteradas no banco (evento `transactions/updated`). */
export async function applyUpdatedTransactions(itemId: string, accountId: string, ids: string[]): Promise<void> {
  const connection = await bankConnectionsRepository.get(itemId);
  if (!connection || ids.length === 0) return;

  const account = await getAccount(accountId);
  if (account.itemId && account.itemId !== itemId) return;
  if (!isImportableAccount(account)) return;

  for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
    const txs = await listTransactions(accountId, { ids: ids.slice(i, i + MAX_IDS_PER_REQUEST) });
    const rows: ImportedTransaction[] = txs.flatMap(
      (tx) => mapPluggyTransaction(tx, account, connection.institution) ?? []
    );
    await importedTransactionsRepository.insertNew(rows);
    await importedTransactionsRepository.applyBankChanges(rows);
  }
}

/** Remove transações que o banco apagou (evento `transactions/deleted`). */
export async function removeDeletedTransactions(itemId: string, ids: string[]): Promise<void> {
  if (!(await bankConnectionsRepository.get(itemId))) return;
  await importedTransactionsRepository.removeByExternalIds(ids);
}
