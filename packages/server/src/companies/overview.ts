/**
 * Read models for the portal dashboard and the verification page. Every function resolves the
 * actor's membership from the database first.
 */
import type { CompanyRole } from "../auth/invitations";
import type { CompanyStatus } from "../auth/context";
import { getPool } from "../db/pool";
import { latestChecks, fmcsaSnapshotUrl } from "../verification/run";
import { CHECK_TYPES, type CheckResult, type CheckType } from "../verification/types";
import { loadActor } from "./actor";
import { REQUIRED_STEPS, nextIncompleteStep, type ApplicationStep } from "./application-schema";
import { COMPANY_MANAGERS, type Actor } from "./permissions";
import { CHECK_COPY, sourceLabel } from "./verification-copy";

export interface StatusEvent {
  fromStatus: CompanyStatus | null;
  toStatus: CompanyStatus;
  reason: string | null;
  at: Date;
}

export interface ExpiringCredential {
  id: string;
  type: "state_license" | "insurance_coi" | "usdot" | "docket" | "insurance_filing";
  label: string;
  expiresOn: string;
  expired: boolean;
}

export interface DashboardData {
  role: CompanyRole;
  company: { id: string; legalName: string; status: CompanyStatus; usdot: string | null; mc: string | null; approvedAt: Date | null };
  history: StatusEvent[];
  application: { completed: number; total: number; nextStep: ApplicationStep; submittedAt: Date | null };
  /** Present once approved (or suspended, for context). */
  stats: { availableRequests: number; purchasesThisMonth: number; spentThisMonthCents: number; creditBalanceCents: number } | null;
  expiringCredentials: ExpiringCredential[];
  canPurchase: boolean;
}

const CREDENTIAL_LABELS: Record<ExpiringCredential["type"], string> = {
  state_license: "State credential",
  insurance_coi: "Insurance certificate",
  usdot: "USDOT registration",
  docket: "Operating authority",
  insurance_filing: "Insurance filing",
};

/** Credentials expiring within this many days are listed on the dashboard. */
export const EXPIRY_WARNING_DAYS = 30;

export async function getDashboard(actor: Actor): Promise<DashboardData> {
  const member = await loadActor(actor);
  const db = getPool();
  const company = (
    await db.query<{ id: string; legal_name: string; status: CompanyStatus; usdot_number: string | null; mc_number: string | null; approved_at: Date | null; can_purchase: boolean }>(
      `select c.id, c.legal_name, c.status, c.usdot_number, c.mc_number, c.approved_at, company_can_purchase(c) as can_purchase
       from companies c where c.id = $1`,
      [actor.companyId],
    )
  ).rows[0];
  if (!company) throw new Error("company_not_found");

  const history = await db.query<{ from_status: CompanyStatus | null; to_status: CompanyStatus; reason: string | null; created_at: Date }>(
    "select from_status, to_status, reason, created_at from company_status_history where company_id = $1 order by created_at, id",
    [actor.companyId],
  );
  const app = (
    await db.query<{ completed_steps: string[]; submitted_at: Date | null }>(
      "select completed_steps, submitted_at from company_applications where company_id = $1",
      [actor.companyId],
    )
  ).rows[0];
  const completed = (app?.completed_steps ?? []).filter((s) => (REQUIRED_STEPS as readonly string[]).includes(s));

  let stats: DashboardData["stats"] = null;
  if (company.status === "approved" || company.status === "suspended") {
    const row = (
      await db.query<{ available: number; purchases: number; spent: number; balance: number }>(
        `select
           (select count(*)::int from lead_eligibility e join lead_groups g on g.id = e.group_id
            where e.company_id = $1 and e.named_in_consent and g.status = 'available' and g.expires_at > now()
              and not exists (select 1 from purchases p where p.group_id = g.id and p.company_id = $1)) as available,
           (select count(*)::int from purchases p where p.company_id = $1 and p.created_at >= date_trunc('month', now())) as purchases,
           (select coalesce(sum(p.charged_cents), 0)::int from purchases p
            where p.company_id = $1 and p.created_at >= date_trunc('month', now()) and p.refunded_at is null) as spent,
           (select balance_cents from company_credit_balance where company_id = $1) as balance`,
        [actor.companyId],
      )
    ).rows[0]!;
    stats = { availableRequests: row.available, purchasesThisMonth: row.purchases, spentThisMonthCents: row.spent, creditBalanceCents: row.balance ?? 0 };
  }

  const expiring = await db.query<{ id: string; credential_type: ExpiringCredential["type"]; state: string | null; expires_on: string; expired: boolean }>(
    `select id, credential_type, state, to_char(expires_on, 'YYYY-MM-DD') as expires_on, expires_on < current_date as expired
     from credentials
     where company_id = $1 and expires_on is not null and status <> 'rejected' and expires_on <= current_date + $2::int
     order by expires_on`,
    [actor.companyId, EXPIRY_WARNING_DAYS],
  );

  return {
    role: member.role,
    company: {
      id: company.id,
      legalName: company.legal_name,
      status: company.status,
      usdot: company.usdot_number,
      mc: company.mc_number,
      approvedAt: company.approved_at,
    },
    history: history.rows.map((r) => ({ fromStatus: r.from_status, toStatus: r.to_status, reason: r.reason, at: r.created_at })),
    application: { completed: completed.length, total: REQUIRED_STEPS.length, nextStep: nextIncompleteStep(completed), submittedAt: app?.submitted_at ?? null },
    stats,
    expiringCredentials: expiring.rows.map((r) => ({
      id: r.id,
      type: r.credential_type,
      label: r.state ? `${CREDENTIAL_LABELS[r.credential_type]} (${r.state})` : CREDENTIAL_LABELS[r.credential_type],
      expiresOn: r.expires_on,
      expired: r.expired,
    })),
    canPurchase: company.can_purchase,
  };
}

export interface CheckView {
  checkType: CheckType;
  label: string;
  what: string;
  result: CheckResult | "not_run";
  meaning: string;
  source: string | null;
  /** Official record link (FMCSA SAFER) for FMCSA-backed checks. */
  officialUrl: string | null;
  checkedAt: Date | null;
}

export interface CredentialView {
  id: string;
  type: ExpiringCredential["type"];
  label: string;
  number: string | null;
  state: string | null;
  issuer: string | null;
  status: "pending" | "verified" | "rejected" | "expired";
  expiresOn: string | null;
  verifiedAt: Date | null;
}

export interface VerificationOverview {
  status: CompanyStatus;
  usdot: string | null;
  mc: string | null;
  snapshotUrl: string | null;
  checks: CheckView[];
  credentials: CredentialView[];
  lastAutomatedRun: Date | null;
}

const FMCSA_CHECKS: readonly CheckType[] = ["usdot_active", "identity_match", "authority_type", "authority_status", "insurance_filings", "recent_record_changes"];

/** Each check with its latest result, source, date and plain-language meaning (owners and managers). */
export async function getVerificationOverview(actor: Actor): Promise<VerificationOverview> {
  await loadActor(actor, COMPANY_MANAGERS);
  const db = getPool();
  const company = (
    await db.query<{ status: CompanyStatus; usdot_number: string | null; mc_number: string | null }>(
      "select status, usdot_number, mc_number from companies where id = $1",
      [actor.companyId],
    )
  ).rows[0];
  if (!company) throw new Error("company_not_found");
  const latest = await latestChecks(actor.companyId, db);
  const snapshotUrl = company.usdot_number ? fmcsaSnapshotUrl(company.usdot_number) : null;
  const checks = CHECK_TYPES.map((type): CheckView => {
    const found = latest.get(type);
    const copy = CHECK_COPY[type];
    const result = found?.result ?? "not_run";
    return {
      checkType: type,
      label: copy.label,
      what: copy.what,
      result,
      meaning: copy.results[result],
      source: found ? sourceLabel(found.source) : null,
      officialUrl: found && FMCSA_CHECKS.includes(type) ? snapshotUrl : null,
      checkedAt: found?.retrievedAt ?? null,
    };
  });
  const lastRun = await db.query<{ at: Date | null }>(
    "select max(retrieved_at) as at from verification_checks where company_id = $1 and check_type = 'usdot_active'",
    [actor.companyId],
  );
  const credentials = await db.query<{
    id: string;
    credential_type: ExpiringCredential["type"];
    number: string | null;
    state: string | null;
    issuer: string | null;
    status: CredentialView["status"];
    expires_on: string | null;
    verified_at: Date | null;
  }>(
    `select distinct on (credential_type, coalesce(state, ''), coalesce(number, ''))
            id, credential_type, number, state, issuer, status, to_char(expires_on, 'YYYY-MM-DD') as expires_on, verified_at
     from credentials where company_id = $1
     order by credential_type, coalesce(state, ''), coalesce(number, ''), created_at desc`,
    [actor.companyId],
  );
  return {
    status: company.status,
    usdot: company.usdot_number,
    mc: company.mc_number,
    snapshotUrl,
    checks,
    credentials: credentials.rows.map((r) => ({
      id: r.id,
      type: r.credential_type,
      label: CREDENTIAL_LABELS[r.credential_type],
      number: r.number,
      state: r.state,
      issuer: r.issuer,
      status: r.status,
      expiresOn: r.expires_on,
      verifiedAt: r.verified_at,
    })),
    lastAutomatedRun: lastRun.rows[0]?.at ?? null,
  };
}
