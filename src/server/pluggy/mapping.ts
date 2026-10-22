import type { PaymentMethod, TransactionType } from "@/features/finance/domain/finance.schema";
import type { PluggyAccount, PluggyTransaction } from "./types";

export interface ImportedTransaction {
  externalId: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  institution: string;
  /** Vazio quando não há parcela; o nome do banco vai no campo `institution`, não no texto. */
  notes: string;
  /**
   * False em liquidação de fatura (sai da conta / entra no cartão). Continua no extrato e nos
   * totais de movimentação do Meu Pluggy, mas não entra no saldo livre de planejamento.
   */
  countsInBalance: boolean;
  pending: boolean;
}

export interface BillPaymentRef {
  date: string;
  amountCents: number;
}

const MEU_PLUGGY_CONNECTOR = "MeuPluggy";

const INSTITUTION_ALIASES: [RegExp, string][] = [
  [/^nu\b/i, "Nubank"],
  [/ita[uú]/i, "Itaú"],
  [/bradesco/i, "Bradesco"],
  [/banco do brasil/i, "Banco do Brasil"],
  [/\binter\b/i, "Inter"],
  [/santander/i, "Santander"],
  [/caixa/i, "Caixa"],
  [/\bc6\b/i, "C6 Bank"],
  [/\bbtg\b/i, "BTG Pactual"],
  [/\bxp\b/i, "XP"],
  [/mercado pago/i, "Mercado Pago"],
  [/picpay/i, "PicPay"],
  [/sicoob/i, "Sicoob"],
  [/sicredi/i, "Sicredi"],
];

/**
 * No MeuPluggy o conector de todo item se chama "MeuPluggy"; o banco real só aparece
 * no nome das contas (ex.: "Nu Pagamentos S.A. - Instituição de Pagamento").
 */
export function institutionName(connectorName: string | null | undefined, accounts: PluggyAccount[]): string {
  const connector = connectorName?.trim();
  if (connector && connector !== MEU_PLUGGY_CONNECTOR) return connector;

  const accountName = accounts.find((a) => a.type === "BANK" && a.name)?.name?.trim();
  if (!accountName) return connector || "Banco";

  const alias = INSTITUTION_ALIASES.find(([pattern]) => pattern.test(accountName));
  if (alias) return alias[1];
  return accountName.split(" - ")[0].replace(/\s+S\.?A\.?$/i, "").trim().slice(0, 60) || "Banco";
}

/** Contas importadas: corrente/poupança e cartão de crédito. Empréstimos e afins ficam de fora. */
export function isImportableAccount(account: PluggyAccount): boolean {
  if (account.type === "BANK") return true;
  return account.type === "CREDIT" && account.subtype === "CREDIT_CARD";
}

/**
 * Dia de calendário vindo da Pluggy. `YYYY-MM-DD` puro fica como está.
 * ISO à meia-noite UTC representa o próprio dia; com horário, converte para São Paulo.
 */
export function pluggyDay(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return toDateKey(value);
}

export function toDateKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  if (/T00:00:00(\.000)?Z$/.test(iso)) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Só liquidação da fatura. `PAGAMENTO` positivo no cartão é compra (ex.: plano de saúde). */
const CARD_BILL_SETTLEMENT = "PAGAMENTO_FATURA";
const CARD_INCOME_OPERATIONS = new Set(["ESTORNO", "CASHBACK"]);

function paymentMethodFor(tx: PluggyTransaction, isCard: boolean): PaymentMethod {
  if (isCard) return "cartao";
  const method = (tx.paymentData?.paymentMethod ?? tx.operationType ?? "").toUpperCase();
  switch (method) {
    case "PIX":
      return "pix";
    case "BOLETO":
    case "CONVENIO_ARRECADACAO":
      return "boleto";
    case "CARTAO":
      return "cartao";
    case "SAQUE":
    case "DEPOSITO":
      return "dinheiro";
    case "TED":
    case "DOC":
    case "TRANSFERENCIA_MESMA_INSTITUICAO":
      return "transferencia";
  }
  return /\bpix\b/i.test(tx.description ?? "") ? "pix" : "transferencia";
}

function cleanDescription(raw: string | null | undefined): string {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  return (text || "Transação bancária").slice(0, 200);
}

/**
 * Converte uma transação da Pluggy em lançamento do Orbit, ou `null` quando não deve ser importada
 * (valor zero, data inválida ou agendamento futuro da conta corrente).
 * Liquidação de fatura entra nos dois lados (conta e cartão), como no Meu Pluggy.
 */
export function mapPluggyTransaction(
  tx: PluggyTransaction,
  account: PluggyAccount,
  institution: string
): ImportedTransaction | null {
  const isCard = account.type === "CREDIT";
  const rawAmount = tx.amountInAccountCurrency ?? tx.amount;
  const amountCents = Math.round(Math.abs(rawAmount) * 100);
  if (!Number.isFinite(amountCents) || amountCents === 0) return null;

  const date = toDateKey(tx.date);
  if (!date) return null;

  if (!isCard && tx.status === "PENDING") return null;

  let type: TransactionType;
  let countsInBalance = true;
  const operation = tx.operationType?.toUpperCase() ?? "";
  const description = tx.description ?? "";

  if (isCard) {
    if (rawAmount < 0) {
      if (operation === CARD_BILL_SETTLEMENT || /pagamento recebido/i.test(description)) {
        type = "income";
        countsInBalance = false;
      } else if (CARD_INCOME_OPERATIONS.has(operation)) {
        type = "income";
      } else if (/pagamento/i.test(description)) {
        type = "income";
        countsInBalance = false;
      } else {
        type = "income";
      }
    } else {
      type = "expense";
    }
  } else {
    type = tx.type === "CREDIT" ? "income" : "expense";
    if (type === "expense" && /pagamento de fatura/i.test(description)) {
      countsInBalance = false;
    }
  }

  const installment = tx.creditCardMetadata;
  const notes =
    installment?.installmentNumber && installment.totalInstallments && installment.totalInstallments > 1
      ? `Parcela ${installment.installmentNumber}/${installment.totalInstallments}`
      : "";

  return {
    externalId: tx.id,
    description: cleanDescription(tx.description),
    amountCents,
    type,
    date,
    paymentMethod: paymentMethodFor(tx, isCard),
    institution,
    notes,
    countsInBalance,
    pending: isCard && type === "expense" && tx.status === "PENDING",
  };
}

const SETTLEMENT_METHODS = new Set(["transferencia", "boleto", "dinheiro"]);

/**
 * Casa cada pagamento registrado na fatura com um lançamento da conta (mesma data e valor).
 * PIX fica de fora: o pagamento da fatura do Nubank sai como transferência interna.
 * Cada pagamento consome no máximo um lançamento.
 */
export function billPaymentIds(
  candidates: { id: string; date: string; amountCents: number; type: string; paymentMethod: string }[],
  payments: BillPaymentRef[]
): string[] {
  const pool = candidates.filter((c) => c.type === "expense" && SETTLEMENT_METHODS.has(c.paymentMethod));
  const used = new Set<string>();
  const ids: string[] = [];

  for (const payment of payments) {
    if (payment.amountCents <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(payment.date)) continue;
    const match = pool.find(
      (c) => !used.has(c.id) && c.date === payment.date && c.amountCents === payment.amountCents
    );
    if (!match) continue;
    used.add(match.id);
    ids.push(match.id);
  }
  return ids;
}
