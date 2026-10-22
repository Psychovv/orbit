import "server-only";
import type { BankConnection, BankSyncResult } from "@/features/finance/domain/bank.schema";
import type { CardBill } from "@/features/finance/domain/bank.schema";
import {
  bankConnectionsRepository,
  cardBillsRepository,
  importedTransactionsRepository,
  markBillPayments,
} from "@/server/db/repositories/bank.server";
import { nowIso } from "@/shared/lib/id";
import { getAccount, getAccounts, getBills, getItem, listTransactions, PluggyError } from "./client";
import {
  institutionName,
  isImportableAccount,
  mapPluggyTransaction,
  pluggyDay,
  type BillPaymentRef,
  type ImportedTransaction,
} from "./mapping";
import type { PluggyAccount, PluggyItem } from "./types";

/** Janela relida a cada sincronização (insert é idempotente). */
const HISTORY_DAYS = 90;
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

async function collectBills(accounts: PluggyAccount[]): Promise<{ bills: CardBill[]; payments: BillPaymentRef[] }> {
  const bills: CardBill[] = [];
  const payments: BillPaymentRef[] = [];

  for (const account of accounts.filter((a) => a.type === "CREDIT")) {
    let fetched;
    try {
      fetched = await getBills(account.id);
    } catch (error) {
      console.error("[pluggy] bills failed", { error: describeError(error) });
      continue;
    }
    for (const bill of fetched) {
      const dueDate = pluggyDay(bill.dueDate);
      if (!dueDate || !Number.isFinite(bill.totalAmount)) continue;
      bills.push({
        id: bill.id,
        dueDate,
        closingDate: pluggyDay(bill.billClosingDate),
        totalAmountCents: Math.round(bill.totalAmount * 100),
      });
      for (const payment of bill.payments ?? []) {
        const date = pluggyDay(payment.paymentDate);
        const amountCents = Math.round(payment.amount * 100);
        if (date && amountCents > 0) payments.push({ date, amountCents });
      }
    }
  }
  return { bills, payments };
}

async function runSync(connection: BankConnection): Promise<BankSyncResult> {
  const startedAt = nowIso();
  const [item, allAccounts] = await Promise.all([getItem(connection.itemId), getAccounts(connection.itemId)]);
  const saved = await bankConnectionsRepository.upsert(
    connectionFromItem(item, institutionName(item.connector?.name, allAccounts))
  );

  const dateFrom = daysAgo(startedAt, HISTORY_DAYS);

  const accounts = allAccounts.filter(isImportableAccount);
  const rows: ImportedTransaction[] = [];
  for (const account of accounts) {
    const txs = await listTransactions(account.id, { dateFrom });
    rows.push(...txs.flatMap((tx) => mapPluggyTransaction(tx, account, saved.institution) ?? []));
  }

  await importedTransactionsRepository.refreshImported(rows);
  const imported = await importedTransactionsRepository.insertNew(rows);
  const { bills, payments } = await collectBills(accounts);
  await cardBillsRepository.upsert(bills);
  await markBillPayments(payments);

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
