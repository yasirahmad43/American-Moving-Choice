/**
 * Message outbox (build plan §5, §9). enqueueEmail and enqueueSms write a `messages` row, ideally in
 * the same transaction as the change that causes it ("commit, then notify"). With no provider key
 * for the channel the row is stored right away with status "demo" and appears in the admin
 * mailbox; otherwise it is "queued" and deliverPending sends it.
 *
 * Messages that carry a secret (password reset and invitation links) pass it as secretBodyText:
 * body_text keeps only a redacted copy for the mailbox, and the deliverable body is stored
 * encrypted with APP_ENCRYPTION_KEY and cleared once a live provider has it, so neither a
 * database dump nor a mailbox reader gets a usable link (see mailbox.ts for who may reveal it).
 */
import { randomUUID } from "node:crypto";
import { decrypt, encrypt } from "../auth/crypto";
import { getPool, tx, type Queryable } from "../db/pool";
import { encryptionKey } from "../env/env";
import { transportsFromEnv, type DeliveryResult, type Transports } from "./transports";

export const MAX_DELIVERY_ATTEMPTS = 5;
/** A message claimed by a run that died is retried after this long. */
export const CLAIM_TIMEOUT_SECONDS = 10 * 60;

export interface EmailInput {
  to: string;
  /** Template key, e.g. "password_reset", "invitation", "lead_available". */
  template: string;
  subject: string;
  /** What the mailbox shows. When secretBodyText is set, this must be the redacted version. */
  bodyText: string;
  /** The deliverable body when it contains a secret such as a reset link; stored encrypted. */
  secretBodyText?: string;
  relatedType?: string | null;
  relatedId?: string | null;
}

export interface SmsInput {
  /** E.164 phone number, e.g. +15125550123. */
  to: string;
  template: string;
  bodyText: string;
  secretBodyText?: string;
  relatedType?: string | null;
  relatedId?: string | null;
}

export interface EnqueueOptions {
  /** Transports that decide demo versus queued (tests); defaults to the environment's. */
  transports?: Transports;
}

/** Placeholder for a redacted secret link in body_text. */
export const REDACTED_LINK = "[link hidden: delivered to the recipient only]";

const secretAad = (messageId: string) => `messages.body_secret_enc:${messageId}`;

/** The deliverable body of a message with a secret (delivery and the demo mailbox only). */
export function decryptSecretBody(messageId: string, sealed: string): string {
  return decrypt(sealed, encryptionKey(), secretAad(messageId));
}
export class OutboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutboxError";
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;
const TEMPLATE = /^[a-z][a-z0-9_]*$/;

async function insertMessage(
  db: Queryable,
  row: { channel: "email" | "sms"; to: string; template: string; subject: string | null; bodyText: string; secretBodyText?: string; relatedType?: string | null; relatedId?: string | null },
  options: EnqueueOptions,
): Promise<string> {
  if (!TEMPLATE.test(row.template)) throw new OutboxError("template must be a lowercase key such as password_reset");
  if (!row.bodyText.trim()) throw new OutboxError("message body is empty");
  if (row.secretBodyText !== undefined && !row.secretBodyText.trim()) throw new OutboxError("secret message body is empty");
  const id = randomUUID();
  const secret = row.secretBodyText === undefined ? null : encrypt(row.secretBodyText, encryptionKey(), secretAad(id));
  const transports = options.transports ?? transportsFromEnv();
  const demo = (row.channel === "email" ? transports.email : transports.sms).name === "demo";
  await db.query(
    `insert into messages (id, channel, to_address, template, subject, body_text, body_secret_enc, related_type, related_id, status, provider)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, row.channel, row.to, row.template, row.subject, row.bodyText, secret, row.relatedType ?? null, row.relatedId ?? null, demo ? "demo" : "queued", demo ? "demo" : null],
  );
  return id;
}

/** Queues an email (or stores it as a demo message without a provider). Returns the message ID. */
export async function enqueueEmail(input: EmailInput, db: Queryable = getPool(), options: EnqueueOptions = {}): Promise<string> {
  const to = input.to.trim().toLowerCase();
  if (!EMAIL.test(to)) throw new OutboxError("recipient is not an email address");
  return insertMessage(
    db,
    { channel: "email", to, template: input.template, subject: input.subject, bodyText: input.bodyText, secretBodyText: input.secretBodyText, relatedType: input.relatedType, relatedId: input.relatedId },
    options,
  );
}

/** Queues a text message (or stores it as a demo message without a provider). Returns the message ID. */
export async function enqueueSms(input: SmsInput, db: Queryable = getPool(), options: EnqueueOptions = {}): Promise<string> {
  if (!E164.test(input.to)) throw new OutboxError("recipient is not an E.164 phone number");
  return insertMessage(
    db,
    { channel: "sms", to: input.to, template: input.template, subject: null, bodyText: input.bodyText, secretBodyText: input.secretBodyText, relatedType: input.relatedType, relatedId: input.relatedId },
    options,
  );
}

export interface DeliveryReport {
  processed: number;
  sent: number;
  demo: number;
  failed: number;
  /** Failed with a retryable error and left queued for the next run. */
  retrying: number;
}

interface ClaimedMessage {
  id: string;
  channel: "email" | "sms";
  to_address: string;
  subject: string | null;
  body_text: string;
  body_secret_enc: string | null;
  template: string;
  attempts: number;
}

/**
 * Delivers queued messages, oldest first. Each message is claimed in a short transaction (status
 * "sending", row locked with SKIP LOCKED so concurrent runs never take the same one), sent with no
 * transaction or row lock held (a provider call can take seconds and the pool is small), and its
 * result recorded in a second short transaction. A message that fails with a retryable error goes
 * back to "queued" until MAX_DELIVERY_ATTEMPTS; each run tries a message at most once. A claim
 * left behind by a crashed run is picked up again after CLAIM_TIMEOUT_SECONDS.
 */
export async function deliverPending(options: { limit?: number; transports?: Transports } = {}): Promise<DeliveryReport> {
  const limit = options.limit ?? 50;
  const transports = options.transports ?? transportsFromEnv();
  const report: DeliveryReport = { processed: 0, sent: 0, demo: 0, failed: 0, retrying: 0 };
  const tried: string[] = [];

  while (report.processed < limit) {
    const message = await tx(async (client) => {
      const next = await client.query<ClaimedMessage>(
        `select id, channel, to_address, subject, body_text, body_secret_enc, template, attempts from messages
         where (status = 'queued' or (status = 'sending' and claimed_at < now() - make_interval(secs => $2)))
           and not (id = any($1::uuid[]))
         order by created_at, id limit 1 for update skip locked`,
        [tried, CLAIM_TIMEOUT_SECONDS],
      );
      const row = next.rows[0];
      if (!row) return null;
      await client.query("update messages set status = 'sending', claimed_at = now(), attempts = attempts + 1 where id = $1", [row.id]);
      return { ...row, attempts: row.attempts + 1 };
    });
    if (!message) break;
    tried.push(message.id);

    const transport = message.channel === "email" ? transports.email : transports.sms;
    let result: DeliveryResult;
    let bodyText = message.body_text;
    try {
      if (message.body_secret_enc) bodyText = decryptSecretBody(message.id, message.body_secret_enc);
      try {
        result = await transport.deliver({
          id: message.id,
          channel: message.channel,
          toAddress: message.to_address,
          subject: message.subject,
          bodyText,
          template: message.template,
        });
      } catch {
        result = { status: "failed", provider: transport.name, error: "transport error", retryable: true };
      }
    } catch {
      // The secret body no longer decrypts (APP_ENCRYPTION_KEY changed): it can never be sent.
      result = { status: "failed", provider: transport.name, error: "message body could not be decrypted", retryable: false };
    }

    const outcome = await recordDelivery(getPool(), message, result);
    report.processed++;
    report[outcome]++;
  }
  return report;
}

async function recordDelivery(db: Queryable, message: ClaimedMessage, result: DeliveryResult): Promise<"sent" | "demo" | "failed" | "retrying"> {
  if (result.status === "failed") {
    const giveUp = !result.retryable || message.attempts >= MAX_DELIVERY_ATTEMPTS;
    await db.query(
      `update messages set status = $2, provider = $3, error = $4, claimed_at = null,
         body_secret_enc = case when $2 = 'failed' then null else body_secret_enc end
       where id = $1`,
      [message.id, giveUp ? "failed" : "queued", result.provider, result.error.slice(0, 500)],
    );
    return giveUp ? "failed" : "retrying";
  }
  // A live provider has the secret now; the demo mailbox keeps it (encrypted) so it can be shown.
  await db.query(
    `update messages set status = $2, provider = $3, provider_ref = $4, error = null, claimed_at = null,
       sent_at = case when $2 = 'sent' then now() else null end,
       body_secret_enc = case when $2 = 'sent' then null else body_secret_enc end
     where id = $1`,
    [message.id, result.status, result.provider, result.status === "sent" ? result.providerRef : null],
  );
  return result.status;
}
