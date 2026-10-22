import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";

export const WEBHOOK_SECRET_HEADER = "x-orbit-webhook-secret";
export const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const MIN_SECRET_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Compara em tempo constante e sem revelar o tamanho do segredo. Segredos curtos demais são recusados. */
export function isValidWebhookSecret(received: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < MIN_SECRET_LENGTH || !received) return false;
  return timingSafeEqual(digest(received), digest(expected));
}

/** `allowedIps` vazio desliga o filtro; a lista vem de `PLUGGY_WEBHOOK_ALLOWED_IPS` (separada por vírgula). */
export function isAllowedWebhookIp(ip: string, allowedIps: string | undefined): boolean {
  const list = (allowedIps ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 || list.includes(ip);
}

export const PluggyWebhookEventSchema = z.object({
  event: z.string().min(1).max(100),
  eventId: z.string().max(100).optional(),
  itemId: z.uuid().optional(),
  accountId: z.uuid().optional(),
  transactionIds: z.array(z.uuid()).max(20_000).optional(),
});
export type PluggyWebhookEvent = z.infer<typeof PluggyWebhookEventSchema>;
