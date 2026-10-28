/**
 * Read models for the admin dashboard, mailbox, audit log and purchases list (S7 must: dashboard
 * counts; the mailbox uses canViewMessage/mailboxBody so token-bearing messages stay restricted).
 */
import type { AdminRole } from "../auth/sessions";
import { getPool, type Queryable } from "../db/pool";
import { SENSITIVE_TEMPLATES, canViewMessage, mailboxBody } from "../outbox/mailbox";

// ================================================================== dashboard

export interface DashboardStats {
  leadsByStatus: { status: string; today: number; week: number }[];
  groupsByStatus: { status: string; today: number; week: number }[];
  money: {
    days: 7 | 30;
    purchases: number;
    grossChargesCents: number;
    creditsIssuedCents: number;
    cashRefundsCents: number;
    netRevenueCents: number;
    cardCollectedCents: number;
  }[];
  sellThrough: { days: 30; groups: number; slotsOffered: number; slotsSold: number; groupsWithBuyer: number };
  queues: { heldRequests: number; pendingVerifications: number; recheckIssues: number; openCases: number; overdueCases: number; pendingReviews: number; openReports: number; openClaims: number; queuedMessages: number; failedMessages: number; openDisputes: number };
  lastJobs: { job_name: string; status: string; started_at: Date; finished_at: Date | null }[];
}

/**
 * Dashboard numbers. Definitions shown on the page:
 * - gross charges: what purchases cost (charged_cents, funded by card and/or credit);
 * - credits issued: sharing credits, quality-refund credits and positive adjustments;
 * - net revenue: gross charges minus credits issued minus cash refunds;
 * - sell-through: purchases ÷ slots offered (sharing limits) for requests created in the last 30 days.
 */
export async function dashboardStats(db: Queryable = getPool()): Promise<DashboardStats> {
  const [leads, groups, money7, money30, sell, queues, jobs] = await Promise.all([
    db.query<{ status: string; today: number; week: number }>(
      `select status, count(*) filter (where created_at >= date_trunc('day', now()))::int as today, count(*)::int as week
       from leads where created_at >= now() - interval '7 days' group by status order by status`,
    ),
    db.query<{ status: string; today: number; week: number }>(
      `select status::text, count(*) filter (where created_at >= date_trunc('day', now()))::int as today, count(*)::int as week
       from lead_groups where created_at >= now() - interval '7 days' group by status order by status`,
    ),
    moneyFor(db, 7),
    moneyFor(db, 30),
    db.query<{ groups: number; offered: number; sold: number; with_buyer: number }>(
      `select count(*)::int as groups, coalesce(sum(g.sharing_limit), 0)::int as offered,
              coalesce(sum((select count(*) from purchases p where p.group_id = g.id)), 0)::int as sold,
              count(*) filter (where exists (select 1 from purchases p where p.group_id = g.id))::int as with_buyer
       from lead_groups g where g.created_at >= now() - interval '30 days' and g.status <> 'withdrawn'`,
    ),
    db.query<DashboardStats["queues"]>(
      `select
         (select count(*)::int from leads where status = 'needs_review') as "heldRequests",
         (select count(*)::int from companies where status in ('applied', 'verifying', 'in_review')) as "pendingVerifications",
         (select count(*)::int from companies c where c.status = 'approved' and exists (
            select 1 from (select distinct on (check_type) result from verification_checks v where v.company_id = c.id
                           order by check_type, created_at desc, retrieved_at desc) x where x.result <> 'pass')) as "recheckIssues",
         (select count(*)::int from cases where status in ('open', 'in_progress', 'waiting')) as "openCases",
         (select count(*)::int from cases where status in ('open', 'in_progress', 'waiting') and sla_due_at < now()) as "overdueCases",
         (select count(*)::int from reviews where status = 'pending') as "pendingReviews",
         (select count(*)::int from review_reports where status = 'open') as "openReports",
         (select count(*)::int from lead_quality_claims where status = 'open') as "openClaims",
         (select count(*)::int from messages where status in ('queued', 'sending')) as "queuedMessages",
         (select count(*)::int from messages where status = 'failed') as "failedMessages",
         (select count(*)::int from disputes where status in ('open', 'evidence_submitted')) as "openDisputes"`,
    ),
    db.query<{ job_name: string; status: string; started_at: Date; finished_at: Date | null }>(
      "select distinct on (job_name) job_name, status, started_at, finished_at from job_runs order by job_name, started_at desc",
    ),
  ]);
  const s = sell.rows[0]!;
  return {
    leadsByStatus: leads.rows,
    groupsByStatus: groups.rows,
    money: [money7, money30],
    sellThrough: { days: 30, groups: s.groups, slotsOffered: s.offered, slotsSold: s.sold, groupsWithBuyer: s.with_buyer },
    queues: queues.rows[0]!,
    lastJobs: jobs.rows,
  };
}

async function moneyFor(db: Queryable, days: 7 | 30): Promise<DashboardStats["money"][number]> {
  const found = await db.query<{ purchases: number; gross: number; card: number; credits: number; cash: number }>(
    `select
       (select count(*)::int from purchases where created_at >= now() - make_interval(days => $1)) as purchases,
       (select coalesce(sum(charged_cents), 0)::int from purchases where created_at >= now() - make_interval(days => $1)) as gross,
       (select coalesce(sum(a.card_amount_cents), 0)::int from purchases p join purchase_attempts a on a.id = p.attempt_id
         where p.created_at >= now() - make_interval(days => $1)) as card,
       (select coalesce(sum(amount_cents), 0)::int from ledger_entries where created_at >= now() - make_interval(days => $1)
         and (kind in ('sharing_credit', 'quality_refund_credit') or (kind = 'adjustment' and amount_cents > 0))) as credits,
       (select coalesce(sum(amount_cents), 0)::int from ledger_entries where created_at >= now() - make_interval(days => $1) and kind = 'cash_refund') as cash`,
    [days],
  );
  const r = found.rows[0]!;
  return {
    days,
    purchases: r.purchases,
    grossChargesCents: r.gross,
    creditsIssuedCents: r.credits,
    cashRefundsCents: r.cash,
    netRevenueCents: r.gross - r.credits - r.cash,
    cardCollectedCents: r.card,
  };
}

// ================================================================== mailbox

export interface MailboxMessage {
  id: string;
  channel: string;
  to_address: string;
  template: string;
  subject: string | null;
  status: string;
  provider: string | null;
  error: string | null;
  attempts: number;
  related_type: string | null;
  related_id: string | null;
  created_at: Date;
  sent_at: Date | null;
  /** What this admin may read: the redacted body, or the deliverable one for a super admin in demo mode. */
  body: string;
  sensitive: boolean;
}

/**
 * Outbox messages an admin may see. Token-bearing templates (password reset, invitations) are left
 * out entirely for roles that may not view them (canViewMessage), so neither their subject nor
 * their recipient shows; the body comes from mailboxBody.
 */
export async function listMailbox(
  viewer: { adminRole: AdminRole; demoMode: boolean },
  filters: { q?: string | null; template?: string | null; status?: string | null; limit?: number; offset?: number } = {},
  db: Queryable = getPool(),
): Promise<{ rows: MailboxMessage[]; total: number }> {
  if (!canViewMessage(viewer.adminRole, "any_template")) return { rows: [], total: 0 };
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replaceAll("?", `$${values.length}`));
  };
  // Filter in SQL too, so counts and pages never include hidden messages.
  const hidden = [...SENSITIVE_TEMPLATES].filter((t) => !canViewMessage(viewer.adminRole, t));
  if (hidden.length) add("not (m.template = any(?::text[]))", hidden);
  if (filters.q) add("m.to_address ilike ?", `%${filters.q.replace(/[\\%_]/g, (x) => `\\${x}`)}%`);
  if (filters.template && /^[a-z][a-z0-9_]*$/.test(filters.template)) add("m.template = ?", filters.template);
  if (filters.status && ["queued", "sending", "sent", "demo", "failed"].includes(filters.status)) add("m.status = ?", filters.status);
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const total = await db.query<{ n: number }>(`select count(*)::int as n from messages m ${clause}`, values);
  values.push(filters.limit ?? 50, filters.offset ?? 0);
  const rows = await db.query<Omit<MailboxMessage, "body" | "sensitive"> & { body_text: string; body_secret_enc: string | null }>(
    `select m.id, m.channel, m.to_address, m.template, m.subject, m.status, m.provider, m.error, m.attempts, m.related_type, m.related_id,
            m.created_at, m.sent_at, m.body_text, m.body_secret_enc
     from messages m ${clause} order by m.created_at desc, m.id limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  const visible: MailboxMessage[] = [];
  for (const { body_text, body_secret_enc, ...row } of rows.rows) {
    const body = mailboxBody({ id: row.id, template: row.template, body_text, body_secret_enc }, viewer);
    if (body === null) continue;
    visible.push({ ...row, body, sensitive: SENSITIVE_TEMPLATES.has(row.template) });
  }
  return { rows: visible, total: total.rows[0]?.n ?? 0 };
}

export async function mailboxTemplates(viewer: { adminRole: AdminRole }, db: Queryable = getPool()): Promise<string[]> {
  const found = await db.query<{ template: string }>("select distinct template from messages order by template");
  return found.rows.map((r) => r.template).filter((t) => canViewMessage(viewer.adminRole, t));
}

// ================================================================== audit log

export interface AuditRow {
  id: string;
  actor_type: string;
  actor_id: string | null;
  actor_email: string | null;
  company_id: string | null;
  company_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  created_at: Date;
}

export async function listAuditLog(
  filters: { action?: string | null; entity?: string | null; actor?: string | null; companyId?: string | null; from?: string | null; to?: string | null; limit?: number; offset?: number } = {},
  db: Queryable = getPool(),
): Promise<{ rows: AuditRow[]; total: number }> {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replaceAll("?", `$${values.length}`));
  };
  const like = (v: string) => `%${v.replace(/[\\%_]/g, (x) => `\\${x}`)}%`;
  if (filters.action) add("a.action ilike ?", like(filters.action));
  if (filters.entity) add("a.entity = ?", filters.entity);
  if (filters.actor) {
    values.push(like(filters.actor), filters.actor);
    where.push(`(u.email ilike $${values.length - 1} or a.actor_id = $${values.length})`);
  }
  if (filters.companyId && /^[0-9a-f-]{36}$/i.test(filters.companyId)) add("a.company_id = ?::uuid", filters.companyId);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) add("a.created_at >= ?::date", filters.from);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) add("a.created_at < ?::date + 1", filters.to);
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const from = "from audit_log a left join users u on u.id::text = a.actor_id left join companies c on c.id = a.company_id";
  const total = await db.query<{ n: number }>(`select count(*)::int as n ${from} ${clause}`, values);
  values.push(filters.limit ?? 100, filters.offset ?? 0);
  const rows = await db.query<AuditRow>(
    `select a.id::text, a.actor_type, a.actor_id, u.email as actor_email, a.company_id, c.legal_name as company_name, a.action, a.entity, a.entity_id,
            a.before, a.after, a.ip, a.created_at
     ${from} ${clause} order by a.created_at desc, a.id desc limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  return { rows: rows.rows, total: total.rows[0]?.n ?? 0 };
}

// ================================================================== purchases

export async function listPurchases(filters: { companyId?: string | null; from?: string | null; to?: string | null; limit?: number; offset?: number } = {}, db: Queryable = getPool()) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (filters.companyId && /^[0-9a-f-]{36}$/i.test(filters.companyId)) {
    values.push(filters.companyId);
    where.push(`p.company_id = $${values.length}::uuid`);
  }
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    values.push(filters.from);
    where.push(`p.created_at >= $${values.length}::date`);
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    values.push(filters.to);
    where.push(`p.created_at < $${values.length}::date + 1`);
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const total = await db.query<{ n: number }>(`select count(*)::int as n from purchases p ${clause}`, values);
  values.push(filters.limit ?? 50, filters.offset ?? 0);
  const rows = await db.query<{
    id: string;
    company_id: string;
    legal_name: string;
    lead_id: string | null;
    reference_code: string | null;
    lead_type: string;
    position: number;
    list_price_cents: number;
    charged_cents: number;
    credit_applied_cents: number;
    card_amount_cents: number;
    sharing_credits: number;
    payment_ref: string | null;
    refunded_at: Date | null;
    disclosed_at: Date | null;
    created_at: Date;
  }>(
    `select p.id, p.company_id, c.legal_name, l.id as lead_id, l.reference_code, p.lead_type, p.position, p.list_price_cents, p.charged_cents,
            a.credit_applied_cents, a.card_amount_cents,
            coalesce((select sum(amount_cents) from ledger_entries e where e.purchase_id = p.id and e.kind = 'sharing_credit'), 0)::int as sharing_credits,
            a.payment_ref, p.refunded_at, d.disclosed_at, p.created_at
     from purchases p join companies c on c.id = p.company_id join purchase_attempts a on a.id = p.attempt_id
     left join disclosures d on d.purchase_id = p.id
     left join lateral (select id, reference_code from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     ${clause} order by p.created_at desc limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  return { rows: rows.rows, total: total.rows[0]?.n ?? 0 };
}

export async function listJobRuns(limit = 100, db: Queryable = getPool()) {
  const found = await db.query<{ id: string; job_name: string; status: string; started_at: Date; finished_at: Date | null; items_processed: number | null; error: string | null; details: unknown }>(
    "select id::text, job_name, status, started_at, finished_at, items_processed, error, details from job_runs order by started_at desc, id desc limit $1",
    [limit],
  );
  return found.rows;
}
