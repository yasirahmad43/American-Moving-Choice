/**
 * Consumer requests for admins (lead lifecycle §1, §4, §6; S7 must: list with filters, detail with
 * fields, validation results, consent record, eligibility snapshot, purchases, messages; approve,
 * reject, withdraw, expire). Opening a request's detail writes an audit row (admin view logged),
 * because it shows the consumer's contact details.
 */
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { longDate, requestAvailableEmail, requestWithdrawnBuyerEmail } from "../leads/messages";
import { env } from "../env/env";
import { enqueueEmail } from "../outbox/outbox";
import { AdminError, companyContactEmails, requireText, type AdminActor } from "./common";

export type LeadStatus = "submitted" | "rejected" | "needs_review" | "qualified" | "unmatched";
export const LEAD_STATUSES: readonly LeadStatus[] = ["submitted", "needs_review", "qualified", "unmatched", "rejected"];
export type GroupStatus = "available" | "sold_out" | "expired" | "withdrawn";
export const GROUP_STATUSES: readonly GroupStatus[] = ["available", "sold_out", "expired", "withdrawn"];

export interface LeadListRow {
  id: string;
  reference_code: string;
  status: LeadStatus;
  group_id: string;
  group_status: GroupStatus;
  sharing_limit: number;
  buyers: number;
  origin_city: string | null;
  origin_state: string | null;
  dest_city: string | null;
  dest_state: string | null;
  move_type: string | null;
  move_size: string | null;
  move_date: Date | null;
  risk_score: number | null;
  is_primary: boolean;
  created_at: Date;
  expires_at: Date;
}

export interface LeadFilters {
  status?: string | null;
  groupStatus?: string | null;
  q?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}

/** Requests without contact details (the list never shows names, emails or phones). */
export async function listLeads(filters: LeadFilters = {}, db: Queryable = getPool()): Promise<{ rows: LeadListRow[]; total: number }> {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replaceAll("?", `$${values.length}`));
  };
  if (filters.status && (LEAD_STATUSES as readonly string[]).includes(filters.status)) add("l.status = ?", filters.status);
  if (filters.groupStatus && (GROUP_STATUSES as readonly string[]).includes(filters.groupStatus)) add("g.status = ?", filters.groupStatus);
  if (filters.q) add("l.reference_code ilike ?", `%${filters.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) add("l.created_at >= ?::date", filters.from);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) add("l.created_at < ?::date + 1", filters.to);
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const total = await db.query<{ n: number }>(`select count(*)::int as n from leads l join lead_groups g on g.id = l.group_id ${clause}`, values);
  values.push(filters.limit ?? 50, filters.offset ?? 0);
  const rows = await db.query<LeadListRow>(
    `select l.id, l.reference_code, l.status, l.group_id, g.status as group_status, g.sharing_limit,
            (select count(*)::int from purchases p where p.group_id = g.id) as buyers,
            l.origin_city, l.origin_state, l.dest_city, l.dest_state, l.move_type, l.move_size, l.move_date, l.risk_score,
            l.is_primary, l.created_at, g.expires_at
     from leads l join lead_groups g on g.id = l.group_id
     ${clause}
     order by l.created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  return { rows: rows.rows, total: total.rows[0]?.n ?? 0 };
}

/** The full request for an admin, with contact details. Writes the view to audit_log. */
export async function getLeadDetail(actor: AdminActor, leadId: string, db: Queryable = getPool()) {
  const found = await db.query<{
    id: string;
    reference_code: string;
    status: LeadStatus;
    group_id: string;
    selected_limit: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_e164: string;
    origin_zip: string;
    dest_zip: string;
    origin_city: string | null;
    origin_state: string | null;
    origin_county_fips: string | null;
    dest_city: string | null;
    dest_state: string | null;
    dest_county_fips: string | null;
    distance_miles: number | null;
    move_type: string | null;
    move_size: string | null;
    services: string[];
    move_date: Date | null;
    move_date_flexible: boolean;
    channel_scope: string[];
    risk_score: number | null;
    source_category: string;
    is_primary: boolean;
    withdrawn_at: Date | null;
    profile_company_id: string | null;
    created_at: Date;
  }>(
    `select id, reference_code, status, group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip,
            origin_city, origin_state, origin_county_fips, dest_city, dest_state, dest_county_fips, distance_miles, move_type, move_size,
            services, move_date, move_date_flexible, channel_scope, risk_score, source_category, is_primary, withdrawn_at,
            profile_company_id, created_at
     from leads where id = $1`,
    [leadId],
  );
  const lead = found.rows[0];
  if (!lead) return null;
  const q = <R extends Record<string, unknown>>(text: string, values: unknown[]) => db.query<R>(text, values).then((r) => r.rows);
  const [group, validation, consent, eligibility, purchases, siblings, messages, claims] = await Promise.all([
    q<{ id: string; sharing_limit: number; policy_version: string; status: GroupStatus; expires_at: Date; created_at: Date }>(
      "select id, sharing_limit, policy_version, status, expires_at, created_at from lead_groups where id = $1",
      [lead.group_id],
    ),
    q<{ id: string; check_type: string; result: string; reason: string | null; provider_ref: string | null; created_at: Date }>(
      "select id::text, check_type, result, reason, provider_ref, created_at from lead_validation_results where lead_id = $1 order by created_at, id",
      [leadId],
    ),
    q<{
      id: string;
      consent_text_version_id: string;
      rendered_text: string;
      rendered_text_sha256: string;
      named_company_ids: string[];
      removed_company_ids: string[];
      selected_limit: number;
      channel_scope: string[];
      checkbox_state: boolean;
      terms_version: string;
      terms_accepted: boolean;
      privacy_version: string;
      privacy_acknowledged: boolean;
      ip: string | null;
      user_agent: string | null;
      page_url: string;
      form_version: string;
      form_state_sha256: string;
      ab_variant: string;
      tag_manifest_version: string;
      certificate_id: string | null;
      submitted_at: Date;
    }>("select * from consent_records where lead_id = $1", [leadId]),
    q<{ company_id: string; legal_name: string; named_in_consent: boolean; matched_rule_id: string | null; coverage_version: number; current_coverage_version: number; matched_at: Date }>(
      `select e.company_id, c.legal_name, e.named_in_consent, e.matched_rule_id, e.coverage_version, c.coverage_version as current_coverage_version, e.matched_at
       from lead_eligibility e join companies c on c.id = e.company_id where e.group_id = $1 order by e.named_in_consent desc, c.legal_name`,
      [lead.group_id],
    ),
    q<{ id: string; company_id: string; legal_name: string; position: number; lead_type: string; list_price_cents: number; charged_cents: number; refunded_at: Date | null; created_at: Date; payment_ref: string | null }>(
      `select p.id, p.company_id, c.legal_name, p.position, p.lead_type, p.list_price_cents, p.charged_cents, p.refunded_at, p.created_at, a.payment_ref
       from purchases p join companies c on c.id = p.company_id join purchase_attempts a on a.id = p.attempt_id where p.group_id = $1 order by p.position`,
      [lead.group_id],
    ),
    q<{ id: string; reference_code: string; status: string; is_primary: boolean; created_at: Date }>(
      "select id, reference_code, status, is_primary, created_at from leads where group_id = $1 and id <> $2 order by created_at",
      [lead.group_id, leadId],
    ),
    q<{ id: string; template: string; subject: string | null; channel: string; status: string; created_at: Date }>(
      `select id, template, subject, channel, status, created_at from messages
       where (related_type = 'lead' and related_id = $1) or (related_type = 'lead_group' and related_id = $2)
          or (related_type = 'purchase' and related_id in (select id from purchases where group_id = $2))
       order by created_at desc limit 50`,
      [leadId, lead.group_id],
    ),
    q<{ id: string; purchase_id: string; reason: string; status: string; created_at: Date }>(
      "select q.id, q.purchase_id, q.reason, q.status, q.created_at from lead_quality_claims q join purchases p on p.id = q.purchase_id where p.group_id = $1 order by q.created_at desc",
      [lead.group_id],
    ),
  ]);
  const namedIds = new Set(consent[0]?.named_company_ids ?? []);
  const allIds = [...(consent[0]?.named_company_ids ?? []), ...(consent[0]?.removed_company_ids ?? [])];
  const names = allIds.length
    ? new Map((await q<{ id: string; legal_name: string; usdot_number: string | null }>("select id, legal_name, usdot_number from companies where id = any($1::uuid[])", [allIds])).map((c) => [c.id, c]))
    : new Map();
  await audit({ actorType: "admin", actorId: actor.userId, action: "lead.view", entity: "lead", entityId: leadId, ip: actor.ip ?? null }, db);
  return {
    lead,
    group: group[0] ?? null,
    validation,
    consent: consent[0] ?? null,
    consentCompanies: allIds.map((id) => ({ id, name: names.get(id)?.legal_name ?? id, usdot: names.get(id)?.usdot_number ?? null, named: namedIds.has(id) })),
    eligibility,
    purchases,
    siblings,
    messages,
    claims,
  };
}

async function lockLead(db: Queryable, leadId: string) {
  const found = await db.query<{ id: string; status: LeadStatus; group_id: string; group_status: GroupStatus; withdrawn_at: Date | null }>(
    `select l.id, l.status, l.group_id, g.status as group_status, l.withdrawn_at
     from leads l join lead_groups g on g.id = l.group_id where l.id = $1 for update of l, g`,
    [leadId],
  );
  const lead = found.rows[0];
  if (!lead) throw new AdminError("Request not found.", "not_found");
  return lead;
}

export type LeadDecision = "approve" | "reject" | "withdraw" | "expire";

/**
 * Admin decisions on a request:
 * - approve: needs_review → qualified (the request can be listed);
 * - reject: needs_review, submitted or qualified → rejected, and its group stops selling if no one bought it;
 * - withdraw: the consumer withdrew consent (withdraw_lead_group: no further sales or disclosures);
 * - expire: closes the sale window now.
 */
export async function decideLead(actor: AdminActor, leadId: string, decision: LeadDecision, reasonInput: string): Promise<void> {
  const reason = requireText(reasonInput, "a reason for the decision", 1000);
  await tx(async (client) => {
    const lead = await lockLead(client, leadId);
    const before = { status: lead.status, group_status: lead.group_status };
    let after: Record<string, unknown>;
    switch (decision) {
      case "approve": {
        if (lead.status !== "needs_review") throw new AdminError("Only a request waiting for review can be approved.", "bad_status");
        await client.query("update leads set status = 'qualified' where id = $1", [leadId]);
        await client.query("insert into lead_validation_results (lead_id, check_type, result, reason) values ($1, 'admin_review', 'pass', $2)", [leadId, reason]);
        const notified = await announceQualifiedLead(client, leadId);
        after = { status: "qualified", movers_notified: notified };
        break;
      }
      case "reject": {
        if (!["needs_review", "submitted", "qualified"].includes(lead.status)) throw new AdminError("This request can't be rejected in its current state.", "bad_status");
        const sold = await client.query<{ n: number }>("select count(*)::int as n from purchases where group_id = $1", [lead.group_id]);
        if ((sold.rows[0]?.n ?? 0) > 0) throw new AdminError("Movers already bought this request. Use refunds for invalid purchases instead.", "already_sold");
        await client.query("update leads set status = 'rejected' where id = $1", [leadId]);
        await client.query("insert into lead_validation_results (lead_id, check_type, result, reason) values ($1, 'admin_review', 'fail', $2)", [leadId, reason]);
        // A group whose every request is rejected stops selling.
        await client.query(
          `update lead_groups set status = 'expired' where id = $1 and status = 'available'
             and not exists (select 1 from leads where group_id = $1 and status <> 'rejected')`,
          [lead.group_id],
        );
        after = { status: "rejected" };
        break;
      }
      case "withdraw": {
        if (lead.group_status === "withdrawn") throw new AdminError("This request is already withdrawn.", "bad_status");
        await client.query("select withdraw_lead_group($1)", [lead.group_id]);
        await client.query("update leads set withdrawn_at = coalesce(withdrawn_at, now()) where group_id = $1", [lead.group_id]);
        // Buyers are told to stop contacting the consumer (lead lifecycle §1), with slice S2's template.
        const facts = (await client.query<{ reference_code: string; origin_city: string | null; origin_state: string | null; dest_city: string | null; dest_state: string | null; email_hash: string | null; phone_hash: string | null }>(
          "select reference_code, origin_city, origin_state, dest_city, dest_state, email_hash, phone_hash from leads where id = $1",
          [leadId],
        )).rows[0]!;
        if (facts.email_hash || facts.phone_hash) {
          await client.query(
            `insert into consumer_contact_preferences (email_hash, phone_hash, lead_id, do_not_contact, withdrawn_at, source)
             values ($1, $2, $3, true, now(), 'support')`,
            [facts.email_hash, facts.phone_hash, leadId],
          );
        }
        const mail = requestWithdrawnBuyerEmail({
          route: { originCity: facts.origin_city ?? "", originState: facts.origin_state ?? "", destCity: facts.dest_city ?? "", destState: facts.dest_state ?? "" },
          referenceCode: facts.reference_code,
          withdrawnOn: longDate(new Date().toISOString().slice(0, 10)),
        });
        const buyers = await client.query<{ id: string; company_id: string }>("select id, company_id from purchases where group_id = $1", [lead.group_id]);
        for (const buyer of buyers.rows) {
          for (const to of await companyContactEmails(client, buyer.company_id)) {
            await enqueueEmail({ to, template: "lead_withdrawn", ...mail, relatedType: "lead_group", relatedId: lead.group_id }, client);
          }
          // Flag the buyer's CRM record (forced RLS: act as that company for the insert).
          await client.query("select set_config('app.company_id', $1, true)", [buyer.company_id]);
          const record = await client.query<{ id: string }>("select id from crm_records where purchase_id = $1", [buyer.id]);
          if (record.rows[0]) {
            await client.query(
              "insert into crm_activities (record_id, company_id, type, body, actor_user_id) values ($1, $2, 'do_not_contact', $3, null)",
              [record.rows[0].id, buyer.company_id, "The consumer withdrew consent. Do not contact them about this move."],
            );
          }
          await client.query("select set_config('app.company_id', '', true)");
          await audit({ actorType: "admin", actorId: actor.userId, companyId: buyer.company_id, action: "lead.withdraw_notice", entity: "purchase", entityId: buyer.id, after: { crm_flagged: Boolean(record.rows[0]) }, ip: actor.ip ?? null }, client);
        }
        after = { group_status: "withdrawn", buyers_notified: buyers.rowCount };
        break;
      }
      case "expire": {
        if (lead.group_status !== "available") throw new AdminError("Only a request that is still on sale can be expired.", "bad_status");
        await client.query("update lead_groups set status = 'expired', expires_at = least(expires_at, now()) where id = $1", [lead.group_id]);
        after = { group_status: "expired" };
        break;
      }
      default:
        throw new AdminError("Unknown decision.");
    }
    await audit(
      { actorType: "admin", actorId: actor.userId, action: `lead.${decision}`, entity: "lead", entityId: leadId, before, after: { ...after, reason }, ip: actor.ip ?? null },
      client,
    );
  });
}

/**
 * After an admin qualifies a held request, the movers named in the consumer's consent get slice
 * S2's "new request available" notice (members who can buy). Duplicates and requests no longer on
 * sale announce nothing. Returns the number of notices queued.
 */
async function announceQualifiedLead(db: Queryable, leadId: string): Promise<number> {
  const lead = (await db.query<{ group_id: string; is_primary: boolean; origin_city: string | null; origin_state: string | null; dest_city: string | null; dest_state: string | null; move_size: string | null; move_date: string | null; sharing_limit: number; group_status: string }>(
    `select l.group_id, l.is_primary, l.origin_city, l.origin_state, l.dest_city, l.dest_state, l.move_size, to_char(l.move_date, 'YYYY-MM-DD') as move_date,
            g.sharing_limit, g.status as group_status
     from leads l join lead_groups g on g.id = l.group_id where l.id = $1`,
    [leadId],
  )).rows[0];
  if (!lead || !lead.is_primary || lead.group_status !== "available" || !lead.move_size || !lead.move_date) return 0;
  const recipients = await db.query<{ email: string }>(
    `select u.email from lead_eligibility e
     join company_memberships m on m.company_id = e.company_id and m.status = 'active' and m.can_purchase
     join users u on u.id = m.user_id
     where e.group_id = $1 and e.named_in_consent order by e.company_id, u.email`,
    [lead.group_id],
  );
  const notice = requestAvailableEmail({
    route: { originCity: lead.origin_city ?? "", originState: lead.origin_state ?? "", destCity: lead.dest_city ?? "", destState: lead.dest_state ?? "" },
    moveSize: lead.move_size as Parameters<typeof requestAvailableEmail>[0]["moveSize"],
    moveDate: lead.move_date,
    limit: lead.sharing_limit,
    appUrl: env().APP_URL,
  });
  for (const { email } of recipients.rows) {
    await enqueueEmail({ to: email, template: "lead_available", ...notice, relatedType: "lead_group", relatedId: lead.group_id }, db);
  }
  return recipients.rowCount ?? 0;
}
