/**
 * Company administration (mover verification §3-§5; S7 must: verification queue, company detail,
 * approve, reject, suspend, reinstate, prices, profile description approval).
 *
 * Decisions run in one transaction each: the status change, its history row, the badge, prices,
 * profile state, the owner's email (outbox) and the audit_log row commit together.
 */
import { audit } from "../audit/audit";
import { getPool, isUniqueViolation, tx, type Queryable } from "../db/pool";
import { env } from "../env/env";
import { enqueueEmail } from "../outbox/outbox";
import { getCompanyEligibility, latestChecks, runAutomatedChecks, type AutomatedCheckSummary } from "../verification/run";
import { CHECK_LABELS, CHECK_TYPES, type CheckResult, type CheckType } from "../verification/types";
import { AdminError, cleanText, companyContactEmails, formatCents, recordStatusChange, requireText, type AdminActor, type CompanyStatus } from "./common";

/** A system actor (jobs) or an admin. */
export type DecisionActor = AdminActor | { system: string };

const isSystem = (actor: DecisionActor): actor is { system: string } => "system" in actor;
const actorFields = (actor: DecisionActor) =>
  isSystem(actor)
    ? { actorType: "system" as const, actorId: actor.system, ip: null, userId: null }
    : { actorType: "admin" as const, actorId: actor.userId, ip: actor.ip ?? null, userId: actor.userId };

/** Labels for the reason codes other slices store in companies.status_reason (free text shows as written). */
export const STATUS_REASON_LABELS: Record<string, string> = {
  broker_authority: "Broker authority on the FMCSA record (rejected automatically under the movers-only policy)",
  duplicate_usdot: "Another application or company uses this USDOT number",
};

export const statusReasonLabel = (reason: string | null): string | null => (reason ? (STATUS_REASON_LABELS[reason] ?? reason) : null);

/** Highest price an admin can set in one step ($5,000), a guard against typos. */
export const MAX_PRICE_CENTS = 500_000;

// ================================================================== lists

export interface CompanyListRow {
  id: string;
  legal_name: string;
  dba_name: string | null;
  status: CompanyStatus;
  usdot_number: string | null;
  mc_number: string | null;
  is_demo: boolean;
  billing_status: string;
  created_at: Date;
  approved_at: Date | null;
  updated_at: Date;
  public_status: string | null;
  slug: string | null;
  balance_cents: number;
}

export async function listCompanies(
  filters: { status?: string | null; q?: string | null; limit?: number; offset?: number } = {},
  db: Queryable = getPool(),
): Promise<{ rows: CompanyListRow[]; total: number }> {
  const where: string[] = [];
  const values: unknown[] = [];
  if (filters.status) {
    values.push(filters.status);
    where.push(`c.status = $${values.length}`);
  }
  if (filters.q) {
    values.push(`%${filters.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    where.push(`(c.legal_name ilike $${values.length} or c.dba_name ilike $${values.length} or c.usdot_number ilike $${values.length} or c.mc_number ilike $${values.length})`);
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const total = await db.query<{ n: number }>(`select count(*)::int as n from companies c ${clause}`, values);
  values.push(filters.limit ?? 50, filters.offset ?? 0);
  const rows = await db.query<CompanyListRow>(
    `select c.id, c.legal_name, c.dba_name, c.status, c.usdot_number, c.mc_number, c.is_demo, c.billing_status, c.created_at,
            c.approved_at, c.updated_at, p.public_status, p.slug, coalesce(b.balance_cents, 0) as balance_cents
     from companies c
     left join company_profiles p on p.company_id = c.id
     left join company_credit_balance b on b.company_id = c.id
     ${clause}
     order by c.updated_at desc, c.legal_name
     limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  return { rows: rows.rows, total: total.rows[0]?.n ?? 0 };
}

export type QueueFlag = "broker_authority" | "identity_mismatch" | "insurance_missing" | "document_expiring" | "recent_changes";

export const QUEUE_FLAG_LABELS: Record<QueueFlag, string> = {
  broker_authority: "Broker or dual authority",
  identity_mismatch: "Name or address mismatch",
  insurance_missing: "Insurance missing",
  document_expiring: "Document expiring",
  recent_changes: "Recent record changes",
};

export type QueueStage = "application" | "verification" | "admin_review" | "recheck";

export const QUEUE_STAGE_LABELS: Record<QueueStage, string> = {
  application: "Application",
  verification: "Verification",
  admin_review: "Admin review",
  recheck: "Recheck (approved)",
};

export interface QueueRow {
  id: string;
  legal_name: string;
  usdot_number: string | null;
  mc_number: string | null;
  status: CompanyStatus;
  stage: QueueStage;
  submitted_at: Date;
  age_days: number;
  flags: QueueFlag[];
  pending_checks: CheckType[];
  failed_checks: CheckType[];
}

/**
 * Companies waiting for a reviewer: applications (applied, verifying, in review) and approved
 * companies whose latest check of some type failed or needs review (rechecks), with flags.
 */
export async function verificationQueue(filters: { stage?: string | null; flag?: string | null } = {}, db: Queryable = getPool()): Promise<QueueRow[]> {
  const found = await db.query<{
    id: string;
    legal_name: string;
    usdot_number: string | null;
    mc_number: string | null;
    status: CompanyStatus;
    has_broker_authority: boolean;
    created_at: Date;
    checks: Record<string, CheckResult> | null;
    expiring: boolean;
  }>(
    `select c.id, c.legal_name, c.usdot_number, c.mc_number, c.status, c.has_broker_authority, c.created_at,
            (select jsonb_object_agg(l.check_type, l.result) from (
               select distinct on (check_type) check_type, result from verification_checks v
               where v.company_id = c.id order by check_type, created_at desc, retrieved_at desc) l) as checks,
            exists (select 1 from credentials cr where cr.company_id = c.id and cr.expires_on is not null
                    and cr.status in ('verified', 'pending') and cr.expires_on <= current_date + 30) as expiring
     from companies c
     where c.status in ('applied', 'verifying', 'in_review')
        or (c.status = 'approved' and exists (
              select 1 from (select distinct on (check_type) result from verification_checks v
                             where v.company_id = c.id order by check_type, created_at desc, retrieved_at desc) x
              where x.result <> 'pass'))
     order by c.created_at`,
  );
  const rows: QueueRow[] = found.rows.map((row) => {
    const checks = row.checks ?? {};
    const flags: QueueFlag[] = [];
    if (row.has_broker_authority || checks.authority_type === "fail") flags.push("broker_authority");
    if (checks.identity_match && checks.identity_match !== "pass") flags.push("identity_mismatch");
    if (checks.insurance_filings === "fail" || checks.insurance_certificate === "fail" || (row.status !== "applied" && !checks.insurance_certificate)) {
      flags.push("insurance_missing");
    }
    if (row.expiring) flags.push("document_expiring");
    if (checks.recent_record_changes && checks.recent_record_changes !== "pass") flags.push("recent_changes");
    const stage: QueueStage =
      row.status === "approved" ? "recheck" : row.status === "applied" ? "application" : row.status === "verifying" ? "verification" : "admin_review";
    return {
      id: row.id,
      legal_name: row.legal_name,
      usdot_number: row.usdot_number,
      mc_number: row.mc_number,
      status: row.status,
      stage,
      submitted_at: row.created_at,
      age_days: Math.max(0, Math.floor((Date.now() - row.created_at.getTime()) / 86_400_000)),
      flags,
      pending_checks: CHECK_TYPES.filter((t) => checks[t] !== "pass" && checks[t] !== "fail"),
      failed_checks: CHECK_TYPES.filter((t) => checks[t] === "fail"),
    };
  });
  return rows.filter((r) => (!filters.stage || r.stage === filters.stage) && (!filters.flag || r.flags.includes(filters.flag as QueueFlag)));
}

// ================================================================== detail

export type CheckRow = {
  id: string;
  check_type: CheckType;
  source: string;
  source_url: string | null;
  payload_snapshot: Record<string, unknown> | null;
  payload_sha256: string | null;
  result: CheckResult;
  reviewer_id: string | null;
  reviewer_email: string | null;
  decision_note: string | null;
  retrieved_at: Date;
  created_at: Date;
};

/** A short, contact-free summary of a check's payload for reviewers. */
export function summarizePayload(payload: Record<string, unknown> | null): string[] {
  if (!payload) return [];
  const lines: string[] = [];
  const str = (v: unknown) => (v === null || v === undefined ? "unknown" : typeof v === "object" ? JSON.stringify(v) : String(v));
  const pick = (key: string, label: string) => {
    if (key in payload) lines.push(`${label}: ${str(payload[key])}`);
  };
  pick("lookup", "Lookup");
  pick("reason", "Reason");
  pick("legal_name", "Name on record");
  pick("dba_name", "DBA on record");
  pick("usdot_status", "USDOT status");
  pick("out_of_service", "Out of service");
  if (payload.physical_address && typeof payload.physical_address === "object") {
    const a = payload.physical_address as Record<string, unknown>;
    lines.push(`Address on record: ${[a.line1, a.city, a.state, a.zip].filter(Boolean).join(", ")}`);
  }
  pick("phone_on_record", "Phone on record");
  if (Array.isArray(payload.authorities)) {
    const list = (payload.authorities as Record<string, unknown>[]).map((a) => `${a.docket} ${a.type} ${a.scope} ${a.status}`).join("; ");
    lines.push(`Authorities: ${list || "none"}`);
  }
  if (Array.isArray(payload.dockets)) lines.push(`Dockets: ${(payload.dockets as unknown[]).map(str).join("; ")}`);
  if (payload.insurance && typeof payload.insurance === "object") {
    const i = payload.insurance as Record<string, unknown>;
    lines.push(`Insurance on file: BI&PD ${str(i.bipdOnFile)}, cargo ${str(i.cargoOnFile)}, bond ${str(i.bondOnFile)}`);
  }
  pick("bipd_on_file", "BI&PD on file");
  pick("cargo_on_file", "Cargo on file");
  pick("recent_changes", "Recent changes");
  pick("changes_last_90_days", "Changes in the last 90 days");
  pick("name_score", "Name similarity");
  pick("name_match", "Name match");
  pick("address_match", "Address match");
  pick("docket_match", "MC number on record");
  pick("record_name", "Name on record");
  pick("application_name", "Name on application");
  pick("record_address", "Address on record");
  pick("credential_number", "Credential number");
  pick("credential_status", "Credential status");
  pick("named_insured", "Named insured");
  pick("expires_in_days", "Expires in (days)");
  pick("outcome", "Outcome");
  pick("phone_called", "Phone called");
  pick("decision_on", "Decision on check");
  return lines;
}

export async function getCompany(companyId: string, db: Queryable = getPool()) {
  const found = await db.query<{
    id: string;
    legal_name: string;
    dba_name: string | null;
    status: CompanyStatus;
    usdot_number: string | null;
    mc_number: string | null;
    has_broker_authority: boolean;
    credentials_valid_until: Date | null;
    coverage_version: number;
    address_line1: string | null;
    address_line2: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip: string | null;
    phone: string | null;
    website: string | null;
    billing_status: string;
    is_demo: boolean;
    approved_at: Date | null;
    suspended_at: Date | null;
    status_reason: string | null;
    created_at: Date;
    updated_at: Date;
    balance_cents: number;
  }>(
    `select c.id, c.legal_name, c.dba_name, c.status, c.usdot_number, c.mc_number, c.has_broker_authority, c.credentials_valid_until,
            c.coverage_version, c.address_line1, c.address_line2, c.address_city, c.address_state, c.address_zip, c.phone, c.website,
            c.billing_status, c.is_demo, c.approved_at, c.suspended_at, c.status_reason, c.created_at, c.updated_at,
            coalesce(b.balance_cents, 0) as balance_cents
     from companies c left join company_credit_balance b on b.company_id = c.id where c.id = $1`,
    [companyId],
  );
  return found.rows[0] ?? null;
}

/** Everything the company detail tabs show. Contact data of consumers is not included. */
export async function getCompanyDetail(companyId: string, db: Queryable = getPool()) {
  const company = await getCompany(companyId, db);
  if (!company) return null;
  const q = <R extends Record<string, unknown>>(text: string) => db.query<R>(text, [companyId]).then((r) => r.rows);
  const [profile, capabilities, members, invitations, rules, locations, prices, rateCards, ledger, purchases, checks, credentials, authorities, badges, history, auditRows, messages] =
    await Promise.all([
      q<{ slug: string; display_name: string; description: string | null; logo_url: string | null; website: string | null; public_status: string; network_joined_at: Date | null; description_status: string; description_reviewed_at: Date | null; description_rejection_reason: string | null; updated_at: Date }>(
        `select slug, display_name, description, logo_url, website, public_status, network_joined_at, description_status,
                description_reviewed_at, description_rejection_reason, updated_at from company_profiles where company_id = $1`,
      ),
      q<{ move_types: string[]; move_sizes: string[]; services: string[] }>("select move_types, move_sizes, services from company_capabilities where company_id = $1"),
      q<{ id: string; email: string; full_name: string | null; role: string; status: string; can_purchase: boolean; created_at: Date; mfa_enabled_at: Date | null; last_login_at: Date | null }>(
        `select m.id, u.email, u.full_name, m.role, m.status, m.can_purchase, m.created_at, u.mfa_enabled_at, u.last_login_at
         from company_memberships m join users u on u.id = m.user_id where m.company_id = $1 order by m.created_at`,
      ),
      q<{ id: string; email: string; role: string; expires_at: Date; accepted_at: Date | null; revoked_at: Date | null; created_at: Date }>(
        "select id, email, role, expires_at, accepted_at, revoked_at, created_at from invitations where company_id = $1 order by created_at desc limit 20",
      ),
      q<{ id: string; kind: string; label: string | null; move_types: string[]; move_sizes: string[]; services: string[]; paused: boolean; updated_at: Date }>(
        "select id, kind, label, move_types, move_sizes, services, paused, updated_at from coverage_rules where company_id = $1 order by created_at",
      ),
      q<{ rule_id: string; side: string; level: string; value: string }>(
        "select l.rule_id, l.side, l.level, l.value from coverage_rule_locations l join coverage_rules r on r.id = l.rule_id where r.company_id = $1 order by l.side, l.level, l.value",
      ),
      q<{ id: string; exclusive_cents: number; shared_cents: number; effective_from: Date; set_by: string; set_by_email: string | null }>(
        `select p.id::text, p.exclusive_cents, p.shared_cents, p.effective_from, p.set_by, u.email as set_by_email
         from company_prices p left join users u on u.id::text = p.set_by
         where p.company_id = $1 order by p.effective_from desc, p.id desc`,
      ),
      q<{ id: string; states: string[]; status: string; created_at: Date; local: unknown; long_distance: unknown }>(
        "select id, states, status, created_at, local, long_distance from rate_cards where company_id = $1 order by created_at desc",
      ),
      q<{ id: string; kind: string; amount_cents: number; purchase_id: string | null; source_purchase_id: string | null; note: string | null; created_at: Date }>(
        "select id::text, kind, amount_cents, purchase_id, source_purchase_id, note, created_at from ledger_entries where company_id = $1 order by created_at desc, id desc limit 200",
      ),
      q<{ id: string; group_id: string; reference_code: string | null; lead_type: string; position: number; list_price_cents: number; charged_cents: number; refunded_at: Date | null; created_at: Date; payment_ref: string | null }>(
        `select p.id, p.group_id, (select l.reference_code from leads l where l.group_id = p.group_id and l.is_primary order by l.created_at limit 1) as reference_code,
                p.lead_type, p.position, p.list_price_cents, p.charged_cents, p.refunded_at, p.created_at, a.payment_ref
         from purchases p join purchase_attempts a on a.id = p.attempt_id where p.company_id = $1 order by p.created_at desc limit 200`,
      ),
      q<CheckRow>(
        `select v.id, v.check_type, v.source, v.source_url, v.payload_snapshot, v.payload_sha256, v.result, v.reviewer_id, u.email as reviewer_email,
                v.decision_note, v.retrieved_at, v.created_at
         from verification_checks v left join users u on u.id = v.reviewer_id where v.company_id = $1 order by v.created_at desc, v.retrieved_at desc`,
      ),
      q<{ id: string; credential_type: string; number: string | null; state: string | null; issuer: string | null; status: string; issued_on: Date | null; expires_on: Date | null; verified_at: Date | null; source_url: string | null }>(
        "select id, credential_type, number, state, issuer, status, issued_on, expires_on, verified_at, source_url from credentials where company_id = $1 order by credential_type, created_at desc",
      ),
      q<{ docket_number: string; authority_type: string; scope: string; status: string; effective_from: Date | null; created_at: Date }>(
        `select distinct on (docket_number, authority_type) docket_number, authority_type, scope, status, effective_from, created_at
         from authority_records where company_id = $1 order by docket_number, authority_type, created_at desc`,
      ),
      q<{ id: string; badge_type: string; issued_at: Date; revoked_at: Date | null; reason: string | null; evidence_check_ids: string[] }>(
        "select id, badge_type, issued_at, revoked_at, reason, evidence_check_ids from badges where company_id = $1 order by issued_at desc",
      ),
      q<{ id: string; from_status: string | null; to_status: string; reason: string | null; changed_by_email: string | null; created_at: Date }>(
        `select h.id::text, h.from_status, h.to_status, h.reason, u.email as changed_by_email, h.created_at
         from company_status_history h left join users u on u.id = h.changed_by where h.company_id = $1 order by h.created_at desc, h.id desc`,
      ),
      q<{ id: string; actor_type: string; actor_id: string | null; actor_email: string | null; action: string; entity: string; entity_id: string | null; before: unknown; after: unknown; created_at: Date }>(
        `select a.id::text, a.actor_type, a.actor_id, u.email as actor_email, a.action, a.entity, a.entity_id, a.before, a.after, a.created_at
         from audit_log a left join users u on u.id::text = a.actor_id
         where a.company_id = $1 or (a.entity = 'company' and a.entity_id = $1::text) order by a.created_at desc, a.id desc limit 200`,
      ),
      q<{ id: string; template: string; subject: string | null; status: string; created_at: Date }>(
        `select m.id, m.template, m.subject, m.status, m.created_at from messages m
         where m.related_type = 'company' and m.related_id = $1 order by m.created_at desc limit 50`,
      ),
    ]);
  const [application, terms] = await Promise.all([
    q<{ data: Record<string, unknown>; completed_steps: string[]; submitted_at: Date | null; submission_count: number; updated_at: Date }>(
      "select data, completed_steps, submitted_at, submission_count, updated_at from company_applications where company_id = $1",
    ),
    q<{ id: string; terms_version: string; terms_sha256: string; representative_name: string; representative_title: string; representative_email: string; representative_phone: string | null; authority_attested: boolean; ip: string | null; accepted_at: Date; user_email: string | null }>(
      `select t.id, t.terms_version, t.terms_sha256, t.representative_name, t.representative_title, t.representative_email, t.representative_phone,
              t.authority_attested, t.ip, t.accepted_at, u.email as user_email
       from mover_terms_acceptances t left join users u on u.id = t.user_id where t.company_id = $1 order by t.accepted_at desc`,
    ),
  ]);
  const latest = await latestChecks(companyId, db);
  const eligibility = await getCompanyEligibility(companyId, db);
  return {
    company,
    profile: profile[0] ?? null,
    capabilities: capabilities[0] ?? null,
    members,
    invitations,
    coverage: rules.map((r) => ({ ...r, locations: locations.filter((l) => l.rule_id === r.id) })),
    prices,
    rateCards,
    ledger,
    purchases,
    checks,
    latest,
    credentials,
    authorities,
    badges,
    history,
    audit: auditRows,
    messages,
    eligibility,
    application: application[0] ?? null,
    termsAcceptances: terms,
    officialPhone: officialPhoneFrom(checks),
  };
}

/** The phone number on the official (FMCSA) record, from the newest check payload that has one. */
export function officialPhoneFrom(checks: Pick<CheckRow, "source" | "payload_snapshot">[]): string | null {
  for (const check of checks) {
    if (check.source === "manual") continue;
    const phone = check.payload_snapshot?.phone_on_record;
    if (typeof phone === "string" && phone) return phone;
  }
  return null;
}

// ================================================================== checks

/** Re-runs the automated FMCSA checks (runAutomatedChecks audits the run). */
export async function rerunChecks(actor: AdminActor, companyId: string): Promise<AutomatedCheckSummary> {
  const company = await getCompany(companyId);
  if (!company) throw new AdminError("Company not found.", "not_found");
  return runAutomatedChecks(companyId, { actor: { userId: actor.userId }, ip: actor.ip ?? null });
}

const DECISION_RESULTS: readonly CheckResult[] = ["pass", "fail", "needs_review"];

/**
 * A reviewer decision on one check: a new append-only verification_checks row (source "manual")
 * with the reviewer and a required note. The newest row of a type is the one that counts.
 */
export async function recordCheckDecision(
  actor: AdminActor,
  companyId: string,
  input: { checkType: string; result: string; note: string; evidence?: Record<string, unknown> },
): Promise<string> {
  if (!(CHECK_TYPES as readonly string[]).includes(input.checkType)) throw new AdminError("Choose a check.");
  if (!DECISION_RESULTS.includes(input.result as CheckResult)) throw new AdminError("Choose a result.");
  const note = requireText(input.note, "a reviewer note explaining the decision");
  const checkType = input.checkType as CheckType;
  return tx(async (client) => {
    const company = await client.query<{ id: string }>("select id from companies where id = $1 for update", [companyId]);
    if (!company.rowCount) throw new AdminError("Company not found.", "not_found");
    const latest = (await latestChecks(companyId, client)).get(checkType);
    const payload = { decision_on: latest?.id ?? null, previous_result: latest?.result ?? null, ...(input.evidence ?? {}) };
    const row = await client.query<{ id: string }>(
      `insert into verification_checks (company_id, check_type, source, source_url, payload_snapshot, payload_sha256, result, reviewer_id, decision_note)
       values ($1, $2, 'manual', $3, $4::jsonb, encode(sha256(convert_to($4::text, 'UTF8')), 'hex'), $5, $6, $7) returning id`,
      [companyId, checkType, latest?.sourceUrl ?? null, JSON.stringify(payload), input.result, actor.userId, note],
    );
    const id = row.rows[0]!.id;
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId,
        action: "verification.check_decision",
        entity: "verification_check",
        entityId: id,
        before: latest ? { result: latest.result, check_id: latest.id } : null,
        after: { check_type: checkType, result: input.result, note },
        ip: actor.ip ?? null,
      },
      client,
    );
    return id;
  });
}

/**
 * Callback verification (mover verification §3): the reviewer called the phone number on the
 * official record (not the one the company supplied) and records what happened.
 */
export async function recordCallback(actor: AdminActor, companyId: string, input: { confirmed: boolean; note: string }): Promise<string> {
  const detailChecks = await getPool().query<Pick<CheckRow, "source" | "payload_snapshot">>(
    "select source, payload_snapshot from verification_checks where company_id = $1 order by created_at desc, retrieved_at desc",
    [companyId],
  );
  const phone = officialPhoneFrom(detailChecks.rows);
  if (!phone) throw new AdminError("There is no phone number from the official record yet. Re-run the automated checks first.", "no_official_phone");
  return recordCheckDecision(actor, companyId, {
    checkType: "callback_verification",
    result: input.confirmed ? "pass" : "fail",
    note: input.note,
    evidence: { phone_called: phone, phone_source: "official_record", outcome: input.confirmed ? "confirmed_application" : "not_confirmed", called_at: new Date().toISOString() },
  });
}

// ================================================================== decisions

async function lockCompany(db: Queryable, companyId: string) {
  const found = await db.query<{ id: string; legal_name: string; dba_name: string | null; status: CompanyStatus }>(
    "select id, legal_name, dba_name, status from companies where id = $1 for update",
    [companyId],
  );
  const company = found.rows[0];
  if (!company) throw new AdminError("Company not found.", "not_found");
  return company;
}

function validatePrices(exclusiveCents: number, sharedCents: number): void {
  for (const [label, cents] of [["exclusive", exclusiveCents], ["shared", sharedCents]] as const) {
    if (!Number.isInteger(cents) || cents < 100) throw new AdminError(`Enter the ${label} price: at least $1.00.`, "invalid_price");
    if (cents > MAX_PRICE_CENTS) throw new AdminError(`The ${label} price can't be more than ${formatCents(MAX_PRICE_CENTS)}.`, "invalid_price");
  }
}

async function insertPrice(db: Queryable, companyId: string, exclusiveCents: number, sharedCents: number, setBy: string): Promise<string> {
  const row = await db.query<{ id: string }>(
    "insert into company_prices (company_id, exclusive_cents, shared_cents, set_by) values ($1, $2, $3, $4) returning id::text",
    [companyId, exclusiveCents, sharedCents, setBy],
  );
  return row.rows[0]!.id;
}

/** Issues the Preferred Mover badge from the latest passing check of every type. */
async function issueBadge(db: Queryable, companyId: string): Promise<string> {
  const active = await db.query<{ id: string }>("select id from badges where company_id = $1 and badge_type = 'preferred_mover' and revoked_at is null", [companyId]);
  if (active.rows[0]) return active.rows[0].id;
  const latest = await latestChecks(companyId, db);
  const evidence = CHECK_TYPES.map((t) => latest.get(t)).filter((c) => c?.result === "pass").map((c) => c!.id);
  if (evidence.length !== CHECK_TYPES.length) throw new AdminError("Every check must pass before the badge can be issued.", "checks_pending");
  const row = await db.query<{ id: string }>(
    "insert into badges (company_id, badge_type, evidence_check_ids) values ($1, 'preferred_mover', $2::uuid[]) returning id",
    [companyId, evidence],
  );
  return row.rows[0]!.id;
}

const slugify = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "mover";

/** Makes the profile live (when its description is approved or empty) and sets network_joined_at. */
async function publishProfile(db: Queryable, company: { id: string; legal_name: string; dba_name: string | null }, approveDescription: boolean, actorUserId: string | null) {
  let profile = (await db.query<{ description: string | null; description_status: string }>("select description, description_status from company_profiles where company_id = $1 for update", [company.id])).rows[0];
  if (!profile) {
    const display = company.dba_name || company.legal_name;
    const base = slugify(display);
    const taken = await db.query<{ slug: string }>("select slug from company_profiles where slug = $1 or slug like $1 || '-%'", [base]);
    const used = new Set(taken.rows.map((r) => r.slug));
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    await db.query("insert into company_profiles (company_id, slug, display_name, public_status) values ($1, $2, $3, 'hidden')", [company.id, slug, display]);
    profile = { description: null, description_status: "pending" };
  }
  if (approveDescription && profile.description && profile.description_status !== "approved") {
    await db.query(
      "update company_profiles set description_status = 'approved', description_reviewed_at = now(), description_reviewed_by = $2, description_rejection_reason = null where company_id = $1",
      [company.id, actorUserId],
    );
    profile.description_status = "approved";
  }
  const live = !profile.description || profile.description_status === "approved";
  const updated = await db.query<{ public_status: string }>(
    "update company_profiles set public_status = $2, network_joined_at = coalesce(network_joined_at, now()) where company_id = $1 returning public_status",
    [company.id, live ? "live" : "hidden"],
  );
  return updated.rows[0]!.public_status;
}

async function notifyCompany(db: Queryable, companyId: string, template: string, subject: string, lines: string[]): Promise<void> {
  const body = [...lines, "", `Company portal: ${env().APP_URL}/portal`, "", "American Moving Choice"].join("\n");
  for (const to of await companyContactEmails(db, companyId)) {
    await enqueueEmail({ to, template, subject, bodyText: body, relatedType: "company", relatedId: companyId }, db);
  }
}

export interface ApproveInput {
  exclusiveCents: number;
  sharedCents: number;
  /** Approve the profile description in the same decision (shown to the admin before approving). */
  approveDescription: boolean;
  note?: string | null;
}

/**
 * Approves a company (mover verification §3-§4): every check must pass and nothing may block.
 * Sets approved and approved_at, appends the starting prices, makes the profile live (when its
 * description is approved) with network_joined_at, issues the badge with its evidence check IDs,
 * emails the owner and audits.
 */
export async function approveCompany(actor: AdminActor, companyId: string, input: ApproveInput): Promise<{ badgeId: string; priceId: string; publicStatus: string }> {
  validatePrices(input.exclusiveCents, input.sharedCents);
  const note = cleanText(input.note, 1000);
  try {
    return await tx(async (client) => {
      const company = await lockCompany(client, companyId);
      if (!["applied", "verifying", "in_review"].includes(company.status)) {
        throw new AdminError(`Only an application can be approved; this company is ${company.status.replace("_", " ")}.`, "bad_status");
      }
      const eligibility = await getCompanyEligibility(companyId, client);
      if (!eligibility.approvable) {
        const reasons = [...eligibility.blockers, ...eligibility.pending.map((t) => `Waiting for a decision: ${CHECK_LABELS[t]}.`)];
        throw new AdminError(`This company can't be approved yet. ${reasons.join(" ")}`, "not_approvable");
      }
      await client.query("update companies set status = 'approved', approved_at = now(), suspended_at = null, status_reason = null where id = $1", [companyId]);
      await recordStatusChange(client, { companyId, from: company.status, to: "approved", reason: note ?? "All verification checks passed.", changedBy: actor.userId });
      const priceId = await insertPrice(client, companyId, input.exclusiveCents, input.sharedCents, actor.userId);
      const publicStatus = await publishProfile(client, company, input.approveDescription, actor.userId);
      const badgeId = await issueBadge(client, companyId);
      await notifyCompany(client, companyId, "company_approved", "Your company is approved on American Moving Choice", [
        `${company.legal_name} passed our verification and is now part of the American Moving Choice network.`,
        "",
        `Your starting lead prices: exclusive ${formatCents(input.exclusiveCents)}, shared ${formatCents(input.sharedCents)} (before the sharing step-down).`,
        publicStatus === "live" ? "Your public profile is live." : "Your public profile goes live once its description is approved.",
      ]);
      await audit(
        {
          actorType: "admin",
          actorId: actor.userId,
          companyId,
          action: "company.approve",
          entity: "company",
          entityId: companyId,
          before: { status: company.status },
          after: { status: "approved", exclusive_cents: input.exclusiveCents, shared_cents: input.sharedCents, price_id: priceId, badge_id: badgeId, public_status: publicStatus, note },
          ip: actor.ip ?? null,
        },
        client,
      );
      return { badgeId, priceId, publicStatus };
    });
  } catch (error) {
    if (isUniqueViolation(error, "companies_one_approved_per_usdot")) {
      throw new AdminError("Another approved company already uses this USDOT number.", "duplicate_usdot");
    }
    throw error;
  }
}

/** Rejects an application with a reason the owner receives. */
export async function rejectCompany(actor: AdminActor, companyId: string, reasonInput: string): Promise<void> {
  const reason = requireText(reasonInput, "the reason for rejecting", 1000);
  await tx(async (client) => {
    const company = await lockCompany(client, companyId);
    if (!["applied", "verifying", "in_review"].includes(company.status)) {
      throw new AdminError(`Only an application can be rejected; this company is ${company.status.replace("_", " ")}.`, "bad_status");
    }
    await client.query("update companies set status = 'rejected', status_reason = $2 where id = $1", [companyId, reason]);
    await client.query("update company_profiles set public_status = 'hidden' where company_id = $1", [companyId]);
    await recordStatusChange(client, { companyId, from: company.status, to: "rejected", reason, changedBy: actor.userId });
    await notifyCompany(client, companyId, "company_rejected", "Your American Moving Choice application", [
      `We could not approve ${company.legal_name} for the American Moving Choice network.`,
      "",
      `Reason: ${reason}`,
      "",
      "You can apply again once the reason above is resolved. Reply to this email if you think we made a mistake.",
    ]);
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId, action: "company.reject", entity: "company", entityId: companyId, before: { status: company.status }, after: { status: "rejected", reason }, ip: actor.ip ?? null },
      client,
    );
  });
}

/**
 * Suspends an approved company: purchases stop (company_can_purchase), the badge is revoked, the
 * profile shows "Verification under review", and the owner is told why. Purchased leads, CRM
 * history and invoices stay available (mover verification §3).
 */
export async function suspendCompany(actor: DecisionActor, companyId: string, reasonInput: string, db?: Queryable): Promise<void> {
  const reason = requireText(reasonInput, "the reason for suspending", 1000);
  const a = actorFields(actor);
  const run = async (client: Queryable) => {
    const company = await lockCompany(client, companyId);
    if (company.status !== "approved") throw new AdminError("Only an approved company can be suspended.", "bad_status");
    await client.query("update companies set status = 'suspended', suspended_at = now(), status_reason = $2 where id = $1", [companyId, reason]);
    const revoked = await client.query<{ id: string }>(
      "update badges set revoked_at = now(), reason = $2 where company_id = $1 and revoked_at is null returning id",
      [companyId, `Suspended: ${reason}`],
    );
    await client.query("update company_profiles set public_status = 'under_review' where company_id = $1 and public_status = 'live'", [companyId]);
    await recordStatusChange(client, { companyId, from: "approved", to: "suspended", reason, changedBy: a.userId });
    await notifyCompany(client, companyId, "company_suspended", "Your company is suspended on American Moving Choice", [
      `${company.legal_name} is suspended from buying new requests, and its Preferred Mover badge is paused.`,
      "",
      `Reason: ${reason}`,
      "",
      "Your purchased requests, CRM history and invoices stay available in the portal. Contact us to resolve this and be re-verified.",
    ]);
    await audit(
      {
        actorType: a.actorType,
        actorId: a.actorId,
        companyId,
        action: "company.suspend",
        entity: "company",
        entityId: companyId,
        before: { status: "approved" },
        after: { status: "suspended", reason, revoked_badges: revoked.rows.map((r) => r.id) },
        ip: a.ip,
      },
      client,
    );
  };
  if (db) await run(db);
  else await tx(run);
}

/** Reinstates a suspended company after re-verification: every check must pass again; the badge is reissued. */
export async function reinstateCompany(actor: AdminActor, companyId: string, reasonInput: string): Promise<{ badgeId: string }> {
  const reason = requireText(reasonInput, "the reason for reinstating", 1000);
  return tx(async (client) => {
    const company = await lockCompany(client, companyId);
    if (company.status !== "suspended") throw new AdminError("Only a suspended company can be reinstated.", "bad_status");
    const eligibility = await getCompanyEligibility(companyId, client);
    if (!eligibility.approvable) {
      const reasons = [...eligibility.blockers, ...eligibility.pending.map((t) => `Waiting for a decision: ${CHECK_LABELS[t]}.`)];
      throw new AdminError(`Re-verify the company before reinstating it. ${reasons.join(" ")}`, "not_approvable");
    }
    await client.query("update companies set status = 'approved', suspended_at = null, status_reason = null where id = $1", [companyId]);
    const publicStatus = await publishProfile(client, company, false, actor.userId);
    const badgeId = await issueBadge(client, companyId);
    await client.query("update credential_alerts set resolved_at = now() where company_id = $1 and resolved_at is null and alert_type = 'failed_recheck'", [companyId]);
    await recordStatusChange(client, { companyId, from: "suspended", to: "approved", reason, changedBy: actor.userId });
    await notifyCompany(client, companyId, "company_reinstated", "Your company is reinstated on American Moving Choice", [
      `${company.legal_name} passed re-verification. It can buy requests again and its Preferred Mover badge is back.`,
    ]);
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId, action: "company.reinstate", entity: "company", entityId: companyId, before: { status: "suspended" }, after: { status: "approved", reason, badge_id: badgeId, public_status: publicStatus }, ip: actor.ip ?? null },
      client,
    );
    return { badgeId };
  });
}

/** Appends a new price row (company_prices is an append-only history). */
export async function setCompanyPrice(actor: AdminActor, companyId: string, input: { exclusiveCents: number; sharedCents: number; note?: string | null }): Promise<string> {
  validatePrices(input.exclusiveCents, input.sharedCents);
  const note = cleanText(input.note, 500);
  return tx(async (client) => {
    await lockCompany(client, companyId);
    const before = await client.query<{ exclusive_cents: number; shared_cents: number }>("select exclusive_cents, shared_cents from current_price($1) where id is not null", [companyId]);
    const priceId = await insertPrice(client, companyId, input.exclusiveCents, input.sharedCents, actor.userId);
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId,
        action: "company.price_set",
        entity: "company_price",
        entityId: priceId,
        before: before.rows[0] ?? null,
        after: { exclusive_cents: input.exclusiveCents, shared_cents: input.sharedCents, note },
        ip: actor.ip ?? null,
      },
      client,
    );
    return priceId;
  });
}

/** Approves or rejects the company-written profile description. */
export async function reviewProfileDescription(actor: AdminActor, companyId: string, input: { approve: boolean; reason?: string | null }): Promise<string> {
  const reason = input.approve ? null : requireText(input.reason, "the reason the description can't be published", 1000);
  return tx(async (client) => {
    const company = await lockCompany(client, companyId);
    const profile = (await client.query<{ description: string | null; description_status: string; public_status: string }>(
      "select description, description_status, public_status from company_profiles where company_id = $1 for update",
      [companyId],
    )).rows[0];
    if (!profile) throw new AdminError("This company has no profile yet.", "no_profile");
    if (!profile.description) throw new AdminError("The profile has no description to review.", "no_description");
    const status = input.approve ? "approved" : "rejected";
    // Live only for approved companies with an approved description; a rejected description hides the profile text.
    const publicStatus = company.status === "approved" ? (input.approve ? "live" : "hidden") : profile.public_status;
    await client.query(
      `update company_profiles set description_status = $2, description_reviewed_at = now(), description_reviewed_by = $3,
         description_rejection_reason = $4, public_status = $5 where company_id = $1`,
      [companyId, status, actor.userId, reason, publicStatus],
    );
    await client.query("insert into moderation_actions (target_type, target_id, action, reason, moderator_id) values ('company_profile', $1, $2, $3, $4)", [
      companyId,
      input.approve ? "approve_description" : "reject_description",
      reason,
      actor.userId,
    ]);
    if (!input.approve) {
      await notifyCompany(client, companyId, "profile_description_rejected", "Your profile description needs changes", [
        `The description on ${company.legal_name}'s profile can't be published as written.`,
        "",
        `Reason: ${reason}`,
        "",
        "Edit the description in the portal and it will be reviewed again.",
      ]);
    }
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId,
        action: input.approve ? "profile.description_approve" : "profile.description_reject",
        entity: "company_profile",
        entityId: companyId,
        before: { description_status: profile.description_status, public_status: profile.public_status },
        after: { description_status: status, public_status: publicStatus, reason },
        ip: actor.ip ?? null,
      },
      client,
    );
    return publicStatus;
  });
}
