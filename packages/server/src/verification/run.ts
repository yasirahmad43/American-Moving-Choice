/**
 * runAutomatedChecks (mover verification §3): looks the company's USDOT number up through the
 * FMCSA adapter, records one append-only verification_checks row per automated check (source,
 * URL, payload snapshot and its sha256, result, note), records the authority per docket, updates
 * the matching credential statuses and companies.has_broker_authority, and audits the run.
 *
 * It changes no company status: approval, rejection and suspension are admin and job decisions
 * that use the returned summary and getCompanyEligibility().
 */
import { createHash } from "node:crypto";
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { env, isProduction } from "../env/env";
import { getSetting } from "../settings/settings";
import { assessCarrier, brokerAuthorityOf, worstResult, type PreviousIdentity } from "./assess";
import { evaluateEligibility, type BillingStatus, type CompanyStatus, type EligibilityEvaluation } from "./eligibility";
import { fixtureAdapter } from "./fixtures";
import { qcMobileAdapter } from "./qcmobile";
import type { ApplicationFacts, AutomatedCheckType, CheckOutcome, CheckResult, CheckType, FmcsaAdapter, FmcsaLookup, VerificationSource } from "./types";

/** No fabricated carrier evidence is permitted when the production lookup is unavailable. */
const productionUnavailableAdapter: FmcsaAdapter = {
  source: "fmcsa_qcmobile",
  async lookupCarrier(usdot) {
    return {
      status: "unavailable",
      reason: "Live FMCSA verification is not configured for this check. Fictional fixture records are disabled in production; manually review the official FMCSA record.",
      source: "fmcsa_qcmobile",
      sourceUrl: fmcsaSnapshotUrl(usdot),
      retrievedAt: new Date(),
      raw: { usdot, liveLookupAttempted: false },
    };
  },
};

/** Live QCMobile with a key; missing production configuration requires manual review. */
export function getFmcsaAdapter(): FmcsaAdapter {
  const webKey = env().FMCSA_WEBKEY;
  return webKey ? qcMobileAdapter(webKey) : isProduction() ? productionUnavailableAdapter : fixtureAdapter;
}

/** Public FMCSA SAFER company snapshot for a USDOT number (for "official record" links). */
export function fmcsaSnapshotUrl(usdot: string): string {
  return `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${encodeURIComponent(usdot)}`;
}

export interface AutomatedCheckSummary {
  companyId: string;
  usdot: string | null;
  source: VerificationSource;
  lookup: FmcsaLookup["status"];
  retrievedAt: Date;
  checks: { id: string; checkType: AutomatedCheckType; result: CheckResult; note: string }[];
  /** Worst result across the automated checks. */
  outcome: CheckResult;
  /** Broker authority found (true), not found (false) or unknown because no record was read (null). */
  hasBrokerAuthority: boolean | null;
}

interface CompanyRow {
  id: string;
  legal_name: string;
  dba_name: string | null;
  usdot_number: string | null;
  mc_number: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  phone: string | null;
}

const sha256Json = (value: unknown) => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

const credentialStatus = (result: CheckResult | undefined): "verified" | "rejected" | "pending" =>
  result === "pass" ? "verified" : result === "fail" ? "rejected" : "pending";

async function previousIdentity(db: Queryable, companyId: string): Promise<PreviousIdentity | null> {
  const found = await db.query<{ payload_snapshot: Record<string, unknown> | null; retrieved_at: Date }>(
    `select payload_snapshot, retrieved_at from verification_checks
     where company_id = $1 and check_type = 'identity_match' and source = 'fmcsa_qcmobile'
     order by retrieved_at desc, created_at desc limit 1`,
    [companyId],
  );
  const row = found.rows[0];
  const payload = row?.payload_snapshot;
  if (!row || !payload || typeof payload !== "object" || !("legal_name" in payload)) return null;
  return {
    legalName: (payload.legal_name as string | null) ?? null,
    address: (payload.physical_address as PreviousIdentity["address"]) ?? null,
    phone: (payload.phone_on_record as string | null) ?? null,
    retrievedAt: row.retrieved_at.toISOString(),
  };
}

/** Updates the latest credential of a type (and number, when given), or inserts one. */
async function upsertCredential(
  db: Queryable,
  input: { companyId: string; type: "usdot" | "docket" | "insurance_filing"; number: string | null; status: "verified" | "rejected" | "pending"; checkId: string; sourceUrl: string | null },
): Promise<void> {
  const existing = await db.query<{ id: string }>(
    `select id from credentials where company_id = $1 and credential_type = $2 and ($3::text is null or number = $3)
     order by created_at desc limit 1`,
    [input.companyId, input.type, input.type === "insurance_filing" ? null : input.number],
  );
  const id = existing.rows[0]?.id;
  if (id) {
    await db.query(
      `update credentials set status = $2,
         verified_at = case when $2 = 'verified' then now() else verified_at end,
         verified_by = case when $2 = 'verified' then null else verified_by end,
         source_check_id = $3, source_url = $4
       where id = $1`,
      [id, input.status, input.checkId, input.sourceUrl],
    );
  } else {
    await db.query(
      `insert into credentials (company_id, credential_type, number, issuer, status, verified_at, source_check_id, source_url)
       values ($1, $2, $3, 'FMCSA', $4, case when $4 = 'verified' then now() end, $5, $6)`,
      [input.companyId, input.type, input.number, input.status, input.checkId, input.sourceUrl],
    );
  }
}

export interface RunOptions {
  adapter?: FmcsaAdapter;
  /** Who started the run: an admin's user ID, or "system" for jobs and the application flow. */
  actor?: { userId: string } | "system";
  ip?: string | null;
}

export async function runAutomatedChecks(companyId: string, options: RunOptions = {}): Promise<AutomatedCheckSummary> {
  const pool = getPool();
  const companyResult = await pool.query<CompanyRow>(
    `select id, legal_name, dba_name, usdot_number, mc_number, address_line1, address_city, address_state, address_zip, phone
     from companies where id = $1`,
    [companyId],
  );
  const company = companyResult.rows[0];
  if (!company) throw new Error("company_not_found");

  const configuredAdapter = options.adapter ?? getFmcsaAdapter();
  const adapter = isProduction() && configuredAdapter.source === "fixture" ? productionUnavailableAdapter : configuredAdapter;
  const requireMcNumber = await getSetting("require_mc_number");
  const app: ApplicationFacts = {
    legalName: company.legal_name,
    dbaName: company.dba_name,
    usdot: company.usdot_number,
    mcNumber: company.mc_number,
    address: company.address_zip
      ? { line1: company.address_line1, city: company.address_city, state: company.address_state, zip: company.address_zip }
      : null,
    phone: company.phone,
  };

  const lookup: FmcsaLookup = company.usdot_number
    ? await adapter.lookupCarrier(company.usdot_number)
    : { status: "not_found", source: adapter.source, sourceUrl: "", retrievedAt: new Date(), raw: { usdot: null } };
  const previous = adapter.source === "fmcsa_qcmobile" ? await previousIdentity(pool, companyId) : null;
  const outcomes = assessCarrier(lookup, app, { requireMcNumber, previous });
  const byType = new Map<AutomatedCheckType, CheckOutcome>(outcomes.map((o) => [o.checkType, o]));
  const hasBroker = brokerAuthorityOf(lookup);
  const sourceUrl = lookup.sourceUrl || null;

  const checks = await tx(async (client) => {
    const inserted: AutomatedCheckSummary["checks"] = [];
    for (const o of outcomes) {
      const row = await client.query<{ id: string }>(
        `insert into verification_checks
           (company_id, check_type, source, source_url, payload_snapshot, payload_sha256, result, decision_note, retrieved_at)
         values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9) returning id`,
        [companyId, o.checkType, lookup.source, sourceUrl, JSON.stringify(o.payload), sha256Json(o.payload), o.result, o.note, lookup.retrievedAt],
      );
      inserted.push({ id: row.rows[0]!.id, checkType: o.checkType, result: o.result, note: o.note });
    }
    const idOf = (type: AutomatedCheckType) => inserted.find((c) => c.checkType === type)!.id;

    if (lookup.status === "found") {
      for (const grant of lookup.record.authorities) {
        await client.query(
          `insert into authority_records (company_id, docket_number, authority_type, scope, status, effective_from, source_check_id)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [companyId, grant.docket, grant.type, grant.scope, grant.status, grant.effectiveFrom ?? null, idOf("authority_type")],
        );
      }
    }

    if (company.usdot_number) {
      await upsertCredential(client, {
        companyId, type: "usdot", number: company.usdot_number, status: credentialStatus(byType.get("usdot_active")?.result),
        checkId: idOf("usdot_active"), sourceUrl,
      });
    }
    if (company.mc_number) {
      const authority = worstResult([byType.get("authority_type")!.result, byType.get("authority_status")!.result]);
      await upsertCredential(client, {
        companyId, type: "docket", number: company.mc_number, status: credentialStatus(authority), checkId: idOf("authority_status"), sourceUrl,
      });
    }
    if (lookup.status === "found") {
      await upsertCredential(client, {
        companyId, type: "insurance_filing", number: null, status: credentialStatus(byType.get("insurance_filings")?.result),
        checkId: idOf("insurance_filings"), sourceUrl,
      });
    }
    if (hasBroker !== null) {
      await client.query("update companies set has_broker_authority = $2 where id = $1", [companyId, hasBroker]);
    }

    const actor = options.actor && options.actor !== "system" ? options.actor : null;
    await audit(
      {
        actorType: actor ? "admin" : "system",
        actorId: actor ? actor.userId : "verification",
        companyId,
        action: "verification.automated_checks",
        entity: "company",
        entityId: companyId,
        after: {
          source: lookup.source,
          lookup: lookup.status,
          results: Object.fromEntries(inserted.map((c) => [c.checkType, c.result])),
          has_broker_authority: hasBroker,
        },
        ip: options.ip ?? null,
      },
      client,
    );
    return inserted;
  });

  return {
    companyId,
    usdot: company.usdot_number,
    source: lookup.source,
    lookup: lookup.status,
    retrievedAt: lookup.retrievedAt,
    checks,
    outcome: worstResult(checks.map((c) => c.result)),
    hasBrokerAuthority: hasBroker,
  };
}

export interface LatestCheck {
  id: string;
  checkType: CheckType;
  result: CheckResult;
  source: string;
  sourceUrl: string | null;
  decisionNote: string | null;
  reviewerId: string | null;
  retrievedAt: Date;
}

/** The most recent row of each check type for a company (a reviewer decision is a newer row). */
export async function latestChecks(companyId: string, db: Queryable = getPool()): Promise<Map<CheckType, LatestCheck>> {
  const result = await db.query<{
    id: string;
    check_type: CheckType;
    result: CheckResult;
    source: string;
    source_url: string | null;
    decision_note: string | null;
    reviewer_id: string | null;
    retrieved_at: Date;
  }>(
    `select distinct on (check_type) id, check_type, result, source, source_url, decision_note, reviewer_id, retrieved_at
     from verification_checks where company_id = $1
     order by check_type, created_at desc, retrieved_at desc`,
    [companyId],
  );
  return new Map(
    result.rows.map((row) => [
      row.check_type,
      {
        id: row.id,
        checkType: row.check_type,
        result: row.result,
        source: row.source,
        sourceUrl: row.source_url,
        decisionNote: row.decision_note,
        reviewerId: row.reviewer_id,
        retrievedAt: row.retrieved_at,
      },
    ]),
  );
}

/** evaluateEligibility over the company row, the latest checks and the MC setting. */
export async function getCompanyEligibility(companyId: string, db: Queryable = getPool()): Promise<EligibilityEvaluation> {
  const companyResult = await db.query<{
    status: CompanyStatus;
    usdot_number: string | null;
    mc_number: string | null;
    has_broker_authority: boolean;
    billing_status: BillingStatus;
    credentials_valid_until: Date | null;
    usdot_already_approved: boolean;
  }>(
    `select c.status, c.usdot_number, c.mc_number, c.has_broker_authority, c.billing_status, c.credentials_valid_until,
            exists (select 1 from companies o where o.usdot_number = c.usdot_number and o.id <> c.id and o.status = 'approved') as usdot_already_approved
     from companies c where c.id = $1`,
    [companyId],
  );
  const company = companyResult.rows[0];
  if (!company) throw new Error("company_not_found");
  const latest = await latestChecks(companyId, db);
  return evaluateEligibility({
    company: {
      status: company.status,
      usdotNumber: company.usdot_number,
      mcNumber: company.mc_number,
      hasBrokerAuthority: company.has_broker_authority,
      billingStatus: company.billing_status,
      credentialsValidUntil: company.credentials_valid_until,
    },
    checks: Object.fromEntries([...latest].map(([type, check]) => [type, check.result])),
    requireMcNumber: await getSetting("require_mc_number", db),
    usdotAlreadyApproved: company.usdot_already_approved,
  });
}
