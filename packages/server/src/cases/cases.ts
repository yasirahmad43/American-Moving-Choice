/**
 * Cases (mover verification §7; S7 must: list and detail, assignment, status, outcome, link to a
 * company, trigger re-verification or suspension). Reports of broker activity, credential
 * problems, misconduct, review and privacy issues each become a case with an SLA, an assignee and
 * an outcome. Reporter contact fields are private to admins.
 */
import { AdminError, cleanText, requireText, type AdminActor } from "../admin/common";
import { suspendCompany } from "../admin/companies";
import { audit } from "../audit/audit";
import { getPool, isUuid, tx, type Queryable } from "../db/pool";
import { runAutomatedChecks } from "../verification/run";

export const CASE_TYPES = ["broker_activity", "credential", "misconduct", "review", "privacy", "billing", "unlisted_contact", "other"] as const;
export type CaseType = (typeof CASE_TYPES)[number];
export const CASE_STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  broker_activity: "Broker activity",
  credential: "Credential problem",
  misconduct: "Misconduct",
  review: "Review issue",
  privacy: "Privacy request",
  billing: "Billing",
  unlisted_contact: "Contact from an unlisted company",
  other: "Other",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting on someone",
  resolved: "Resolved",
  closed: "Closed",
};

/** Target response time per case type, in days (proposal; broker reports and contact from unlisted companies first). */
export const CASE_SLA_DAYS: Record<CaseType, number> = {
  broker_activity: 2,
  unlisted_contact: 2,
  credential: 3,
  misconduct: 5,
  review: 5,
  billing: 5,
  privacy: 10,
  other: 7,
};

export const isCaseType = (v: string): v is CaseType => (CASE_TYPES as readonly string[]).includes(v);
export const isCaseStatus = (v: string): v is CaseStatus => (CASE_STATUSES as readonly string[]).includes(v);

export interface CaseRow {
  id: string;
  case_type: CaseType;
  company_id: string | null;
  company_name: string | null;
  lead_id: string | null;
  review_id: string | null;
  description: string;
  status: CaseStatus;
  assignee: string | null;
  assignee_email: string | null;
  sla_due_at: Date | null;
  outcome: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const CASE_SELECT = `select k.id, k.case_type, k.company_id, c.legal_name as company_name, k.lead_id, k.review_id, k.description, k.status,
       k.assignee, u.email as assignee_email, k.sla_due_at, k.outcome, k.resolved_at, k.created_at, k.updated_at
  from cases k left join companies c on c.id = k.company_id left join users u on u.id = k.assignee`;

export async function listCases(
  filters: { status?: string | null; type?: string | null; assignee?: string | null; open?: boolean } = {},
  db: Queryable = getPool(),
): Promise<CaseRow[]> {
  const where: string[] = [];
  const values: unknown[] = [];
  if (filters.status && isCaseStatus(filters.status)) {
    values.push(filters.status);
    where.push(`k.status = $${values.length}`);
  } else if (filters.open) {
    where.push("k.status in ('open', 'in_progress', 'waiting')");
  }
  if (filters.type && isCaseType(filters.type)) {
    values.push(filters.type);
    where.push(`k.case_type = $${values.length}`);
  }
  if (filters.assignee && isUuid(filters.assignee)) {
    values.push(filters.assignee);
    where.push(`k.assignee = $${values.length}`);
  }
  const found = await db.query<CaseRow>(
    `${CASE_SELECT} ${where.length ? `where ${where.join(" and ")}` : ""}
     order by (k.status in ('resolved', 'closed')), k.sla_due_at nulls last, k.created_at desc limit 300`,
    values,
  );
  return found.rows;
}

export async function getCase(caseId: string, db: Queryable = getPool()) {
  if (!isUuid(caseId)) return null;
  const found = await db.query<CaseRow & { reporter_name: string | null; reporter_email: string | null; reporter_phone: string | null; company_status: string | null }>(
    `select k.id, k.case_type, k.company_id, c.legal_name as company_name, c.status as company_status, k.lead_id, k.review_id, k.description, k.status,
            k.assignee, u.email as assignee_email, k.sla_due_at, k.outcome, k.resolved_at, k.created_at, k.updated_at,
            k.reporter_name, k.reporter_email, k.reporter_phone
     from cases k left join companies c on c.id = k.company_id left join users u on u.id = k.assignee where k.id = $1`,
    [caseId],
  );
  const row = found.rows[0];
  if (!row) return null;
  const history = await db.query<{ id: string; action: string; actor_email: string | null; actor_type: string; before: unknown; after: unknown; created_at: Date }>(
    `select a.id::text, a.action, u.email as actor_email, a.actor_type, a.before, a.after, a.created_at
     from audit_log a left join users u on u.id::text = a.actor_id where a.entity = 'case' and a.entity_id = $1 order by a.created_at desc, a.id desc`,
    [caseId],
  );
  return { case: row, history: history.rows };
}

/** Admins who can be assigned a case. */
export async function caseAssignees(db: Queryable = getPool()) {
  const found = await db.query<{ user_id: string; email: string; admin_role: string }>(
    `select a.user_id, u.email, a.admin_role from admin_users a join users u on u.id = a.user_id
     where a.admin_role in ('super_admin', 'ops', 'support', 'moderator', 'verification') order by u.email`,
  );
  return found.rows;
}

export interface NewCase {
  caseType: string;
  description: string;
  companyId?: string | null;
  leadId?: string | null;
  reviewId?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
}

/**
 * Opens a case with its SLA. actor is the admin recording it, or { consumer: true } when a public
 * report form files it (no actor ID).
 */
export async function createCase(actor: AdminActor | { consumer: true; ip?: string | null }, input: NewCase): Promise<string> {
  if (!isCaseType(input.caseType)) throw new AdminError("Choose the kind of report.");
  const caseType: CaseType = input.caseType;
  const description = requireText(input.description, "what was reported", 5000);
  const email = cleanText(input.reporterEmail, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AdminError("The reporter's email doesn't look like an email address.", "invalid_email");
  for (const [label, id] of [["company", input.companyId], ["request", input.leadId], ["review", input.reviewId]] as const) {
    if (id && !isUuid(id)) throw new AdminError(`The linked ${label} ID isn't valid.`, "invalid_link");
  }
  return tx(async (client) => {
    if (input.companyId) {
      const c = await client.query("select 1 from companies where id = $1", [input.companyId]);
      if (!c.rowCount) throw new AdminError("The linked company doesn't exist.", "invalid_link");
    }
    const row = await client.query<{ id: string }>(
      `insert into cases (case_type, company_id, lead_id, review_id, reporter_name, reporter_email, reporter_phone, description, sla_due_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, now() + make_interval(days => $9)) returning id`,
      [
        caseType,
        input.companyId || null,
        input.leadId || null,
        input.reviewId || null,
        cleanText(input.reporterName, 120),
        email?.toLowerCase() ?? null,
        cleanText(input.reporterPhone, 40),
        description,
        CASE_SLA_DAYS[caseType],
      ],
    );
    const id = row.rows[0]!.id;
    const isConsumer = "consumer" in actor;
    await audit(
      {
        actorType: isConsumer ? "consumer" : "admin",
        actorId: isConsumer ? null : actor.userId,
        companyId: input.companyId || null,
        action: "case.create",
        entity: "case",
        entityId: id,
        after: { case_type: caseType, sla_days: CASE_SLA_DAYS[caseType] },
        ip: actor.ip ?? null,
      },
      client,
    );
    return id;
  });
}

export interface CaseUpdate {
  status?: string;
  assignee?: string | null;
  outcome?: string | null;
  companyId?: string | null;
}

/** Changes status, assignee, outcome or the linked company. Resolving or closing needs an outcome. */
export async function updateCase(actor: AdminActor, caseId: string, input: CaseUpdate): Promise<void> {
  if (!isUuid(caseId)) throw new AdminError("Case not found.", "not_found");
  await tx(async (client) => {
    const current = (await client.query<{ status: CaseStatus; assignee: string | null; outcome: string | null; company_id: string | null }>(
      "select status, assignee, outcome, company_id from cases where id = $1 for update",
      [caseId],
    )).rows[0];
    if (!current) throw new AdminError("Case not found.", "not_found");
    const status = input.status ?? current.status;
    if (!isCaseStatus(status)) throw new AdminError("Choose a status.");
    const outcome = input.outcome === undefined ? current.outcome : cleanText(input.outcome, 5000);
    if ((status === "resolved" || status === "closed") && !outcome) throw new AdminError("Enter the outcome before resolving or closing the case.", "missing_outcome");
    let assignee = input.assignee === undefined ? current.assignee : input.assignee || null;
    if (assignee) {
      if (!isUuid(assignee)) throw new AdminError("Choose an admin to assign.");
      const admin = await client.query("select 1 from admin_users where user_id = $1", [assignee]);
      if (!admin.rowCount) throw new AdminError("Cases can be assigned only to admins.", "invalid_assignee");
    } else {
      assignee = null;
    }
    const companyId = input.companyId === undefined ? current.company_id : input.companyId || null;
    if (companyId) {
      if (!isUuid(companyId)) throw new AdminError("The company ID isn't valid.", "invalid_link");
      const c = await client.query("select 1 from companies where id = $1", [companyId]);
      if (!c.rowCount) throw new AdminError("The linked company doesn't exist.", "invalid_link");
    }
    await client.query(
      `update cases set status = $2, assignee = $3, outcome = $4, company_id = $5,
         resolved_at = case when $2 in ('resolved', 'closed') then coalesce(resolved_at, now()) else null end
       where id = $1`,
      [caseId, status, assignee, outcome, companyId],
    );
    const before = { status: current.status, assignee: current.assignee, outcome: current.outcome, company_id: current.company_id };
    const after = { status, assignee, outcome, company_id: companyId };
    await audit({ actorType: "admin", actorId: actor.userId, companyId, action: "case.update", entity: "case", entityId: caseId, before, after, ip: actor.ip ?? null }, client);
  });
}

async function linkedCompany(caseId: string): Promise<string> {
  const row = (await getPool().query<{ company_id: string | null }>("select company_id from cases where id = $1", [caseId])).rows[0];
  if (!row) throw new AdminError("Case not found.", "not_found");
  if (!row.company_id) throw new AdminError("Link the case to a company first.", "no_company");
  return row.company_id;
}

/** Re-runs the linked company's automated checks and notes it on the case. */
export async function caseReverify(actor: AdminActor, caseId: string): Promise<string> {
  const companyId = await linkedCompany(caseId);
  const summary = await runAutomatedChecks(companyId, { actor: { userId: actor.userId }, ip: actor.ip ?? null });
  await audit({
    actorType: "admin",
    actorId: actor.userId,
    companyId,
    action: "case.reverify",
    entity: "case",
    entityId: caseId,
    after: { outcome: summary.outcome, lookup: summary.lookup },
    ip: actor.ip ?? null,
  });
  await getPool().query("update cases set status = 'in_progress' where id = $1 and status = 'open'", [caseId]);
  return summary.outcome;
}

/** Suspends the linked company from the case, with a reason that cites the case. */
export async function caseSuspend(actor: AdminActor, caseId: string, reasonInput: string): Promise<void> {
  const reason = requireText(reasonInput, "the reason for suspending", 1000);
  const companyId = await linkedCompany(caseId);
  await tx(async (client) => {
    await suspendCompany(actor, companyId, `${reason} (case ${caseId.slice(0, 8)})`, client);
    await client.query("update cases set status = case when status = 'open' then 'in_progress' else status end where id = $1", [caseId]);
    await audit({ actorType: "admin", actorId: actor.userId, companyId, action: "case.suspend_company", entity: "case", entityId: caseId, after: { reason }, ip: actor.ip ?? null }, client);
  });
}
