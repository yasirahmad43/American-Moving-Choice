/**
 * Manage-my-request (build plan §7.2, §11 S2; Which companies receive my request, "Can you change
 * your mind?"). The consumer holds a random 32-byte token from the confirmation page and email;
 * the database stores only its sha256. Lookups are by the hash, compared in constant time, and
 * rate limited per IP address. Withdrawal stops every further sale (withdraw_lead_group), records
 * the opt-out, tells every mover that already bought the request to stop contact, and writes the
 * audit log.
 */
import type { MoveSize } from "@amc/core";
import type { Channel } from "@amc/core/src/survey";
import { audit } from "../audit/audit";
import { checkRateLimit, rateLimitKey } from "../auth/rate-limit";
import { isTokenShaped, safeEqual, sha256Hex } from "../auth/tokens";
import { getPool, tx, type Queryable } from "../db/pool";
import { env } from "../env/env";
import { enqueueEmail, type EnqueueOptions } from "../outbox/outbox";
import { longDate, requestWithdrawnBuyerEmail, requestWithdrawnConsumerEmail, type RouteText } from "./messages";
import type { Confirmation, ConfirmationMover } from "./submit";

/** Manage-page lookups and withdrawals per IP address (build plan §6). */
export const MANAGE_RATE_LIMIT = { limit: 30, windowSeconds: 15 * 60 } as const;

export type RequestStatus = "open" | "in_review" | "sold_out" | "closed" | "withdrawn";

export interface BuyerView {
  displayName: string;
  usdotNumber: string | null;
  profileSlug: string | null;
  isDemo: boolean;
  purchasedAt: string;
}

export interface ManagedRequest {
  referenceCode: string;
  status: RequestStatus;
  submittedAt: string;
  /** When movers can no longer buy it (the sale window). */
  expiresAt: string;
  withdrawnAt: string | null;
  route: RouteText;
  moveDate: string | null;
  moveDateFlexible: boolean;
  moveSize: MoveSize | null;
  channels: Channel[];
  limit: number;
  /** The movers named in this request's consent, in the order shown. */
  named: ConfirmationMover[];
  /** Movers that bought the request (and received the contact details). */
  buyers: BuyerView[];
  /** Number of companies that received the request; identities are introduced by the companies. */
  buyerCount: number;
  /** Another request from the consumer that this one joined, or that joined this one. */
  joined: boolean;
  canWithdraw: boolean;
}

interface LeadRow {
  id: string;
  group_id: string;
  manage_token_hash: string;
  reference_code: string;
  status: string;
  is_primary: boolean;
  created_at: Date;
  withdrawn_at: Date | null;
  origin_city: string | null;
  origin_state: string | null;
  dest_city: string | null;
  dest_state: string | null;
  move_date: string | null;
  move_date_flexible: boolean;
  move_size: MoveSize | null;
  channel_scope: Channel[];
  email_hash: string | null;
  phone_hash: string | null;
  group_status: "available" | "sold_out" | "expired" | "withdrawn";
  sharing_limit: number;
  expires_at: Date;
  group_size: number;
}

export type TokenLookup<T> = { ok: true; value: T } | { ok: false; reason: "not_found" | "rate_limited" };

async function rateLimited(scope: string, ip: string | null, db: Queryable): Promise<boolean> {
  if (!ip) return false;
  const result = await checkRateLimit(rateLimitKey(scope, ip), MANAGE_RATE_LIMIT.limit, MANAGE_RATE_LIMIT.windowSeconds, db);
  return !result.allowed;
}

async function findLead(token: string, db: Queryable, lock = false): Promise<LeadRow | null> {
  if (!isTokenShaped(token)) return null;
  const hash = sha256Hex(token);
  const result = await db.query<LeadRow>(
    `select l.id, l.group_id, l.manage_token_hash, l.reference_code, l.status, l.is_primary, l.created_at, l.withdrawn_at,
            l.origin_city, l.origin_state, l.dest_city, l.dest_state, to_char(l.move_date, 'YYYY-MM-DD') as move_date,
            l.move_date_flexible, l.move_size, l.channel_scope, l.email_hash, l.phone_hash,
            g.status as group_status, g.sharing_limit, g.expires_at,
            (select count(*)::int from leads x where x.group_id = l.group_id) as group_size
       from leads l join lead_groups g on g.id = l.group_id
      where l.manage_token_hash = $1
      ${lock ? "for update of g" : ""}`,
    [hash],
  );
  const row = result.rows[0];
  // The index lookup matched the hash; compare again in constant time before trusting the row.
  if (!row || !safeEqual(row.manage_token_hash, hash)) return null;
  return row;
}

function statusOf(row: LeadRow, now: Date): RequestStatus {
  if (row.group_status === "withdrawn" || row.withdrawn_at) return "withdrawn";
  if (row.status === "needs_review") return "in_review";
  if (row.group_status === "sold_out") return "sold_out";
  if (row.group_status === "expired" || row.expires_at < now) return "closed";
  return "open";
}

const routeOf = (row: LeadRow): RouteText => ({
  originCity: row.origin_city ?? "",
  originState: row.origin_state ?? "",
  destCity: row.dest_city ?? "",
  destState: row.dest_state ?? "",
});

async function buyersOf(groupId: string, db: Queryable): Promise<(BuyerView & { companyId: string })[]> {
  const result = await db.query<{ company_id: string; display_name: string; usdot_number: string | null; profile_slug: string | null; is_demo: boolean; created_at: Date }>(
    `select c.id as company_id, coalesce(p.display_name, c.dba_name, c.legal_name) as display_name, c.usdot_number,
            case when p.public_status = 'live' then p.slug end as profile_slug, c.is_demo, pu.created_at
       from purchases pu
       join disclosures d on d.purchase_id = pu.id
       join companies c on c.id = pu.company_id
       left join company_profiles p on p.company_id = c.id
      where pu.group_id = $1
      order by pu.position`,
    [groupId],
  );
  return result.rows.map((r) => ({
    companyId: r.company_id,
    displayName: r.display_name,
    usdotNumber: r.usdot_number,
    profileSlug: r.profile_slug,
    isDemo: r.is_demo,
    purchasedAt: r.created_at.toISOString(),
  }));
}

/** The request behind a manage token, for /my-request/[token]/. */
export async function getRequestByToken(token: string, meta: { ip: string | null }, db: Queryable = getPool()): Promise<TokenLookup<ManagedRequest>> {
  if (await rateLimited("manage:view:ip", meta.ip, db)) return { ok: false, reason: "rate_limited" };
  const row = await findLead(token, db);
  if (!row) return { ok: false, reason: "not_found" };
  const now = new Date();
  const status = statusOf(row, now);
  const buyers = await buyersOf(row.group_id, db);
  return {
    ok: true,
    value: {
      referenceCode: row.reference_code,
      status,
      submittedAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
      withdrawnAt: row.withdrawn_at?.toISOString() ?? null,
      route: routeOf(row),
      moveDate: row.move_date,
      moveDateFlexible: row.move_date_flexible,
      moveSize: row.move_size,
      channels: row.channel_scope,
      limit: row.sharing_limit,
      named: [],
      buyers: [],
      buyerCount: buyers.length,
      joined: row.group_size > 1,
      canWithdraw: status !== "withdrawn",
    },
  };
}

/** The confirmation view for a manage token (the /get-quotes/confirmation/ page reads it from a short-lived cookie). */
export async function getConfirmationByToken(token: string, db: Queryable = getPool()): Promise<Confirmation | null> {
  const row = await findLead(token, db);
  if (!row || !row.move_size || !row.move_date) return null;
  let joinedReferenceCode: string | null = null;
  if (!row.is_primary) {
    const primary = await db.query<{ reference_code: string }>("select reference_code from leads where group_id = $1 and is_primary", [row.group_id]);
    joinedReferenceCode = primary.rows[0]?.reference_code ?? null;
  }
  return {
    referenceCode: row.reference_code,
    limit: row.sharing_limit,
    movers: [],
    route: routeOf(row),
    moveDate: row.move_date,
    moveDateFlexible: row.move_date_flexible,
    moveSize: row.move_size,
    channels: row.channel_scope,
    joinedReferenceCode,
  };
}

export type WithdrawResult = { ok: true; alreadyWithdrawn: boolean; buyersNotified: number } | { ok: false; reason: "not_found" | "rate_limited" };

/**
 * Withdraws the whole request group: no new mover can buy it, a purchase being paid for at this
 * moment is refused at completion (complete_purchase) and refunded, and every buyer is told to stop.
 */
export async function withdrawRequest(token: string, meta: { ip: string | null }, options: EnqueueOptions = {}): Promise<WithdrawResult> {
  const pool = getPool();
  if (await rateLimited("manage:withdraw:ip", meta.ip, pool)) return { ok: false, reason: "rate_limited" };

  const done = await tx(async (client) => {
    const row = await findLead(token, client, true);
    if (!row) return null;
    if (row.group_status === "withdrawn") return { row, already: true, buyers: [] as { email: string; company_id: string }[], buyerCount: 0, withdrawnAt: row.withdrawn_at ?? new Date() };

    await client.query("select withdraw_lead_group($1)", [row.group_id]);
    const leads = await client.query<{ id: string; email_hash: string | null; phone_hash: string | null; withdrawn_at: Date }>(
      `update leads set withdrawn_at = coalesce(withdrawn_at, now()) where group_id = $1
       returning id, email_hash, phone_hash, withdrawn_at`,
      [row.group_id],
    );
    // One opt-out per request in the group, keyed by the contact hashes (no raw contact data).
    for (const lead of leads.rows) {
      if (!lead.email_hash && !lead.phone_hash) continue;
      await client.query(
        `insert into consumer_contact_preferences (email_hash, phone_hash, lead_id, do_not_contact, withdrawn_at, source)
         values ($1, $2, $3, true, now(), 'manage_page')`,
        [lead.email_hash, lead.phone_hash, lead.id],
      );
    }
    const buyers = await buyersOf(row.group_id, client);
    const recipients = buyers.length
      ? (
          await client.query<{ email: string; company_id: string }>(
            `select u.email, m.company_id from company_memberships m join users u on u.id = m.user_id
              where m.company_id = any($1::uuid[]) and m.status = 'active'
              order by m.company_id, u.email`,
            [buyers.map((b) => b.companyId)],
          )
        ).rows
      : [];
    await audit(
      {
        actorType: "consumer",
        action: "lead.withdraw",
        entity: "lead_group",
        entityId: row.group_id,
        before: { status: row.group_status },
        after: { status: "withdrawn", buyers_notified: buyers.length, via: "manage_page" },
        ip: meta.ip,
      },
      client,
    );
    for (const buyer of buyers) {
      await audit(
        { actorType: "system", actorId: "leads.withdraw", companyId: buyer.companyId, action: "lead.withdraw_notice", entity: "lead_group", entityId: row.group_id },
        client,
      );
    }
    return { row, already: false, buyers: recipients, buyerCount: buyers.length, withdrawnAt: leads.rows[0]?.withdrawn_at ?? new Date() };
  });
  if (!done) return { ok: false, reason: "not_found" };
  if (done.already) return { ok: true, alreadyWithdrawn: true, buyersNotified: 0 };

  const e = env();
  const route = routeOf(done.row);
  const withdrawnOn = longDate(done.withdrawnAt.toISOString().slice(0, 10));
  const buyerMail = requestWithdrawnBuyerEmail({ route, referenceCode: done.row.reference_code, withdrawnOn });
  for (const recipient of done.buyers) {
    try {
      await enqueueEmail({ to: recipient.email, template: "lead_withdrawn", ...buyerMail, relatedType: "lead_group", relatedId: done.row.group_id }, pool, options);
    } catch {
      console.error("[leads] could not enqueue a withdrawal notice");
    }
  }
  try {
    const consumer = await pool.query<{ email: string }>("select email from leads where id = $1", [done.row.id]);
    const to = consumer.rows[0]?.email;
    if (to) {
      const mail = requestWithdrawnConsumerEmail({ referenceCode: done.row.reference_code, route, buyers: done.buyerCount, webUrl: e.WEB_URL });
      await enqueueEmail({ to, template: "request_withdrawn", ...mail, relatedType: "lead", relatedId: done.row.id }, pool, options);
    }
  } catch {
    console.error("[leads] could not enqueue the withdrawal confirmation");
  }
  return { ok: true, alreadyWithdrawn: false, buyersNotified: done.buyerCount };
}
