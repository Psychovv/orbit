import type { PaymentMethod, TransactionType } from "@/features/finance/domain/finance.schema";
import type { PluggyAccount, PluggyTransaction } from "./types";

export interface ImportedTransaction {
  externalId: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
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

function accountLabel(account: PluggyAccount): string {
  if (account.type === "CREDIT") return "Cartão";
  return account.subtype === "SAVINGS_ACCOUNT" ? "Poupança" : "Conta corrente";
}

/** Contas importadas: corrente/poupança e cartão de crédito. Empréstimos e afins ficam de fora. */
export function isImportableAccount(account: PluggyAccount): boolean {
  if (account.type === "BANK") return true;
  return account.type === "CREDIT" && account.subtype === "CREDIT_CARD";
}

/**
 * Datas sem horário chegam como meia-noite UTC e representam o próprio dia;
 * com horário, são convertidas para o fuso de São Paulo.
 */
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

const BILL_PAYMENT_OPERATIONS = new Set(["PAGAMENTO_FATURA", "PAGAMENTO"]);
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
 * (valor zero, data inválida, agendamento futuro da conta corrente ou pagamento de fatura no cartão,
 * que já aparece como saída na conta corrente).
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
  if (isCard) {
    const operation = tx.operationType?.toUpperCase() ?? "";
    if (rawAmount < 0) {
      if (BILL_PAYMENT_OPERATIONS.has(operation)) return null;
      if (!CARD_INCOME_OPERATIONS.has(operation) && /pagamento/i.test(tx.description ?? "")) return null;
      type = "income";
    } else {
      type = "expense";
    }
  } else {
    type = tx.type === "CREDIT" ? "income" : "expense";
  }

  const notes = [`Importado de ${institution} · ${accountLabel(account)}`];
  const installment = tx.creditCardMetadata;
  if (installment?.installmentNumber && installment.totalInstallments && installment.totalInstallments > 1) {
    notes.push(`Parcela ${installment.installmentNumber}/${installment.totalInstallments}`);
  }

  return {
    externalId: tx.id,
    description: cleanDescription(tx.description),
    amountCents,
    type,
    date,
    paymentMethod: paymentMethodFor(tx, isCard),
    notes: notes.join(" · ").slice(0, 2000),
  };
}
