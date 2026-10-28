/**
 * The company application (mover verification §2, §3; build plan §11 S5). Owners and managers
 * fill the wizard step by step; each saved step is validated on the server and its answers kept
 * in company_applications, and steps with a natural home write it right away (company details
 * and numbers to companies, services to company_capabilities, initial service areas to coverage
 * rules). Submitting records the credentials and the terms acceptance, moves the company to
 * verifying, runs the automated FMCSA checks and then sets in_review, or rejected when the record
 * shows broker authority. Every status change writes company_status_history and audit_log, and
 * the owners get an email through the outbox.
 */
import type { StateCode } from "@amc/core";
import type pg from "pg";
import { audit } from "../audit/audit";
import type { CompanyStatus } from "../auth/context";
import { getPool, tx, type Queryable } from "../db/pool";
import { lookupZip } from "../geo/geo";
import { enqueueEmail } from "../outbox/outbox";
import { getSetting } from "../settings/settings";
import { insertRule, writeCapabilities } from "../coverage/coverage";
import type { CoverageRuleInput } from "../coverage/schema";
import { runAutomatedChecks, type RunOptions } from "../verification/run";
import type { FmcsaAdapter } from "../verification/types";
import { loadActor } from "./actor";
import {
  APPLICATION_STEPS,
  REQUIRED_STEPS,
  parseStep,
  type ApplicationData,
  type ApplicationStep,
  type AreasStep,
  type CompanyStep,
  type CredentialsStep,
  type IdentifiersStep,
  type InsuranceStep,
  type RepresentativeStep,
  type SchemaContext,
  type ServicesStep,
  type StepErrors,
} from "./application-schema";
import { COMPANY_MANAGERS, type Actor } from "./permissions";
import { MOVER_TERMS_SHA256, MOVER_TERMS_VERSION } from "./terms";

/** Statuses in which the applicant may edit and (re)submit. */
export const EDITABLE_STATUSES: readonly CompanyStatus[] = ["applied", "rejected"];

export const BROKER_REJECTION_REASON =
  "The FMCSA record shows broker authority. Our network accepts moving carriers only, so companies with broker authority, including dual carrier and broker registrations, can't join.";

/** Today's date (YYYY-MM-DD) in US Eastern time, the platform's reference zone. */
export function platformToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function schemaContext(db: Queryable = getPool()): Promise<SchemaContext> {
  return {
    requireMc: await getSetting("require_mc_number", db),
    zipState: (zip) => (lookupZip(zip)?.state as StateCode | undefined) ?? null,
    today: platformToday(),
  };
}

interface CompanyRow {
  id: string;
  legal_name: string;
  dba_name: string | null;
  status: CompanyStatus;
  status_reason: string | null;
  usdot_number: string | null;
  mc_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  phone: string | null;
  website: string | null;
}

const COMPANY_COLUMNS =
  "id, legal_name, dba_name, status, status_reason, usdot_number, mc_number, address_line1, address_line2, address_city, address_state, address_zip, phone, website";

export interface ApplicationView {
  companyId: string;
  status: CompanyStatus;
  editable: boolean;
  requireMc: boolean;
  /** Saved answers, with company details and numbers prefilled from signup where not yet saved. */
  data: ApplicationData;
  /** Prefill values for steps not yet saved (from the signup form). */
  prefill: { company: Partial<CompanyStep>; identifiers: Partial<IdentifiersStep> };
  completedSteps: ApplicationStep[];
  submittedAt: Date | null;
  submissionCount: number;
  /** Latest status-history reason (for example why it was rejected). */
  latestReason: string | null;
}

async function loadApplicationRow(db: Queryable, companyId: string) {
  const found = await db.query<{ data: ApplicationData; completed_steps: string[]; submitted_at: Date | null; submission_count: number }>(
    "select data, completed_steps, submitted_at, submission_count from company_applications where company_id = $1",
    [companyId],
  );
  return found.rows[0] ?? null;
}

/** The application for the wizard (owners and managers). */
export async function getApplication(actor: Actor): Promise<ApplicationView> {
  await loadActor(actor, COMPANY_MANAGERS);
  const db = getPool();
  const company = (await db.query<CompanyRow>(`select ${COMPANY_COLUMNS} from companies where id = $1`, [actor.companyId])).rows[0];
  if (!company) throw new Error("company_not_found");
  const row = await loadApplicationRow(db, actor.companyId);
  const reason = await db.query<{ reason: string | null }>(
    "select reason from company_status_history where company_id = $1 order by created_at desc, id desc limit 1",
    [actor.companyId],
  );
  const phoneDigits = company.phone?.replace(/^\+1/, "") ?? "";
  return {
    companyId: company.id,
    status: company.status,
    editable: EDITABLE_STATUSES.includes(company.status),
    requireMc: await getSetting("require_mc_number", db),
    data: row?.data ?? {},
    prefill: {
      company: {
        legalName: company.legal_name,
        dbaName: company.dba_name,
        addressLine1: company.address_line1 ?? undefined,
        addressLine2: company.address_line2,
        city: company.address_city ?? undefined,
        state: (company.address_state as StateCode | null) ?? undefined,
        zip: company.address_zip ?? undefined,
        phone: phoneDigits ? `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}` : undefined,
        website: company.website,
      },
      identifiers: { usdot: company.usdot_number ?? undefined, mc: company.mc_number },
    },
    completedSteps: (row?.completed_steps ?? []).filter((s): s is ApplicationStep => (APPLICATION_STEPS as readonly string[]).includes(s)),
    submittedAt: row?.submitted_at ?? null,
    submissionCount: row?.submission_count ?? 0,
    latestReason: reason.rows[0]?.reason ?? null,
  };
}

export type SaveStepResult = { ok: true } | { ok: false; reason: "invalid"; fieldErrors: StepErrors } | { ok: false; reason: "locked"; message: string };

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "") || "company";

/** Creates the hidden public profile on first save of the company details. */
async function ensureProfile(client: Queryable, companyId: string, displayName: string): Promise<void> {
  const exists = await client.query("select 1 from company_profiles where company_id = $1", [companyId]);
  if (exists.rowCount) return;
  const base = slugify(displayName);
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const inserted = await client.query(
      `insert into company_profiles (company_id, slug, display_name, public_status) values ($1, $2, $3, 'hidden')
       on conflict do nothing`,
      [companyId, slug, displayName],
    );
    if (inserted.rowCount) return;
  }
  await client.query(
    "insert into company_profiles (company_id, slug, display_name, public_status) values ($1, $2, $3, 'hidden')",
    [companyId, `${base}-${companyId.slice(0, 8)}`, displayName],
  );
}

/** Coverage rules for the initial service areas (lead lifecycle §3 rule shapes). */
export function areaRules(areas: Pick<AreasStep, "states" | "reach">): CoverageRuleInput[] {
  const none = { states: [], counties: [], zips: [] };
  const states = { states: areas.states, counties: [], zips: [] };
  const base = { kind: "include" as const, moveTypes: [], moveSizes: [], services: [], paused: false };
  const names = areas.states.length > 4 ? `${areas.states.length} states` : areas.states.join(", ");
  if (areas.reach === "within") return [{ ...base, label: `Within ${names} (from your application)`, origin: states, destination: states }];
  if (areas.reach === "from") return [{ ...base, label: `From ${names} (from your application)`, origin: states, destination: none }];
  return [
    { ...base, label: `From ${names} (from your application)`, origin: states, destination: none },
    { ...base, label: `To ${names} (from your application)`, origin: none, destination: states },
  ];
}

async function applyStepEffects(client: pg.PoolClient, companyId: string, step: ApplicationStep, data: unknown, previous: ApplicationData): Promise<unknown> {
  switch (step) {
    case "company": {
      const c = data as CompanyStep;
      await client.query(
        `update companies set legal_name = $2, dba_name = $3, address_line1 = $4, address_line2 = $5, address_city = $6,
           address_state = $7, address_zip = $8, phone = $9, website = $10 where id = $1`,
        [companyId, c.legalName, c.dbaName, c.addressLine1, c.addressLine2, c.city, c.state, c.zip, c.phone, c.website],
      );
      await ensureProfile(client, companyId, c.dbaName ?? c.legalName);
      return c;
    }
    case "identifiers": {
      const i = data as IdentifiersStep;
      const duplicate = await client.query(
        "select 1 from companies where usdot_number = $1 and id <> $2 and status <> 'rejected' limit 1",
        [i.usdot, companyId],
      );
      await client.query(
        `update companies set usdot_number = $2, mc_number = $3,
           status_reason = case when $4 then 'duplicate_usdot' when status_reason = 'duplicate_usdot' then null else status_reason end
         where id = $1`,
        [companyId, i.usdot, i.mc, (duplicate.rowCount ?? 0) > 0],
      );
      return i;
    }
    case "services": {
      await writeCapabilities(client, companyId, data as ServicesStep);
      return data;
    }
    case "areas": {
      const areas = data as AreasStep;
      const oldIds = previous.areas?.ruleIds ?? [];
      if (oldIds.length) await client.query("delete from coverage_rules where company_id = $1 and id = any($2::uuid[])", [companyId, oldIds]);
      const ruleIds: string[] = [];
      for (const rule of areaRules(areas)) ruleIds.push(await insertRule(client, companyId, rule));
      return { states: areas.states, reach: areas.reach, ruleIds };
    }
    default:
      return data;
  }
}

/** Validates and saves one step (not "review", which submits). */
export async function saveApplicationStep(
  actor: Actor,
  step: ApplicationStep,
  input: unknown,
  meta: { ip?: string | null } = {},
): Promise<SaveStepResult> {
  if (step === "review") return { ok: false, reason: "invalid", fieldErrors: { _form: "Use the submit button on the review step." } };
  const ctx = await schemaContext();
  const parsed = parseStep(step, input, ctx);
  if (!parsed.ok) return { ok: false, reason: "invalid", fieldErrors: parsed.fieldErrors };

  return tx(async (client): Promise<SaveStepResult> => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const company = (await client.query<{ status: CompanyStatus }>("select status from companies where id = $1 for update", [actor.companyId])).rows[0];
    if (!company || !EDITABLE_STATUSES.includes(company.status)) {
      return { ok: false, reason: "locked", message: "Your application has been submitted, so it can't be edited now. Contact us if something changed." };
    }
    await client.query("insert into company_applications (company_id) values ($1) on conflict do nothing", [actor.companyId]);
    const row = await client.query<{ data: ApplicationData }>("select data from company_applications where company_id = $1 for update", [actor.companyId]);
    const previous = row.rows[0]?.data ?? {};
    const stored = await applyStepEffects(client, actor.companyId, step, parsed.data, previous);
    await client.query(
      `update company_applications
       set data = data || jsonb_build_object($2::text, $3::jsonb),
           completed_steps = case when $2 = any(completed_steps) then completed_steps else array_append(completed_steps, $2) end,
           updated_by = $4
       where company_id = $1`,
      [actor.companyId, step, JSON.stringify(stored), member.userId],
    );
    await audit(
      { actorType: "user", actorId: member.userId, companyId: actor.companyId, action: "company.application_step_saved", entity: "company", entityId: actor.companyId, after: { step }, ip: meta.ip ?? null },
      client,
    );
    return { ok: true };
  });
}

export type SubmitResult =
  | { ok: true; status: CompanyStatus; checks: { checkType: string; result: string }[] }
  | { ok: false; reason: "invalid"; fieldErrors: StepErrors }
  | { ok: false; reason: "incomplete"; missing: ApplicationStep[] }
  | { ok: false; reason: "locked"; message: string };

async function writeSubmittedCredentials(client: Queryable, companyId: string, credentials: CredentialsStep, insurance: InsuranceStep): Promise<void> {
  // Company-supplied credentials not yet verified are replaced by the new answers; verified
  // rows (a reviewer's decision) stay.
  await client.query(
    "delete from credentials where company_id = $1 and credential_type in ('state_license', 'insurance_coi') and status <> 'verified'",
    [companyId],
  );
  await client.query(
    `insert into credentials (company_id, credential_type, number, issuer, status, expires_on)
     values ($1, 'insurance_coi', $2, $3, 'pending', $4)`,
    [companyId, insurance.policyNumber, insurance.insurer, insurance.expiresOn],
  );
  for (const row of credentials.rows) {
    await client.query(
      `insert into credentials (company_id, credential_type, number, state, issuer, status, expires_on)
       values ($1, 'state_license', $2, $3, $4, 'pending', $5)`,
      [companyId, row.number, row.state, row.issuer, row.expiresOn],
    );
  }
  // Earliest expiry of the insurance certificate and state credentials (company_can_purchase).
  await client.query(
    `update companies set credentials_valid_until = (
       select min(expires_on) from credentials
       where company_id = $1 and credential_type in ('state_license', 'insurance_coi') and status <> 'rejected' and expires_on is not null)
     where id = $1`,
    [companyId],
  );
}

async function setStatus(
  client: Queryable,
  input: { companyId: string; from: CompanyStatus; to: CompanyStatus; reason: string; changedBy: string | null; statusReason?: string | null; ip?: string | null },
): Promise<void> {
  await client.query(
    `update companies set status = $2, status_reason = case when $4::boolean then $3 else status_reason end where id = $1`,
    [input.companyId, input.to, input.statusReason ?? null, input.statusReason !== undefined],
  );
  await client.query(
    "insert into company_status_history (company_id, from_status, to_status, reason, changed_by) values ($1, $2, $3, $4, $5)",
    [input.companyId, input.from, input.to, input.reason, input.changedBy],
  );
  await audit(
    {
      actorType: input.changedBy ? "user" : "system",
      actorId: input.changedBy ?? "application",
      companyId: input.companyId,
      action: "company.status_changed",
      entity: "company",
      entityId: input.companyId,
      before: { status: input.from },
      after: { status: input.to, reason: input.reason },
      ip: input.ip ?? null,
    },
    client,
  );
}

async function emailOwners(client: Queryable, companyId: string, subject: string, body: string, template: string): Promise<void> {
  const owners = await client.query<{ email: string }>(
    `select u.email from company_memberships m join users u on u.id = m.user_id
     where m.company_id = $1 and m.role = 'owner' and m.status = 'active' order by m.created_at`,
    [companyId],
  );
  for (const owner of owners.rows) {
    await enqueueEmail({ to: owner.email, template, subject, bodyText: body, relatedType: "company", relatedId: companyId }, client);
  }
}

/**
 * Submits the application: checks that every step is saved and still valid, records the
 * credentials and the terms acceptance, sets verifying, runs the automated checks, then sets
 * in_review or rejected (broker authority) and emails the owners.
 */
export async function submitApplication(
  actor: Actor,
  input: unknown,
  meta: { ip?: string | null; userAgent?: string | null; adapter?: FmcsaAdapter } = {},
): Promise<SubmitResult> {
  const ctx = await schemaContext();
  const review = parseStep("review", input, ctx);
  if (!review.ok) return { ok: false, reason: "invalid", fieldErrors: review.fieldErrors };

  const first = await tx(async (client): Promise<SubmitResult | { ok: "continue"; from: CompanyStatus; legalName: string }> => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const company = (await client.query<{ status: CompanyStatus; legal_name: string }>("select status, legal_name from companies where id = $1 for update", [actor.companyId])).rows[0];
    if (!company || !EDITABLE_STATUSES.includes(company.status)) {
      return { ok: false, reason: "locked", message: "This application was already submitted." };
    }
    const row = await loadApplicationRow(client, actor.companyId);
    const data = row?.data ?? {};
    const completed = row?.completed_steps ?? [];
    const missing = REQUIRED_STEPS.filter((s) => !completed.includes(s) || !data[s as keyof ApplicationData]);
    if (missing.length) return { ok: false, reason: "incomplete", missing };
    // Saved answers can go stale (an expiry date passes, the MC setting changes): check again.
    const stale: ApplicationStep[] = [];
    for (const step of REQUIRED_STEPS) {
      const saved = data[step as keyof ApplicationData] as Record<string, unknown> | undefined;
      const recheck = parseStep(step, step === "areas" ? { states: (saved as AreasStep).states, reach: (saved as AreasStep).reach } : saved, ctx);
      if (!recheck.ok) stale.push(step);
    }
    if (stale.length) return { ok: false, reason: "incomplete", missing: stale };

    await writeSubmittedCredentials(client, actor.companyId, data.credentials!, data.insurance!);
    const rep = data.representative as RepresentativeStep;
    await client.query(
      `insert into mover_terms_acceptances
         (company_id, user_id, terms_version, terms_sha256, representative_name, representative_title, representative_email,
          representative_phone, authority_attested, ip, user_agent)
       values ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)`,
      [actor.companyId, member.userId, MOVER_TERMS_VERSION, MOVER_TERMS_SHA256, rep.name, rep.title, rep.email, rep.phone, meta.ip ?? null, meta.userAgent?.slice(0, 512) ?? null],
    );
    await client.query(
      "update company_applications set submitted_at = now(), submitted_by = $2, submission_count = submission_count + 1, updated_by = $2 where company_id = $1",
      [actor.companyId, member.userId],
    );
    await client.query("update companies set approved_at = null where id = $1", [actor.companyId]);
    await setStatus(client, {
      companyId: actor.companyId,
      from: company.status,
      to: "verifying",
      reason: company.status === "rejected" ? "Application resubmitted" : "Application submitted",
      changedBy: member.userId,
      statusReason: company.status === "rejected" ? null : undefined,
      ip: meta.ip,
    });
    await audit(
      {
        actorType: "user",
        actorId: member.userId,
        companyId: actor.companyId,
        action: "company.application_submitted",
        entity: "company",
        entityId: actor.companyId,
        after: { terms_version: MOVER_TERMS_VERSION, terms_sha256: MOVER_TERMS_SHA256, submission: (row?.submission_count ?? 0) + 1 },
        ip: meta.ip ?? null,
      },
      client,
    );
    return { ok: "continue", from: company.status, legalName: company.legal_name };
  });
  if (first.ok !== "continue") return first;

  let summary: Awaited<ReturnType<typeof runAutomatedChecks>> | null = null;
  try {
    const options: RunOptions = { actor: "system", ip: meta.ip ?? null };
    if (meta.adapter) options.adapter = meta.adapter;
    summary = await runAutomatedChecks(actor.companyId, options);
  } catch {
    console.error("[application] automated checks failed to run");
  }

  const status = await tx(async (client): Promise<CompanyStatus> => {
    const current = (await client.query<{ status: CompanyStatus }>("select status from companies where id = $1 for update", [actor.companyId])).rows[0]!.status;
    // An admin may have acted in between; only move on from verifying.
    if (current !== "verifying") return current;
    const name = first.legalName;
    if (summary?.hasBrokerAuthority) {
      await setStatus(client, { companyId: actor.companyId, from: "verifying", to: "rejected", reason: BROKER_REJECTION_REASON, changedBy: null, statusReason: "broker_authority" });
      await emailOwners(
        client,
        actor.companyId,
        "Your American Moving Choice application was not accepted",
        [
          `We've checked the application for ${name} against FMCSA records.`,
          "",
          BROKER_REJECTION_REASON,
          "",
          "If the FMCSA record is wrong or out of date, correct it with FMCSA, then update and resubmit your application in the company portal.",
        ].join("\n"),
        "application_rejected",
      );
      return "rejected";
    }
    const reason = summary
      ? summary.outcome === "pass"
        ? "Automated checks passed; waiting for a reviewer."
        : "Automated checks finished; a reviewer will look at the results."
      : "Automated checks couldn't run; a reviewer will run them.";
    await setStatus(client, { companyId: actor.companyId, from: "verifying", to: "in_review", reason, changedBy: null });
    await emailOwners(
      client,
      actor.companyId,
      "We received your American Moving Choice application",
      [
        `Thanks for applying to join the American Moving Choice network with ${name}.`,
        "",
        "We've checked your USDOT and MC numbers against FMCSA records. A reviewer now looks at the results, confirms your application by calling the phone number on your official FMCSA record, and checks your insurance certificate and state credentials.",
        "",
        "You can follow each check on the Verification page of the company portal. We'll email you when there's a decision.",
      ].join("\n"),
      "application_received",
    );
    return "in_review";
  });

  return { ok: true, status, checks: summary?.checks.map((c) => ({ checkType: c.checkType, result: c.result })) ?? [] };
}

