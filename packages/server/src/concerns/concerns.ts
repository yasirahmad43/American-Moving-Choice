/**
 * Concern reports from the public site (/report-a-concern/): one row in cases plus an audit entry,
 * in one transaction (build plan §4.1 cases; mover verification §7 "Report a problem").
 *
 * Reporter contact details live only in the cases row (admin only). They never go into the audit
 * entry, logs, URLs or error messages (build plan §5).
 */
import type pg from "pg";
import { audit } from "../audit/audit";
import { publicFormRateLimit } from "../public-forms/guards";
import { getPool, tx } from "../db/pool";
import { parseCarrierNumber, type ConcernInput } from "./schema";

/** Reports per IP address per hour. Generous for a real person; stops scripted floods. */
export const CONCERN_RATE_LIMIT = { limit: 5, windowSeconds: 60 * 60 } as const;

export interface SubmittedConcern {
  caseId: string;
  reference: string;
}

/** Links the case to a company only when the text is a USDOT or MC number that matches exactly one company. */
async function matchCompany(client: pg.PoolClient, company: string | null): Promise<string | null> {
  const parsed = parseCarrierNumber(company);
  if (!parsed) return null;
  const column = parsed.kind === "mc" ? "mc_number" : "usdot_number";
  const found = await client.query<{ id: string }>(
    // Compare digits only: records may store "MC-123456" or "123456".
    `select id from companies where regexp_replace(coalesce(${column}, ''), '\\D', '', 'g') = $1 limit 2`,
    [parsed.number],
  );
  return found.rows.length === 1 ? found.rows[0]!.id : null;
}

/** Stores a validated report as a new open case and audits it. Returns the case reference. */
export async function createConcernCase(
  input: ConcernInput,
  meta: { ip: string | null } = { ip: null },
  pool: pg.Pool = getPool(),
): Promise<SubmittedConcern> {
  return tx(async (client) => {
    const companyId = await matchCompany(client, input.company);
    const inserted = await client.query<{ id: string; reference_code: string }>(
      `insert into cases (case_type, company_id, reported_company, reporter_name, reporter_email, reporter_phone, description, source)
       values ($1, $2, $3, $4, $5, $6, $7, 'public_form')
       returning id, reference_code`,
      [input.caseType, companyId, input.company, input.name, input.email?.toLowerCase() ?? null, input.phone, input.description],
    );
    const row = inserted.rows[0]!;
    await audit(
      {
        actorType: "consumer",
        actorId: null,
        companyId,
        action: "case.report",
        entity: "case",
        entityId: row.id,
        // IDs and categories only: no description or contact details (build plan §5).
        after: {
          case_type: input.caseType,
          source: "public_form",
          reference: row.reference_code,
          company_matched: companyId !== null,
          contact_given: Boolean(input.email || input.phone),
        },
        ip: meta.ip,
      },
      client,
    );
    return { caseId: row.id, reference: row.reference_code };
  }, pool);
}

/** Counts one report attempt for this IP. Missing IPs share one bucket so they can't bypass the limit. */
export async function concernRateLimit(ip: string | null): Promise<{ allowed: boolean }> {
  const result = await publicFormRateLimit(
    "concern:ip", ip,
    CONCERN_RATE_LIMIT.limit,
    CONCERN_RATE_LIMIT.windowSeconds,
  );
  return { allowed: result.allowed };
}
