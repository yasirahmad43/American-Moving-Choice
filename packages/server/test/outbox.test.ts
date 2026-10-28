import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { resetEnvCache } from "../src/env/env";
import { canViewMessage, mailboxBody } from "../src/outbox/mailbox";
import { MAX_DELIVERY_ATTEMPTS, OutboxError, decryptSecretBody, deliverPending, enqueueEmail, enqueueSms } from "../src/outbox/outbox";
import { demoTransport, postmarkTransport, transportsFromEnv, type Transport, type Transports } from "../src/outbox/transports";
import { resetDatabase } from "./helpers";

const pool = () => getPool();

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

async function statusOf(id: string) {
  const result = await pool().query<{ status: string; provider: string | null; provider_ref: string | null; attempts: number; error: string | null; sent_at: Date | null }>(
    "select status, provider, provider_ref, attempts, error, sent_at from messages where id = $1",
    [id],
  );
  return result.rows[0]!;
}

/** A stand-in live transport: enqueue marks messages "queued" when the channel's transport is not demo. */
const liveLike: Transport = { name: "live-test", deliver: async () => ({ status: "sent", provider: "live-test", providerRef: "ref-1" }) };
const live: Transports = { email: liveLike, sms: liveLike };

describe("outbox", () => {
  it("queues email and SMS for live transports and validates recipients", async () => {
    const emailId = await enqueueEmail({ to: " Person@Example.com ", template: "test_notice", subject: "Hello", bodyText: "Body", relatedType: "test" }, undefined, { transports: live });
    const smsId = await enqueueSms({ to: "+15125550123", template: "test_notice", bodyText: "Text body" }, undefined, { transports: live });
    const email = await pool().query("select channel, to_address, status, attempts from messages where id = $1", [emailId]);
    expect(email.rows[0]).toEqual({ channel: "email", to_address: "person@example.com", status: "queued", attempts: 0 });
    expect((await statusOf(smsId)).status).toBe("queued");

    await expect(enqueueEmail({ to: "not-an-email", template: "x", subject: "s", bodyText: "b" })).rejects.toBeInstanceOf(OutboxError);
    await expect(enqueueSms({ to: "5125550123", template: "x", bodyText: "b" })).rejects.toBeInstanceOf(OutboxError);
    await expect(enqueueEmail({ to: "a@example.com", template: "Bad Template", subject: "s", bodyText: "b" })).rejects.toBeInstanceOf(OutboxError);
  });

  it("stores new messages with status demo right away when no provider keys are set", async () => {
    const transports = transportsFromEnv();
    expect(transports.email.name).toBe("demo");
    expect(transports.sms.name).toBe("demo");
    const id = await enqueueEmail({ to: "demo@example.com", template: "invitation", subject: "s", bodyText: "b" });
    expect(await statusOf(id)).toMatchObject({ status: "demo", provider: "demo", attempts: 0 });
    await pool().query("delete from messages where id = $1", [id]);
  });

  it("delivers queued messages through the demo transport as status demo", async () => {
    const report = await deliverPending({ transports: { email: demoTransport, sms: demoTransport } });
    expect(report).toEqual({ processed: 2, sent: 0, demo: 2, failed: 0, retrying: 0 });
    const rows = await pool().query<{ status: string; provider: string; attempts: number; sent_at: Date | null }>(
      "select status, provider, attempts, sent_at from messages order by created_at",
    );
    expect(rows.rows).toEqual([
      { status: "demo", provider: "demo", attempts: 1, sent_at: null },
      { status: "demo", provider: "demo", attempts: 1, sent_at: null },
    ]);
    expect(await deliverPending()).toEqual({ processed: 0, sent: 0, demo: 0, failed: 0, retrying: 0 });
  });

  it("keeps secret links out of body_text, sends them to the provider only, then drops them", async () => {
    const delivered: string[] = [];
    const capture: Transport = { name: "capture", deliver: async (m) => (delivered.push(m.bodyText), { status: "sent", provider: "capture", providerRef: "c-1" }) };
    const id = await enqueueEmail(
      { to: "secret@example.com", template: "password_reset", subject: "Reset", bodyText: "Open: [link hidden]", secretBodyText: "Open: https://app.example/reset-password/SECRET" },
      undefined,
      { transports: { email: capture, sms: capture } },
    );
    const stored = await pool().query<{ body_text: string; body_secret_enc: string }>("select body_text, body_secret_enc from messages where id = $1", [id]);
    expect(stored.rows[0]!.body_text).toBe("Open: [link hidden]");
    expect(stored.rows[0]!.body_secret_enc).not.toContain("SECRET");
    expect(decryptSecretBody(id, stored.rows[0]!.body_secret_enc)).toContain("/reset-password/SECRET");
    await deliverPending({ transports: { email: capture, sms: capture } });
    expect(delivered).toEqual(["Open: https://app.example/reset-password/SECRET"]);
    const after = await pool().query("select status, body_secret_enc from messages where id = $1", [id]);
    expect(after.rows[0]).toEqual({ status: "sent", body_secret_enc: null });
  });

  it("shows secret links in the mailbox only to a super admin in demo mode, and hides them from ops and support", async () => {
    const id = await enqueueEmail({ to: "mailbox@example.com", template: "invitation", subject: "Join", bodyText: "Accept: [link hidden]", secretBodyText: "Accept: https://app.example/invite/TOKEN" });
    const row = (await pool().query<{ id: string; template: string; body_text: string; body_secret_enc: string | null }>("select id, template, body_text, body_secret_enc from messages where id = $1", [id])).rows[0]!;
    expect(row.body_secret_enc).not.toBeNull(); // demo messages keep the encrypted body for the mailbox
    expect(mailboxBody(row, { adminRole: "super_admin", demoMode: true })).toContain("/invite/TOKEN");
    expect(mailboxBody(row, { adminRole: "super_admin", demoMode: false })).toBe("Accept: [link hidden]");
    expect(mailboxBody(row, { adminRole: "ops", demoMode: true })).toBeNull();
    expect(mailboxBody(row, { adminRole: "support", demoMode: true })).toBeNull();
    expect(canViewMessage("support", "lead_available")).toBe(true);
    expect(canViewMessage("finance", "lead_available")).toBe(false);
    await pool().query("delete from messages where id = $1", [id]);
  });

  it("sends without holding a transaction, and retries a claim left by a crashed run", async () => {
    const id = await enqueueEmail({ to: "claim@example.com", template: "test_notice", subject: "s", bodyText: "b" }, undefined, { transports: live });
    let openTransactions = -1;
    const probe: Transport = {
      name: "probe",
      async deliver() {
        const r = await pool().query<{ n: number }>("select count(*)::int as n from pg_stat_activity where datname = current_database() and state like 'idle in transaction%'");
        openTransactions = r.rows[0]!.n;
        const status = await pool().query<{ status: string }>("select status from messages where id = $1", [id]);
        expect(status.rows[0]!.status).toBe("sending");
        return { status: "sent", provider: "probe", providerRef: null };
      },
    };
    await deliverPending({ transports: { email: probe, sms: probe } });
    expect(openTransactions).toBe(0);
    expect(await statusOf(id)).toMatchObject({ status: "sent", attempts: 1 });

    const stuck = await enqueueEmail({ to: "stuck@example.com", template: "test_notice", subject: "s", bodyText: "b" }, undefined, { transports: live });
    await pool().query("update messages set status = 'sending', claimed_at = now() - interval '1 hour', attempts = 1 where id = $1", [stuck]);
    expect(await deliverPending({ transports: live })).toMatchObject({ processed: 1, sent: 1 });
    expect(await statusOf(stuck)).toMatchObject({ status: "sent", attempts: 2 });
  });

  it("sends through Postmark when a server token is configured", async () => {
    const requests: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "pm-123" }), { status: 200 });
    }) as unknown as typeof fetch;

    const id = await enqueueEmail({ to: "customer@example.com", template: "purchase_notice", subject: "A mover received your request", bodyText: "Details" }, undefined, { transports: live });
    const report = await deliverPending({ transports: { email: postmarkTransport("server-token", "AMC <notify@example.com>", fakeFetch), sms: demoTransport } });
    expect(report).toMatchObject({ processed: 1, sent: 1 });
    expect(await statusOf(id)).toMatchObject({ status: "sent", provider: "postmark", provider_ref: "pm-123", attempts: 1, error: null });
    expect((await statusOf(id)).sent_at).not.toBeNull();

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toBe("https://api.postmarkapp.com/email");
    const headers = requests[0]!.init.headers as Record<string, string>;
    expect(headers["X-Postmark-Server-Token"]).toBe("server-token");
    expect(JSON.parse(String(requests[0]!.init.body))).toMatchObject({
      From: "AMC <notify@example.com>",
      To: "customer@example.com",
      Subject: "A mover received your request",
      TextBody: "Details",
      MessageStream: "outbound",
    });
  });

  it("retries server errors up to the limit and gives up on rejected requests", async () => {
    let status = 500;
    const fakeFetch = (async () => new Response(JSON.stringify({ ErrorCode: 300, Message: "Invalid email request" }), { status })) as unknown as typeof fetch;
    const transports = { email: postmarkTransport("t", "AMC <n@example.com>", fakeFetch), sms: demoTransport };

    const retryId = await enqueueEmail({ to: "retry@example.com", template: "test_notice", subject: "s", bodyText: "b" }, undefined, { transports: live });
    expect(await deliverPending({ transports })).toMatchObject({ processed: 1, retrying: 1 });
    expect(await statusOf(retryId)).toMatchObject({ status: "queued", attempts: 1, provider: "postmark" });
    for (let i = 2; i <= MAX_DELIVERY_ATTEMPTS; i++) await deliverPending({ transports });
    expect(await statusOf(retryId)).toMatchObject({ status: "failed", attempts: MAX_DELIVERY_ATTEMPTS });

    status = 422;
    const rejectedId = await enqueueEmail({ to: "rejected@example.com", template: "test_notice", subject: "s", bodyText: "b" }, undefined, { transports: live });
    expect(await deliverPending({ transports })).toMatchObject({ processed: 1, failed: 1 });
    const rejected = await statusOf(rejectedId);
    expect(rejected).toMatchObject({ status: "failed", attempts: 1 });
    expect(rejected.error).toContain("HTTP 422");
  });

  it("selects Postmark from the environment when the token is present", () => {
    process.env.POSTMARK_SERVER_TOKEN = "token-from-env";
    resetEnvCache();
    try {
      expect(transportsFromEnv().email.name).toBe("postmark");
    } finally {
      delete process.env.POSTMARK_SERVER_TOKEN;
      resetEnvCache();
    }
    expect(transportsFromEnv().email.name).toBe("demo");
  });
});
