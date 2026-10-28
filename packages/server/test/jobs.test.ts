import { readFileSync } from "node:fs";
import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sha256Hex } from "../src/auth/tokens";
import { closePool, getPool } from "../src/db/pool";
import {
  JOBS,
  credentialExpiryAlerts,
  expireLeadGroups,
  expiryThreshold,
  jobBySlug,
  recheckCredentials,
  releaseExpiredAttempts,
  reviewLink,
  runDueJobs,
  runJob,
  scheduleReviewInvitations,
  sendDueInvitations,
  suspendOnFailedRecheck,
} from "../src/jobs/jobs";
import { decryptSecretBody } from "../src/outbox/outbox";
import { resetDatabase } from "./helpers";

const pool = () => getPool();
const fixed = (prefix: string, n: number) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = (n: number) => fixed("c0", n);
const group = (n: number) => fixed("d0", n);
const purchase = (n: number) => fixed("d4", n);

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
});

afterAll(async () => {
  await closePool();
});

describe("registry", () => {
  it("has a unique name and slug per job", () => {
    expect(new Set(JOBS.map((j) => j.name)).size).toBe(JOBS.length);
    expect(new Set(JOBS.map((j) => j.slug)).size).toBe(JOBS.length);
    expect(jobBySlug("deliver-outbox")?.name).toBe("deliver_outbox");
    expect(jobBySlug("nope")).toBeNull();
  });

  it("is scheduled once a day per job in apps/app/vercel.json (Hobby-plan safe)", () => {
    const config = JSON.parse(readFileSync(new URL("../../../apps/app/vercel.json", import.meta.url), "utf8")) as { crons: { path: string; schedule: string }[] };
    expect(config.crons.map((c) => c.path).sort()).toEqual(JOBS.map((j) => `/api/cron/${j.slug}`).sort());
    for (const cron of config.crons) {
      const [minute, hour, ...rest] = cron.schedule.split(" ");
      expect(rest).toEqual(["*", "*", "*"]);
      expect(minute).toMatch(/^\d{1,2}$/);
      expect(Number(hour)).toBe(JOBS.find((j) => cron.path.endsWith(`/${j.slug}`))!.cronHourUtc);
    }
  });

  it("picks the expiry alert threshold", () => {
    expect([45, 30, 20, 14, 9, 7, 1, 0, -3].map(expiryThreshold)).toEqual([null, 30, 30, 14, 14, 7, 7, 0, 0]);
  });
});

describe("marketplace sweeps", () => {
  it("expires groups past their sale window", async () => {
    await pool().query("update lead_groups set expires_at = now() - interval '1 minute' where id = $1", [group(3)]);
    const result = await expireLeadGroups();
    expect(result.items).toBe(1);
    expect((await pool().query("select status from lead_groups where id = $1", [group(3)])).rows[0].status).toBe("expired");
    expect((await expireLeadGroups()).items).toBe(0);
  });

  it("releases expired reservations", async () => {
    await pool().query("update lead_groups set expires_at = now() + interval '1 day' where id = $1", [group(4)]);
    await pool().query("select reserve_purchase($1, $2, 'job-test-hold', interval '1 second')", [company(8), group(4)]).catch(() => undefined);
    await pool().query("update purchase_attempts set expires_at = now() - interval '1 minute' where idempotency_key = 'job-test-hold'");
    const result = await releaseExpiredAttempts();
    expect(result.items).toBeGreaterThanOrEqual(0);
    expect((await pool().query("select count(*)::int as n from purchase_attempts where status = 'reserved'")).rows[0].n).toBe(0);
  });
});

describe("review invitations", () => {
  it("schedules quote and move invitations once per purchase", async () => {
    const first = await scheduleReviewInvitations();
    expect(first.items).toBeGreaterThan(0);
    const live = (await pool().query("select p.id from purchases p where p.group_id = $1", [group(1)])).rows[0].id;
    const rows = await pool().query("select review_type, send_after, sent_at from review_invitations where purchase_id = $1 order by review_type", [live]);
    expect(rows.rows.map((r) => r.review_type)).toEqual(["move_experience", "quote_experience"]);
    expect(rows.rows.every((r) => r.sent_at === null)).toBe(true);
    expect((await scheduleReviewInvitations()).items).toBe(0);
  });

  it("sends due invitations with a single-use token link, and cancels withdrawn ones", async () => {
    const live = (await pool().query("select p.id from purchases p where p.group_id = $1", [group(1)])).rows[0].id;
    await pool().query("update review_invitations set send_after = now() - interval '1 minute' where purchase_id = $1 and review_type = 'quote_experience'", [live]);
    const sent = await sendDueInvitations();
    expect(sent.details).toMatchObject({ sent: 1, cancelled: 0 });
    const inv = (await pool().query("select id, token_hash, sent_at from review_invitations where purchase_id = $1 and review_type = 'quote_experience'", [live])).rows[0];
    expect(inv.sent_at).toBeInstanceOf(Date);
    const message = (await pool().query("select id, to_address, template, body_text, body_secret_enc from messages where related_id = $1", [inv.id])).rows[0];
    expect(message).toMatchObject({ to_address: "jordan.sample@demo.invalid", template: "review_invitation" });
    expect(message.body_text).not.toMatch(/\?token=/);
    const body = decryptSecretBody(message.id, message.body_secret_enc);
    const token = /review\/\?token=([A-Za-z0-9_-]{43})/.exec(body)?.[1];
    expect(token).toBeTruthy();
    expect(sha256Hex(token!)).toBe(inv.token_hash);
    expect(body).toContain("/companies/demo-lone-star-relocation-co/review/?token=");
    expect((await sendDueInvitations()).details).toMatchObject({ sent: 0 });

    // A withdrawn request's invitation is cancelled, not sent.
    await pool().query("select withdraw_lead_group($1)", [group(1)]);
    await pool().query("update review_invitations set send_after = now() - interval '1 minute' where purchase_id = $1 and review_type = 'move_experience'", [live]);
    expect((await sendDueInvitations()).details).toMatchObject({ sent: 0, cancelled: 1 });
  });

  it("sends a company-requested invitation with a fresh token, not the stored placeholder", async () => {
    const before = (await pool().query(
      `update review_invitations set requested_by = 'company', send_after = now() where purchase_id = $1 and review_type = 'move_experience' returning id, token_hash`,
      [purchase(6)],
    )).rows[0];
    expect((await sendDueInvitations()).details).toMatchObject({ sent: 1 });
    const after = (await pool().query("select token_hash, sent_at from review_invitations where id = $1", [before.id])).rows[0];
    expect(after.sent_at).toBeInstanceOf(Date);
    expect(after.token_hash).not.toBe(before.token_hash);
  });

  it("builds the public review link", () => {
    expect(reviewLink("demo-mover", "tok", "https://example.test")).toBe("https://example.test/companies/demo-mover/review/?token=tok");
  });
});

describe("credentials", () => {
  it("rechecks approved companies weekly with the fixture adapter", async () => {
    const result = await recheckCredentials();
    expect(result.items).toBeGreaterThanOrEqual(15);
    expect(result.details).toMatchObject({ fail: 0, error: 0 });
    expect((await recheckCredentials()).items).toBe(0);
  });

  it("sends one expiry alert per threshold and marks expired credentials", async () => {
    const coi = (await pool().query("select id from credentials where company_id = $1 and credential_type = 'insurance_coi'", [company(3)])).rows[0].id;
    await pool().query("update credentials set expires_on = current_date + 5 where id = $1", [coi]);
    const first = await credentialExpiryAlerts();
    expect(first.details).toMatchObject({ alerts_sent: 1 });
    expect((await pool().query("select alert_type from credential_alerts where credential_id = $1", [coi])).rows).toEqual([{ alert_type: "expiry_7" }]);
    expect((await credentialExpiryAlerts()).details).toMatchObject({ alerts_sent: 0 });
    await pool().query("update credentials set expires_on = current_date - 1 where id = $1", [coi]);
    expect((await credentialExpiryAlerts()).details).toMatchObject({ alerts_sent: 1, credentials_expired: 1 });
    expect((await pool().query("select status from credentials where id = $1", [coi])).rows[0].status).toBe("expired");
  });

  it("suspends companies whose recheck failed or whose credentials expired", async () => {
    await pool().query(
      `insert into verification_checks (company_id, check_type, source, result, decision_note)
       values ($1, 'insurance_filings', 'fixture', 'fail', 'No cargo insurance filing on record.')`,
      [company(4)],
    );
    const result = await suspendOnFailedRecheck();
    expect(result.items).toBe(2); // company 4 (failed filing) and company 3 (expired certificate)
    for (const n of [3, 4]) {
      expect((await pool().query("select status from companies where id = $1", [company(n)])).rows[0].status).toBe("suspended");
      expect((await pool().query("select count(*)::int as n from badges where company_id = $1 and revoked_at is null", [company(n)])).rows[0].n).toBe(0);
    }
    const audit = await pool().query("select actor_type, actor_id from audit_log where action = 'company.suspend' and entity_id = $1", [company(4)]);
    expect(audit.rows).toEqual([{ actor_type: "system", actor_id: "suspend_on_failed_recheck" }]);
    expect((await suspendOnFailedRecheck()).items).toBe(0);
  });
});

describe("runner", () => {
  it("records job_runs and skips a job that is already running or ran recently", async () => {
    const job = jobBySlug("expire-lead-groups")!;
    const outcome = await runJob(job, { trigger: "test" });
    expect(outcome.status).toBe("succeeded");
    const row = (await pool().query("select status, items_processed, details from job_runs where job_name = 'expire_lead_groups' order by id desc limit 1")).rows[0];
    expect(row).toMatchObject({ status: "succeeded", items_processed: 0 });
    expect(row.details.trigger).toBe("test");

    expect((await runJob(job, { minIntervalMinutes: 10 })).status).toBe("skipped");
    await pool().query("insert into job_runs (job_name, status) values ('expire_lead_groups', 'running')");
    expect(await runJob(job)).toEqual({ status: "skipped", reason: "already_running" });
    await pool().query("update job_runs set started_at = now() - interval '1 hour' where job_name = 'expire_lead_groups' and status = 'running'");
    expect((await runJob(job)).status).toBe("succeeded");
    expect((await pool().query("select count(*)::int as n from job_runs where error like 'abandoned%'")).rows[0].n).toBe(1);
  });

  it("records a failing job with a safe error", async () => {
    const failing = { ...JOBS[0]!, name: "test_failing_job", run: async () => { throw new Error("boom\nsecond line"); } };
    const outcome = await runJob(failing);
    expect(outcome).toMatchObject({ status: "failed", error: "Error: boom" });
  });

  it("runs due jobs lazily", async () => {
    const outcomes = await runDueJobs(["deliver_outbox", "release_expired_attempts", "unknown_job"], 30);
    expect(outcomes).toEqual({ deliver_outbox: "succeeded", release_expired_attempts: "succeeded" });
    expect(await runDueJobs(["deliver_outbox"], 30)).toEqual({ deliver_outbox: "skipped" });
  });
});

it("purchase fixtures exist", async () => {
  expect((await pool().query("select count(*)::int as n from purchases where id = any($1::uuid[])", [[purchase(5), purchase(6)]])).rows[0].n).toBe(2);
});
