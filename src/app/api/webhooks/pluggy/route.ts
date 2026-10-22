import { after, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/server/rate-limit";
import { isPluggyConfigured } from "@/server/pluggy/client";
import {
  applyUpdatedTransactions,
  refreshConnectionStatus,
  registerConnection,
  removeDeletedTransactions,
  syncConnection,
} from "@/server/pluggy/sync";
import { bankConnectionsRepository } from "@/server/db/repositories/bank.server";
import {
  isAllowedWebhookIp,
  isValidWebhookSecret,
  MAX_WEBHOOK_BODY_BYTES,
  PluggyWebhookEventSchema,
  WEBHOOK_SECRET_HEADER,
  type PluggyWebhookEvent,
} from "@/server/pluggy/webhook-auth";

export const maxDuration = 60;

async function handleEvent(event: PluggyWebhookEvent): Promise<void> {
  const { itemId } = event;
  if (!itemId) return;

  switch (event.event) {
    case "item/created":
      await registerConnection(itemId);
      await syncConnection(itemId);
      return;
    case "item/updated":
    case "transactions/created":
      if (await bankConnectionsRepository.get(itemId)) await syncConnection(itemId);
      return;
    case "transactions/updated":
      if (event.accountId && event.transactionIds?.length) {
        await applyUpdatedTransactions(itemId, event.accountId, event.transactionIds);
      }
      return;
    case "transactions/deleted":
      if (event.transactionIds?.length) await removeDeletedTransactions(itemId, event.transactionIds);
      return;
    case "item/deleted":
      await bankConnectionsRepository.remove(itemId);
      return;
    case "item/error":
    case "item/waiting_user_input":
    case "item/waiting_user_action":
      await refreshConnectionStatus(itemId);
      return;
  }
}

export async function POST(request: Request) {
  const ip = clientKey(request);
  if (!rateLimit(`pluggy-webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isAllowedWebhookIp(ip, process.env.PLUGGY_WEBHOOK_ALLOWED_IPS)) {
    console.warn("[pluggy webhook] blocked ip", { ip });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (!isPluggyConfigured() || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (!isValidWebhookSecret(request.headers.get(WEBHOOK_SECRET_HEADER), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PluggyWebhookEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = parsed.data;
  after(async () => {
    try {
      await handleEvent(event);
    } catch (error) {
      console.error("[pluggy webhook] handler failed", {
        event: event.event,
        eventId: event.eventId,
        error: error instanceof Error ? error.name : "unknown",
      });
    }
  });

  return NextResponse.json({ ok: true });
}
