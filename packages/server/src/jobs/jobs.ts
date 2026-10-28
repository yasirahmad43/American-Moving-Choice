/**
 * Operations jobs (build plan §9, §12; mover verification §3, §6; S7 jobs). Vercel Cron calls
 * /api/cron/<slug> once a day (Hobby-plan safe) and admin pages run the cheap ones lazily; every
 * run records a job_runs row. A job never runs twice at once: starting one takes a transaction
 * advisory lock and refuses while a run of the same job started in the last 15 minutes is still
 * marked running (a run older than that is treated as abandoned).
 */
import { suspendCompany } from "../admin/companies";
import { pruneRateLimits } from "../auth/rate-limit";
import { newToken, sha256Hex } from "../auth/tokens";
import { getPool, tx, type Queryable } from "../db/pool";
import { env } from "../env/env";
import { REDACTED_LINK, deliverPending, enqueueEmail } from "../outbox/outbox";
import { getSettings } from "../settings/settings";
import { runAutomatedChecks } from "../verification/run";
import { CHECK_LABELS, type CheckType } from "../verification/types";

export interface JobResult {
  items: number;
  details?: Record<string, unknown>;
}

export interface JobDefinition {
  /** job_runs.job_name. */
  name: string;
  /** URL segment: /api/cron/<slug>. */
  slug: string;
  label: string;
  description: string;
  /** UTC hour of the daily Vercel Cron call (apps/app/vercel.json). */
  cronHourUtc: number;
  run: () => Promise<JobResult>;
}

const ABANDONED_AFTER_MINUTES = 15;
/** Rechecks automated FMCSA checks weekly per approved company (mover verification §3). */
export const RECHECK_INTERVAL_DAYS = 7;
const RECHECK_BATCH = 20;
const INVITATION_BATCH = 100;
/** How long a review invitation link stays valid after it can first be sent. */
export const INVITATION_VALID_DAYS = 60;
export const EXPIRY_ALERT_DAYS = [30, 14, 7, 0] as const;

// ================================================================== marketplace sweeps

/** Lead groups whose sale window ended stop selling (lead lifecycle §1: expired). */
export async function expireLeadGroups(db: Queryable = getPool()): Promise<JobResult> {
  const result = await db.query("update lead_groups set status = 'expired' where status = 'available' and expires_at < now()");
  return { items: result.rowCount ?? 0 };
}

/** Purchase reservations past their hold release their slot (release_expired_attempts in 001). */
export async function releaseExpiredAttempts(db: Queryable = getPool()): Promise<JobResult> {
  const result = await db.query<{ n: number }>("select release_expired_attempts() as n");
  return { items: result.rows[0]?.n ?? 0 };
}

export async function deliverOutbox(): Promise<JobResult> {
  const report = await deliverPending({ limit: 200 });
  return { items: report.processed, details: { ...report } };
}

// ================================================================== review invitations

/**
 * Creates the system's review invitations (mover verification §6; implications §4.4):
 * a quote-experience invitation quote_invite_delay_days after each purchase, and a move-experience
 * invitation post_move_invite_days after the stated move date, whatever the CRM stage. Refunded
 * purchases and withdrawn requests get none. The token is set when the invitation is sent; until
 * then token_hash holds a random placeholder nobody has the preimage of.
 */
export async function scheduleReviewInvitations(db: Queryable = getPool()): Promise<JobResult> {
  const settings = await getSettings(db);
  const placeholder = "encode(sha256(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid())), 'hex')";
  const quote = await db.query(
    `insert into review_invitations (purchase_id, company_id, review_type, requested_by, token_hash, send_after, expires_at)
     select p.id, p.company_id, 'quote_experience', 'system', ${placeholder},
            p.created_at + make_interval(days => $1), p.created_at + make_interval(days => $1 + $2)
     from purchases p join lead_groups g on g.id = p.group_id
     where p.refunded_at is null and g.status <> 'withdrawn'
       and p.created_at + make_interval(days => $1 + $2) > now()
       and not exists (select 1 from review_invitations i where i.purchase_id = p.id and i.review_type = 'quote_experience')
     on conflict (purchase_id, review_type) do nothing`,
    [settings.quote_invite_delay_days, INVITATION_VALID_DAYS],
  );
  const move = await db.query(
    `insert into review_invitations (purchase_id, company_id, review_type, requested_by, token_hash, send_after, expires_at)
     select p.id, p.company_id, 'move_experience', 'system', ${placeholder},
            (l.move_date + $1::int)::timestamptz, (l.move_date + $1::int + $2::int)::timestamptz
     from purchases p join lead_groups g on g.id = p.group_id
     join lateral (select move_date from leads where group_id = p.group_id and is_primary and move_date is not null order by created_at limit 1) l on true
     where p.refunded_at is null and g.status <> 'withdrawn'
       and (l.move_date + $1::int + $2::int)::timestamptz > now()
       and not exists (select 1 from review_invitations i where i.purchase_id = p.id and i.review_type = 'move_experience')
     on conflict (purchase_id, review_type) do nothing`,
    [settings.post_move_invite_days, INVITATION_VALID_DAYS],
  );
  return { items: (quote.rowCount ?? 0) + (move.rowCount ?? 0), details: { quote_experience: quote.rowCount ?? 0, move_experience: move.rowCount ?? 0 } };
}

/** The review form link: /companies/<slug>/review/?token=<token> on the public site (slice S4's route). */
export function reviewLink(slug: string, token: string, base: string = env().WEB_URL): string {
  return `${base}/companies/${encodeURIComponent(slug)}/review/?token=${encodeURIComponent(token)}`;
}

export function invitationEmail(input: { reviewType: string; companyName: string; firstName: string | null; link: string; expiresAt: Date }) {
  const what = input.reviewType === "move_experience" ? `how your move with ${input.companyName} went` : `what getting a quote from ${input.companyName} was like`;
  const subject = input.reviewType === "move_experience" ? `How did your move with ${input.companyName} go?` : `How was your quote from ${input.companyName}?`;
  const until = input.expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });
  const body = (link: string) =>
    [
      input.firstName ? `Hi ${input.firstName},` : "Hello,",
      "",
      `You asked for moving quotes through American Moving Choice, and ${input.companyName} bought your request. Would you tell other people ${what}?`,
      "",
      "American Moving Choice sends these invitations itself, to every customer, so movers can't pick who reviews them. There is no reward for leaving a review, and we never ask for a positive one.",
      "",
      `This link is just for you and works once, until ${until}:`,
      link,
      "",
      "If you'd rather not, ignore this email.",
      "",
      "American Moving Choice",
    ].join("\n");
  return { subject, bodyText: body(REDACTED_LINK), secretBodyText: body(input.link) };
}

/**
 * Sends invitations whose time has come: a fresh single-use token, its sha256 stored, the email in
 * the outbox with the link only in the encrypted body. A withdrawn request or a consumer who asked
 * not to be contacted by email cancels the invitation instead (expires_at = now).
 */
export async function sendDueInvitations(): Promise<JobResult> {
  const pool = getPool();
  const due = await pool.query<{ id: string }>(
    "select id from review_invitations where sent_at is null and send_after <= now() and expires_at > now() order by send_after limit $1",
    [INVITATION_BATCH],
  );
  let sent = 0;
  let cancelled = 0;
  for (const { id } of due.rows) {
    const outcome = await tx(async (client) => {
      const row = (await client.query<{
        id: string;
        review_type: string;
        company_id: string;
        expires_at: Date;
        group_status: string;
        email: string | null;
        first_name: string | null;
        email_hash: string | null;
        withdrawn_at: Date | null;
        slug: string | null;
        display_name: string | null;
        lead_id: string | null;
      }>(
        `select i.id, i.review_type, i.company_id, i.expires_at, g.status as group_status, l.email, l.first_name, l.email_hash, l.withdrawn_at,
                pr.slug, coalesce(pr.display_name, c.legal_name) as display_name, l.id as lead_id
         from review_invitations i
         join purchases p on p.id = i.purchase_id
         join lead_groups g on g.id = p.group_id
         join companies c on c.id = i.company_id
         left join company_profiles pr on pr.company_id = i.company_id
         left join lateral (select id, email, first_name, email_hash, withdrawn_at from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
         where i.id = $1 and i.sent_at is null and i.expires_at > now()
         for update of i skip locked`,
        [id],
      )).rows[0];
      if (!row) return "skipped" as const;
      const suppressed =
        row.group_status === "withdrawn" ||
        row.withdrawn_at !== null ||
        !row.email ||
        !row.slug ||
        (row.email_hash !== null &&
          (await client.query(
            `select 1 from consumer_contact_preferences
             where email_hash = $1 and (do_not_contact or withdrawn_at is not null)
               and (company_id is null or company_id = $2) and (channel is null or channel = 'email') limit 1`,
            [row.email_hash, row.company_id],
          )).rowCount! > 0);
      if (suppressed) {
        await client.query("update review_invitations set expires_at = now() where id = $1", [row.id]);
        return "cancelled" as const;
      }
      const token = newToken();
      await client.query("update review_invitations set token_hash = $2, sent_at = now() where id = $1", [row.id, sha256Hex(token)]);
      const email = invitationEmail({ reviewType: row.review_type, companyName: row.display_name ?? "your mover", firstName: row.first_name, link: reviewLink(row.slug!, token), expiresAt: row.expires_at });
      await enqueueEmail({ to: row.email!, template: "review_invitation", subject: email.subject, bodyText: email.bodyText, secretBodyText: email.secretBodyText, relatedType: "review_invitation", relatedId: row.id }, client);
      return "sent" as const;
    });
    if (outcome === "sent") sent++;
    if (outcome === "cancelled") cancelled++;
  }
  return { items: sent, details: { sent, cancelled, due: due.rowCount ?? 0 } };
}

// ================================================================== credentials

/** Weekly automated FMCSA recheck of approved companies (the fixture adapter in demo mode), in batches. */
export async function recheckCredentials(): Promise<JobResult> {
  const due = await getPool().query<{ id: string }>(
    `select c.id from companies c
     where c.status = 'approved' and c.usdot_number is not null
       and coalesce((select max(retrieved_at) from verification_checks v where v.company_id = c.id and v.source <> 'manual'), '-infinity'::timestamptz)
           < now() - make_interval(days => $1)
     order by c.approved_at nulls first limit $2`,
    [RECHECK_INTERVAL_DAYS, RECHECK_BATCH],
  );
  const outcomes: Record<string, number> = { pass: 0, fail: 0, needs_review: 0, error: 0 };
  for (const { id } of due.rows) {
    try {
      const summary = await runAutomatedChecks(id, { actor: "system" });
      outcomes[summary.outcome] = (outcomes[summary.outcome] ?? 0) + 1;
    } catch {
      outcomes.error = (outcomes.error ?? 0) + 1;
    }
  }
  return { items: due.rowCount ?? 0, details: outcomes };
}

/** The alert threshold a credential that expires in `days` days has reached, or null. */
export function expiryThreshold(days: number): (typeof EXPIRY_ALERT_DAYS)[number] | null {
  if (days <= 0) return 0;
  if (days <= 7) return 7;
  if (days <= 14) return 14;
  if (days <= 30) return 30;
  return null;
}

const CREDENTIAL_LABELS: Record<string, string> = {
  usdot: "USDOT registration",
  docket: "operating authority",
  state_license: "state moving license",
  insurance_coi: "insurance certificate",
  insurance_filing: "insurance filing",
};

/**
 * Expiry alerts for insurance and state credentials at 30, 14, 7 and 0 days (mover verification
 * §3). One alert per credential, threshold and expiry date: a run that first sees a credential at
 * 5 days sends only the 7-day alert. At 0 days the credential is marked expired.
 */
export async function credentialExpiryAlerts(): Promise<JobResult> {
  const pool = getPool();
  const found = await pool.query<{ id: string; company_id: string; credential_type: string; number: string | null; expires_on: Date; days: number; status: string; legal_name: string }>(
    `select cr.id, cr.company_id, cr.credential_type, cr.number, cr.expires_on, (cr.expires_on - current_date)::int as days, cr.status, c.legal_name
     from credentials cr join companies c on c.id = cr.company_id
     where c.status in ('approved', 'suspended') and cr.expires_on is not null and cr.status in ('verified', 'pending', 'expired')
       and cr.expires_on <= current_date + 30
     order by cr.expires_on`,
  );
  let sent = 0;
  let expired = 0;
  for (const cr of found.rows) {
    const threshold = expiryThreshold(cr.days);
    if (threshold === null) continue;
    await tx(async (client) => {
      const inserted = await client.query<{ id: string }>(
        `insert into credential_alerts (credential_id, company_id, alert_type, expires_on) values ($1, $2, $3, $4)
         on conflict do nothing returning id`,
        [cr.id, cr.company_id, `expiry_${threshold}`, cr.expires_on],
      );
      if (threshold === 0 && cr.status !== "expired") {
        await client.query("update credentials set status = 'expired' where id = $1", [cr.id]);
        expired++;
      }
      const alertId = inserted.rows[0]?.id;
      if (!alertId) return;
      const label = CREDENTIAL_LABELS[cr.credential_type] ?? "credential";
      const date = cr.expires_on.toISOString().slice(0, 10);
      const subject = threshold === 0 ? `Your ${label} has expired` : `Your ${label} expires in ${cr.days} day${cr.days === 1 ? "" : "s"}`;
      const body = [
        threshold === 0
          ? `The ${label}${cr.number ? ` (${cr.number})` : ""} on file for ${cr.legal_name} expired on ${date}. Buying new requests is paused until a current one is verified.`
          : `The ${label}${cr.number ? ` (${cr.number})` : ""} on file for ${cr.legal_name} expires on ${date}.`,
        "",
        "Upload the renewed document in the company portal so we can verify it before the expiry date.",
        `${env().APP_URL}/portal/verification`,
        "",
        "American Moving Choice",
      ].join("\n");
      const recipients = await client.query<{ email: string }>(
        `select u.email from company_memberships m join users u on u.id = m.user_id
         where m.company_id = $1 and m.status = 'active' and m.role in ('owner', 'manager') order by m.role desc, m.created_at`,
        [cr.company_id],
      );
      let messageId: string | null = null;
      for (const { email } of recipients.rows) {
        messageId = await enqueueEmail({ to: email, template: "credential_expiry", subject, bodyText: body, relatedType: "company", relatedId: cr.company_id }, client);
      }
      await client.query("update credential_alerts set message_id = $2 where id = $1", [alertId, messageId]);
      sent++;
    });
  }
  return { items: sent, details: { alerts_sent: sent, credentials_expired: expired, considered: found.rowCount ?? 0 } };
}

const RECHECK_FAIL_TYPES: CheckType[] = ["usdot_active", "authority_type", "authority_status", "insurance_filings"];

/**
 * Suspends approved companies that a recheck found failing (mover verification §3: "on any failure
 * that can't be confirmed, automatically suspend new lead purchases and Preferred status and
 * notify the company owner"): broker authority, a failed USDOT, authority or insurance-filing
 * check, or an expired credential.
 */
export async function suspendOnFailedRecheck(): Promise<JobResult> {
  const pool = getPool();
  const found = await pool.query<{ id: string; has_broker_authority: boolean; failed: CheckType[] | null; expired: string[] | null }>(
    `select c.id, c.has_broker_authority,
            (select array_agg(x.check_type order by x.check_type) from (
               select distinct on (check_type) check_type, result from verification_checks v
               where v.company_id = c.id and v.check_type = any($1::text[])
               order by check_type, created_at desc, retrieved_at desc) x where x.result = 'fail') as failed,
            (select array_agg(distinct cr.credential_type) from credentials cr
             where cr.company_id = c.id and cr.credential_type in ('insurance_coi', 'state_license', 'insurance_filing')
               and (cr.status = 'expired' or (cr.expires_on is not null and cr.expires_on < current_date and cr.status <> 'rejected'))) as expired
     from companies c where c.status = 'approved'`,
    [RECHECK_FAIL_TYPES],
  );
  let suspended = 0;
  for (const row of found.rows) {
    const reasons: string[] = [];
    if (row.has_broker_authority) reasons.push("broker authority is on the FMCSA record");
    for (const t of row.failed ?? []) reasons.push(`check failed: ${CHECK_LABELS[t].toLowerCase()}`);
    for (const t of row.expired ?? []) reasons.push(`expired ${CREDENTIAL_LABELS[t] ?? t}`);
    if (!reasons.length) continue;
    await tx(async (client) => {
      await suspendCompany({ system: "suspend_on_failed_recheck" }, row.id, `Automatic suspension after a recheck: ${reasons.join("; ")}.`, client);
      const credential = (await client.query<{ id: string }>(
        `select id from credentials where company_id = $1 order by (status in ('rejected', 'expired')) desc, updated_at desc limit 1`,
        [row.id],
      )).rows[0];
      if (credential) {
        await client.query("insert into credential_alerts (credential_id, company_id, alert_type) values ($1, $2, 'failed_recheck') on conflict do nothing", [credential.id, row.id]);
      }
    });
    suspended++;
  }
  return { items: suspended, details: { suspended } };
}

export async function pruneRateLimitRows(): Promise<JobResult> {
  return { items: await pruneRateLimits() };
}

// ================================================================== registry and runner

export const JOBS: readonly JobDefinition[] = [
  { name: "expire_lead_groups", slug: "expire-lead-groups", label: "Expire requests", description: "Closes the sale window of requests past their expiry.", cronHourUtc: 5, run: () => expireLeadGroups() },
  { name: "release_expired_attempts", slug: "release-expired-attempts", label: "Release reservations", description: "Releases purchase reservations whose payment hold expired.", cronHourUtc: 5, run: () => releaseExpiredAttempts() },
  { name: "recheck_credentials", slug: "recheck-credentials", label: "Recheck credentials", description: `Re-runs the FMCSA checks for approved companies every ${RECHECK_INTERVAL_DAYS} days (fixture data in demo mode).`, cronHourUtc: 6, run: () => recheckCredentials() },
  { name: "credential_expiry_alerts", slug: "credential-expiry-alerts", label: "Credential expiry alerts", description: "Emails owners 30, 14, 7 and 0 days before a credential expires.", cronHourUtc: 6, run: () => credentialExpiryAlerts() },
  { name: "suspend_on_failed_recheck", slug: "suspend-on-failed-recheck", label: "Suspend on failed recheck", description: "Suspends approved companies whose recheck failed or whose credentials expired.", cronHourUtc: 7, run: () => suspendOnFailedRecheck() },
  { name: "schedule_review_invitations", slug: "schedule-review-invitations", label: "Schedule review invitations", description: "Creates quote-experience and move-experience invitations for purchases.", cronHourUtc: 15, run: () => scheduleReviewInvitations() },
  { name: "send_due_invitations", slug: "send-due-invitations", label: "Send review invitations", description: "Emails invitations whose send date has come, each with a single-use link.", cronHourUtc: 16, run: () => sendDueInvitations() },
  { name: "deliver_outbox", slug: "deliver-outbox", label: "Deliver outbox", description: "Sends queued emails and texts (demo mode only marks them for the mailbox).", cronHourUtc: 17, run: () => deliverOutbox() },
  { name: "prune_rate_limits", slug: "prune-rate-limits", label: "Prune rate limits", description: "Deletes rate-limit counters older than a day.", cronHourUtc: 9, run: () => pruneRateLimitRows() },
];

export function jobBySlug(slug: string): JobDefinition | null {
  return JOBS.find((j) => j.slug === slug) ?? null;
}

export function jobByName(name: string): JobDefinition | null {
  return JOBS.find((j) => j.name === name) ?? null;
}

export type JobRunOutcome =
  | { status: "succeeded"; runId: string; items: number; details?: Record<string, unknown> }
  | { status: "failed"; runId: string; error: string }
  | { status: "skipped"; reason: "already_running" | "recent" };

/** Error text for job_runs: the message's first line, without values that could be personal data. */
function safeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message.split("\n")[0]!.slice(0, 300)}`;
  return "unknown error";
}

/**
 * Runs one job and records it in job_runs. With minIntervalMinutes (lazy runs from pages) it
 * skips when the job succeeded or started that recently.
 */
export async function runJob(job: JobDefinition, options: { minIntervalMinutes?: number; trigger?: string } = {}): Promise<JobRunOutcome> {
  const start = await tx(async (client) => {
    await client.query("select pg_advisory_xact_lock(hashtext('amc_job:' || $1))", [job.name]);
    await client.query(
      `update job_runs set status = 'failed', finished_at = now(), error = 'abandoned: the run did not finish'
       where job_name = $1 and status = 'running' and started_at < now() - make_interval(mins => $2)`,
      [job.name, ABANDONED_AFTER_MINUTES],
    );
    const running = await client.query("select 1 from job_runs where job_name = $1 and status = 'running' limit 1", [job.name]);
    if (running.rowCount) return { skip: "already_running" as const };
    if (options.minIntervalMinutes) {
      const recent = await client.query(
        "select 1 from job_runs where job_name = $1 and status <> 'failed' and started_at > now() - make_interval(mins => $2) limit 1",
        [job.name, options.minIntervalMinutes],
      );
      if (recent.rowCount) return { skip: "recent" as const };
    }
    const row = await client.query<{ id: string }>(
      "insert into job_runs (job_name, status, details) values ($1, 'running', $2::jsonb) returning id::text",
      [job.name, JSON.stringify({ trigger: options.trigger ?? "manual" })],
    );
    return { runId: row.rows[0]!.id };
  });
  if ("skip" in start) return { status: "skipped", reason: start.skip! };
  const pool = getPool();
  try {
    const result = await job.run();
    await pool.query(
      "update job_runs set status = 'succeeded', finished_at = now(), items_processed = $2, details = coalesce(details, '{}'::jsonb) || $3::jsonb where id = $1",
      [start.runId, result.items, JSON.stringify(result.details ?? {})],
    );
    return { status: "succeeded", runId: start.runId, items: result.items, details: result.details };
  } catch (error) {
    const message = safeError(error);
    await pool.query("update job_runs set status = 'failed', finished_at = now(), error = $2 where id = $1", [start.runId, message]);
    console.error(`[jobs] ${job.name} failed`);
    return { status: "failed", runId: start.runId, error: message };
  }
}

/** Runs the named jobs one after another when each is due (for lazy calls from pages). */
export async function runDueJobs(names: readonly string[], minIntervalMinutes: number, trigger = "lazy"): Promise<Record<string, JobRunOutcome["status"]>> {
  const outcomes: Record<string, JobRunOutcome["status"]> = {};
  for (const name of names) {
    const job = jobByName(name);
    if (!job) continue;
    outcomes[name] = (await runJob(job, { minIntervalMinutes, trigger })).status;
  }
  return outcomes;
}
