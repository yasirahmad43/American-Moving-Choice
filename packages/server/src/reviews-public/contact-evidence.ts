import { getPool, withCompany, type Queryable } from "../db/pool";

// A purchase, contact-data view, reminder date, or Lost status alone is not contact evidence.
const CONTACT_STAGES = ["contacted", "qualified", "quote_sent", "follow_up", "booked", "completed"];
const STAGE_HISTORY = "^Stage changed from (Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed) to (New|Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed|Lost)\\.$|^Stage changed from (New|Lost) to (Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed)\\.$";

/** Called within this company's transaction so forced CRM RLS stays intact. */
export async function contactedPurchaseIds(companyId: string, purchaseIds: string[], db?: Queryable): Promise<Set<string>> {
  if (!db) return withCompany(companyId, (client) => contactedPurchaseIds(companyId, purchaseIds, client));
  const rows = await db.query<{ purchase_id: string }>(
    `select r.purchase_id from crm_records r where r.company_id = $1 and r.purchase_id = any($2::uuid[])
       and (r.stage = any($3::text[]) or exists (
         select 1 from crm_activities a where a.record_id = r.id and a.company_id = r.company_id
           and a.type = 'stage_change' and a.body ~* $4
       ))`,
    [companyId, purchaseIds, CONTACT_STAGES, STAGE_HISTORY],
  );
  return new Set(rows.rows.map((row) => row.purchase_id));
}

export async function hasContactEvidence(companyId: string, purchaseId: string, db?: Queryable): Promise<boolean> {
  return (await contactedPurchaseIds(companyId, [purchaseId], db)).has(purchaseId);
}

/** Re-check at transport time, including messages queued before the identity policy changed. */
export async function reviewDeliveryEligibility(invitationId: string | null): Promise<"ready" | "waiting" | "suppressed"> {
  if (!invitationId) return "suppressed";
  const row = (await getPool().query<{ company_id: string; purchase_id: string; suppressed: boolean }>(
    `select i.company_id, i.purchase_id,
       (p.refunded_at is not null or g.status = 'withdrawn' or i.expires_at <= now() or l.id is null
        or l.withdrawn_at is not null or exists (
          select 1 from consumer_contact_preferences pref where pref.email_hash = l.email_hash
            and (pref.do_not_contact or pref.withdrawn_at is not null)
            and (pref.company_id is null or pref.company_id = i.company_id)
            and (pref.channel is null or pref.channel = 'email')
        )) as suppressed
     from review_invitations i join purchases p on p.id = i.purchase_id
     join lead_groups g on g.id = p.group_id
     left join lateral (select id, email_hash, withdrawn_at from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     where i.id = $1`, [invitationId],
  )).rows[0];
  if (!row || row.suppressed) return "suppressed";
  return await hasContactEvidence(row.company_id, row.purchase_id) ? "ready" : "waiting";
}
