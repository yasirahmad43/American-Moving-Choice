/**
 * CRM for purchased requests (data-model §7; build plan §5). Every query runs inside withCompany, so
 * the forced row-level security on crm_records, crm_activities and crm_notes applies on top of the
 * explicit company filters. Contact details come only from lead_contact_for_company, and each
 * detail view writes contact_access_log. Agents see and edit only requests assigned to them.
 */
import { z } from "zod";
import { isUuid, withCompany, type Queryable } from "../db/pool";
import { getClaimWindowHours } from "../settings/settings";
import { assertCan, can, PermissionError, resolveActor, type CompanyActor } from "../marketplace/permissions";

export const CRM_STAGES = ["new", "contacted", "qualified", "quote_sent", "follow_up", "booked", "completed", "lost"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quote_sent: "Quote sent",
  follow_up: "Follow-up",
  booked: "Booked",
  completed: "Completed",
  lost: "Lost",
};

export class CrmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmError";
  }
}

// ------------------------------------------------------------------ list

export const crmFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  stage: z.enum(CRM_STAGES).optional(),
  /** "me", "unassigned" or a user ID. */
  assignee: z.union([z.enum(["me", "unassigned"]), z.uuid()]).optional(),
  followUp: z.enum(["overdue", "today", "upcoming", "none"]).optional(),
  leadType: z.enum(["exclusive", "shared"]).optional(),
  sort: z.enum(["newest", "oldest", "follow_up", "value", "move_date"]).optional(),
});
export type CrmFilters = z.output<typeof crmFiltersSchema>;

export function parseCrmFilters(params: Record<string, string | string[] | undefined>): CrmFilters {
  const out: Record<string, string> = {};
  for (const key of Object.keys(crmFiltersSchema.shape) as (keyof typeof crmFiltersSchema.shape)[]) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (!value) continue;
    const parsed = crmFiltersSchema.shape[key].safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as CrmFilters;
}

export interface CrmListItem {
  recordId: string;
  purchaseId: string;
  stage: CrmStage;
  assigneeUserId: string | null;
  assigneeName: string | null;
  estimatedValueCents: number | null;
  followUpAt: Date | null;
  lostReason: string | null;
  leadType: "exclusive" | "shared";
  purchasedAt: Date;
  referenceCode: string | null;
  customerName: string;
  originCity: string | null;
  originState: string | null;
  destCity: string | null;
  destState: string | null;
  moveDate: string | null;
  moveSize: string | null;
  withdrawn: boolean;
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const SORTS: Record<NonNullable<CrmFilters["sort"]>, string> = {
  newest: "p.created_at desc",
  oldest: "p.created_at asc",
  follow_up: "r.follow_up_at asc nulls last, p.created_at desc",
  value: "r.estimated_value_cents desc nulls last, p.created_at desc",
  move_date: "l.move_date asc nulls last, p.created_at desc",
};

async function listWithin(client: Queryable, actor: CompanyActor, filters: CrmFilters, limit: number): Promise<CrmListItem[]> {
  const values: unknown[] = [actor.companyId];
  const where: string[] = ["r.company_id = $1"];
  const add = (sql: string, ...params: unknown[]) => {
    let text = sql;
    for (const param of params) {
      values.push(param);
      text = text.replace("?", `$${values.length}`);
    }
    where.push(text);
  };
  if (!can(actor, "crm.all")) add("r.assignee_user_id = ?", actor.userId);
  if (filters.stage) add("r.stage = ?", filters.stage);
  if (filters.assignee === "me") add("r.assignee_user_id = ?", actor.userId);
  else if (filters.assignee === "unassigned") where.push("r.assignee_user_id is null");
  else if (filters.assignee) add("r.assignee_user_id = ?", filters.assignee);
  if (filters.leadType) add("p.lead_type = ?", filters.leadType);
  if (filters.followUp === "overdue") where.push("r.follow_up_at < date_trunc('day', now())");
  else if (filters.followUp === "today") where.push("r.follow_up_at >= date_trunc('day', now()) and r.follow_up_at < date_trunc('day', now()) + interval '1 day'");
  else if (filters.followUp === "upcoming") where.push("r.follow_up_at >= date_trunc('day', now()) + interval '1 day'");
  else if (filters.followUp === "none") where.push("r.follow_up_at is null");
  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    add(
      "(lc.first_name || ' ' || lc.last_name ilike ? or l.origin_city ilike ? or l.dest_city ilike ? or l.reference_code ilike ?)",
      pattern,
      pattern,
      pattern,
      pattern,
    );
  }
  values.push(limit);
  const rows = await client.query<{
    record_id: string;
    purchase_id: string;
    stage: CrmStage;
    assignee_user_id: string | null;
    assignee_name: string | null;
    estimated_value_cents: number | null;
    follow_up_at: Date | null;
    lost_reason: string | null;
    lead_type: "exclusive" | "shared";
    purchased_at: Date;
    reference_code: string | null;
    first_name: string | null;
    last_name: string | null;
    origin_city: string | null;
    origin_state: string | null;
    dest_city: string | null;
    dest_state: string | null;
    move_date: string | null;
    move_size: string | null;
    withdrawn: boolean;
  }>(
    `select r.id as record_id, r.purchase_id, r.stage, r.assignee_user_id, coalesce(u.full_name, u.email) as assignee_name,
            r.estimated_value_cents, r.follow_up_at, r.lost_reason, p.lead_type, p.created_at as purchased_at,
            l.reference_code, lc.first_name, lc.last_name, l.origin_city, l.origin_state, l.dest_city, l.dest_state,
            to_char(l.move_date, 'YYYY-MM-DD') as move_date, l.move_size, l.withdrawn_at is not null as withdrawn
     from crm_records r
     join purchases p on p.id = r.purchase_id and p.company_id = r.company_id
     left join users u on u.id = r.assignee_user_id
     join lateral (select reference_code, origin_city, origin_state, dest_city, dest_state, move_date, move_size, withdrawn_at
                   from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     left join lateral lead_contact_for_company(p.group_id, p.company_id) lc on true
     where ${where.join(" and ")}
     order by ${SORTS[filters.sort ?? "newest"]}
     limit $${values.length}`,
    values,
  );
  return rows.rows.map((r) => ({
    recordId: r.record_id,
    purchaseId: r.purchase_id,
    stage: r.stage,
    assigneeUserId: r.assignee_user_id,
    assigneeName: r.assignee_name,
    estimatedValueCents: r.estimated_value_cents,
    followUpAt: r.follow_up_at,
    lostReason: r.lost_reason,
    leadType: r.lead_type,
    purchasedAt: r.purchased_at,
    referenceCode: r.reference_code,
    customerName: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Customer",
    originCity: r.origin_city,
    originState: r.origin_state,
    destCity: r.dest_city,
    destState: r.dest_state,
    moveDate: r.move_date,
    moveSize: r.move_size,
    withdrawn: r.withdrawn,
  }));
}

/** Purchased requests for the CRM list and pipeline. */
export async function listRecords(input: { userId: string; companyId: string }, filters: CrmFilters = {}, options: { limit?: number } = {}): Promise<CrmListItem[]> {
  const parsed = crmFiltersSchema.parse(filters);
  return withCompany(input.companyId, async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "crm.view");
    return listWithin(client, actor, parsed, Math.min(options.limit ?? 200, 500));
  });
}

// ------------------------------------------------------------------ detail

export interface TimelineEntry {
  kind: "note" | "activity";
  id: string;
  type: string;
  body: string | null;
  actorName: string | null;
  at: Date;
}

export interface CrmMember {
  userId: string;
  name: string;
  role: string;
}

export interface CrmRecordDetail {
  recordId: string;
  purchaseId: string;
  stage: CrmStage;
  assigneeUserId: string | null;
  estimatedValueCents: number | null;
  followUpAt: Date | null;
  lostReason: string | null;
  contact: { firstName: string; lastName: string; email: string; phone: string } | null;
  move: {
    referenceCode: string | null;
    moveDate: string | null;
    moveDateFlexible: boolean;
    moveSize: string | null;
    moveType: string | null;
    services: string[];
    originCity: string | null;
    originState: string | null;
    originZip: string;
    destCity: string | null;
    destState: string | null;
    destZip: string;
    distanceMiles: number | null;
    sourceCategory: string;
    submittedAt: Date;
    withdrawnAt: Date | null;
  };
  consent: { channels: string[]; submittedAt: Date; selectedLimit: number; textVersion: string; namedCount: number } | null;
  purchase: {
    leadType: "exclusive" | "shared";
    position: number;
    sharingLimit: number;
    buyerCount: number;
    listPriceCents: number;
    chargedCents: number;
    creditApplied: number;
    sharingCreditsReceivedCents: number;
    purchasedAt: Date;
    refundedAt: Date | null;
  };
  timeline: TimelineEntry[];
  members: CrmMember[];
  claim: { id: string; reason: string; status: string; createdAt: Date; decision: string | null } | null;
  claimDeadline: Date;
  moveReviewRequestedAt: Date | null;
  permissions: { assign: boolean; claim: boolean; requestReview: boolean };
}

async function recordFor(client: Queryable, actor: CompanyActor, purchaseId: string, lock = false) {
  if (!isUuid(purchaseId)) throw new CrmError("That purchased request was not found.");
  const found = await client.query<{ id: string; stage: CrmStage; assignee_user_id: string | null; estimated_value_cents: number | null; follow_up_at: Date | null; lost_reason: string | null }>(
    `select id, stage, assignee_user_id, estimated_value_cents, follow_up_at, lost_reason
     from crm_records where purchase_id = $1 and company_id = $2 ${lock ? "for update" : ""}`,
    [purchaseId, actor.companyId],
  );
  const record = found.rows[0];
  if (!record) throw new CrmError("That purchased request was not found.");
  if (!can(actor, "crm.all") && record.assignee_user_id !== actor.userId) {
    throw new PermissionError("This request is assigned to someone else.");
  }
  return record;
}

/** One purchased request with contact details. Logs the view in contact_access_log. */
export async function getRecord(input: { userId: string; companyId: string; ip?: string | null }, purchaseId: string): Promise<CrmRecordDetail> {
  return withCompany(input.companyId, async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "crm.view");
    const record = await recordFor(client, actor, purchaseId);

    const purchase = (
      await client.query<{
        group_id: string;
        lead_type: "exclusive" | "shared";
        position: number;
        list_price_cents: number;
        charged_cents: number;
        credit_applied_cents: number;
        created_at: Date;
        refunded_at: Date | null;
        sharing_limit: number;
        buyer_count: number;
        sharing_credits: number;
      }>(
        `select p.group_id, p.lead_type, p.position, p.list_price_cents, p.charged_cents, a.credit_applied_cents, p.created_at, p.refunded_at,
                -- Other buyers' purchase rows are hidden inside this company's transaction (180 RLS), so
                -- count the succeeded attempts: complete_purchase writes one per purchase, atomically.
                g.sharing_limit, (select count(*) from purchase_attempts x where x.group_id = p.group_id and x.status = 'succeeded')::int as buyer_count,
                coalesce((select sum(amount_cents) from ledger_entries le where le.purchase_id = p.id and le.kind = 'sharing_credit'), 0)::int as sharing_credits
         from purchases p join purchase_attempts a on a.id = p.attempt_id join lead_groups g on g.id = p.group_id
         where p.id = $1 and p.company_id = $2`,
        [purchaseId, actor.companyId],
      )
    ).rows[0]!;

    const lead = (
      await client.query<{
        id: string;
        reference_code: string | null;
        move_date: string | null;
        move_date_flexible: boolean;
        move_size: string | null;
        move_type: string | null;
        services: string[];
        origin_city: string | null;
        origin_state: string | null;
        origin_zip: string;
        dest_city: string | null;
        dest_state: string | null;
        dest_zip: string;
        distance_miles: number | null;
        source_category: string;
        created_at: Date;
        withdrawn_at: Date | null;
      }>(
        `select id, reference_code, to_char(move_date, 'YYYY-MM-DD') as move_date, move_date_flexible, move_size, move_type, services,
                origin_city, origin_state, origin_zip, dest_city, dest_state, dest_zip, distance_miles, source_category, created_at, withdrawn_at
         from leads where group_id = $1 and is_primary order by created_at limit 1`,
        [purchase.group_id],
      )
    ).rows[0]!;

    const contactRow = (
      await client.query<{ first_name: string; last_name: string; email: string; phone_e164: string }>(
        "select first_name, last_name, email, phone_e164 from lead_contact_for_company($1, $2)",
        [purchase.group_id, actor.companyId],
      )
    ).rows[0];
    if (contactRow) {
      await client.query(
        "insert into contact_access_log (purchase_id, company_id, user_id, action, ip) values ($1, $2, $3, 'view', $4)",
        [purchaseId, actor.companyId, actor.userId, actor.ip ?? null],
      );
    }

    const consent = (
      await client.query<{ channel_scope: string[]; submitted_at: Date; selected_limit: number; consent_text_version_id: string; named: number }>(
        `select channel_scope, submitted_at, selected_limit, consent_text_version_id, cardinality(named_company_ids) as named
         from consent_records where lead_id = $1`,
        [lead.id],
      )
    ).rows[0];

    const notes = await client.query<{ id: string; body: string; created_at: Date; author: string | null }>(
      `select n.id::text, n.body, n.created_at, coalesce(u.full_name, u.email) as author
       from crm_notes n left join users u on u.id = n.author_user_id
       where n.purchase_id = $1 and n.company_id = $2`,
      [purchaseId, actor.companyId],
    );
    const activities = await client.query<{ id: string; type: string; body: string | null; created_at: Date; actor: string | null }>(
      `select a.id::text, a.type, a.body, a.created_at, coalesce(u.full_name, u.email) as actor
       from crm_activities a left join users u on u.id = a.actor_user_id
       where a.record_id = $1 and a.company_id = $2`,
      [record.id, actor.companyId],
    );
    const timeline: TimelineEntry[] = [
      ...notes.rows.map((n) => ({ kind: "note" as const, id: `n${n.id}`, type: "note", body: n.body, actorName: n.author, at: n.created_at })),
      ...activities.rows.map((a) => ({ kind: "activity" as const, id: `a${a.id}`, type: a.type, body: a.body, actorName: a.actor, at: a.created_at })),
    ].sort((x, y) => y.at.getTime() - x.at.getTime() || y.id.localeCompare(x.id));

    const members = await client.query<{ user_id: string; name: string; role: string }>(
      `select m.user_id, coalesce(u.full_name, u.email) as name, m.role
       from company_memberships m join users u on u.id = m.user_id
       where m.company_id = $1 and m.status = 'active' and m.role in ('owner', 'manager', 'agent')
       order by name`,
      [actor.companyId],
    );

    const claim = (
      await client.query<{ id: string; reason: string; status: string; created_at: Date; decision: string | null }>(
        "select id, reason, status, created_at, decision from lead_quality_claims where purchase_id = $1 and company_id = $2 order by created_at desc limit 1",
        [purchaseId, actor.companyId],
      )
    ).rows[0];
    const windowHours = await getClaimWindowHours(client);
    const review = (
      await client.query<{ created_at: Date }>(
        "select created_at from review_invitations where purchase_id = $1 and company_id = $2 and review_type = 'move_experience'",
        [purchaseId, actor.companyId],
      )
    ).rows[0];

    return {
      recordId: record.id,
      purchaseId,
      stage: record.stage,
      assigneeUserId: record.assignee_user_id,
      estimatedValueCents: record.estimated_value_cents,
      followUpAt: record.follow_up_at,
      lostReason: record.lost_reason,
      contact: contactRow
        ? { firstName: contactRow.first_name, lastName: contactRow.last_name, email: contactRow.email, phone: contactRow.phone_e164 }
        : null,
      move: {
        referenceCode: lead.reference_code,
        moveDate: lead.move_date,
        moveDateFlexible: lead.move_date_flexible,
        moveSize: lead.move_size,
        moveType: lead.move_type,
        services: lead.services,
        originCity: lead.origin_city,
        originState: lead.origin_state,
        originZip: lead.origin_zip,
        destCity: lead.dest_city,
        destState: lead.dest_state,
        destZip: lead.dest_zip,
        distanceMiles: lead.distance_miles,
        sourceCategory: lead.source_category,
        submittedAt: lead.created_at,
        withdrawnAt: lead.withdrawn_at,
      },
      consent: consent
        ? { channels: consent.channel_scope, submittedAt: consent.submitted_at, selectedLimit: consent.selected_limit, textVersion: consent.consent_text_version_id, namedCount: consent.named }
        : null,
      purchase: {
        leadType: purchase.lead_type,
        position: purchase.position,
        sharingLimit: purchase.sharing_limit,
        buyerCount: purchase.buyer_count,
        listPriceCents: purchase.list_price_cents,
        chargedCents: purchase.charged_cents,
        creditApplied: purchase.credit_applied_cents,
        sharingCreditsReceivedCents: purchase.sharing_credits,
        purchasedAt: purchase.created_at,
        refundedAt: purchase.refunded_at,
      },
      timeline,
      members: members.rows.map((m) => ({ userId: m.user_id, name: m.name, role: m.role })),
      claim: claim ? { id: claim.id, reason: claim.reason, status: claim.status, createdAt: claim.created_at, decision: claim.decision } : null,
      claimDeadline: new Date(purchase.created_at.getTime() + windowHours * 3_600_000),
      moveReviewRequestedAt: review?.created_at ?? null,
      permissions: { assign: can(actor, "crm.assign"), claim: can(actor, "claims.submit"), requestReview: can(actor, "reviews.manage") },
    };
  });
}

// ------------------------------------------------------------------ changes

export const recordUpdateSchema = z
  .object({
    stage: z.enum(CRM_STAGES).optional(),
    lostReason: z.string().trim().max(300).nullable().optional(),
    followUpAt: z.date().nullable().optional(),
    estimatedValueCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
    assigneeUserId: z.uuid().nullable().optional(),
  })
  .strict();
export type RecordUpdate = z.input<typeof recordUpdateSchema>;

const describeFollowUp = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "none");
const dollars = (cents: number | null) => (cents === null ? "none" : `$${(cents / 100).toFixed(2)}`);

/** Updates stage, lost reason, follow-up date, estimated value and assignment, logging each change. */
export async function updateRecord(input: { userId: string; companyId: string; ip?: string | null }, purchaseId: string, update: RecordUpdate): Promise<void> {
  const changes = recordUpdateSchema.parse(update);
  await withCompany(input.companyId, async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "crm.view");
    const record = await recordFor(client, actor, purchaseId, true);
    const activities: { type: string; body: string }[] = [];
    const sets: string[] = [];
    const values: unknown[] = [record.id];
    const set = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    const nextStage = changes.stage ?? record.stage;
    let lostReason = changes.lostReason === undefined ? record.lost_reason : changes.lostReason || null;
    if (nextStage === "lost" && !lostReason) throw new CrmError("Give a reason when you mark a request lost.");
    if (nextStage !== "lost" && changes.stage && record.stage === "lost") lostReason = null;
    if (changes.stage && changes.stage !== record.stage) {
      set("stage", changes.stage);
      activities.push({ type: "stage_change", body: `Stage changed from ${CRM_STAGE_LABELS[record.stage]} to ${CRM_STAGE_LABELS[changes.stage]}.` });
    }
    if (lostReason !== record.lost_reason) {
      set("lost_reason", lostReason);
      if (lostReason) activities.push({ type: "lost_reason", body: `Lost reason: ${lostReason}` });
    }
    if (changes.followUpAt !== undefined && describeFollowUp(changes.followUpAt) !== describeFollowUp(record.follow_up_at)) {
      set("follow_up_at", changes.followUpAt);
      activities.push({ type: "follow_up", body: changes.followUpAt ? `Follow-up set for ${describeFollowUp(changes.followUpAt)}.` : "Follow-up date cleared." });
    }
    if (changes.estimatedValueCents !== undefined && changes.estimatedValueCents !== record.estimated_value_cents) {
      set("estimated_value_cents", changes.estimatedValueCents);
      activities.push({ type: "estimated_value", body: `Estimated value changed from ${dollars(record.estimated_value_cents)} to ${dollars(changes.estimatedValueCents)}.` });
    }
    if (changes.assigneeUserId !== undefined && changes.assigneeUserId !== record.assignee_user_id) {
      assertCan(actor, "crm.assign", "Only owners and managers can assign requests.");
      let name = "nobody";
      if (changes.assigneeUserId) {
        const member = await client.query<{ name: string }>(
          `select coalesce(u.full_name, u.email) as name from company_memberships m join users u on u.id = m.user_id
           where m.company_id = $1 and m.user_id = $2 and m.status = 'active' and m.role in ('owner', 'manager', 'agent')`,
          [actor.companyId, changes.assigneeUserId],
        );
        if (!member.rows[0]) throw new CrmError("Choose an active teammate who works on requests.");
        name = member.rows[0].name;
      }
      set("assignee_user_id", changes.assigneeUserId);
      activities.push({ type: "assignment", body: `Assigned to ${name}.` });
    }
    if (sets.length === 0) return;
    await client.query(`update crm_records set ${sets.join(", ")} where id = $1`, values);
    for (const activity of activities) {
      await client.query(
        "insert into crm_activities (record_id, company_id, type, body, actor_user_id) values ($1, $2, $3, $4, $5)",
        [record.id, actor.companyId, activity.type, activity.body, actor.userId],
      );
    }
  });
}

/** Adds a private note (crm_notes; visible only to this company, even on shared requests). */
export async function addNote(input: { userId: string; companyId: string }, purchaseId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) throw new CrmError("Write a note first.");
  if (text.length > 5000) throw new CrmError("Notes can be up to 5,000 characters.");
  await withCompany(input.companyId, async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "crm.view");
    await recordFor(client, actor, purchaseId);
    await client.query(
      "insert into crm_notes (purchase_id, company_id, body, author_user_id) values ($1, $2, $3, $4)",
      [purchaseId, actor.companyId, text, actor.userId],
    );
  });
}

/** Pipeline columns: records grouped by stage with counts and total estimated value. */
export function groupByStage(items: CrmListItem[]): { stage: CrmStage; label: string; items: CrmListItem[]; totalValueCents: number }[] {
  return CRM_STAGES.map((stage) => {
    const inStage = items.filter((item) => item.stage === stage);
    return {
      stage,
      label: CRM_STAGE_LABELS[stage],
      items: inStage,
      totalValueCents: inStage.reduce((sum, item) => sum + (item.estimatedValueCents ?? 0), 0),
    };
  });
}

