/**
 * Marketplace previews (lead lifecycle §5; build plan §7.4). A request is listed to a company only
 * when the company was named in the consumer's consent (lead_eligibility.named_in_consent), the
 * request group is available and inside its sale window, the company may purchase, and it has not
 * already bought it. A snapshot taken before a coverage change is listed only if the matcher still
 * matches it.
 *
 * Previews are built only through @amc/core toPreview (an allow-list). The queries here never
 * select contact columns (surname, email, phone): before purchase they are not read at all.
 */
import { matchCompany, toPreview, type LeadPreview, type LeadRecord, type MoveSize, type MoveType, type Service } from "@amc/core";
import { z } from "zod";
import { getPool, isUuid, type Queryable } from "../db/pool";
import { ZIP_RADIUS_MILES, zipsWithinMiles } from "../geo/geo";
import { getShowZipInPreview } from "../settings/settings";
import { leadFactsForGroup, loadMatchProfile } from "./eligibility";
import { assertCan, can, resolveActor, type CompanyActor } from "./permissions";
import { nextPrice, splitCharge, type NextPrice } from "./pricing";

export const SOURCE_CATEGORIES = ["organic_search", "paid_search", "paid_social", "referral", "direct", "other"] as const;
export const MOVE_SIZES = ["studio", "1br", "2br", "3br", "4br_plus", "office", "partial"] as const;

/**
 * Where a request may be from or to (lead lifecycle §5 "nationwide / state / ZIP / directional"):
 *   nationwide  every request naming the company, whatever its route (location filters ignored);
 *   state       origin and/or destination state (directional when both are set);
 *   zip         origin and/or destination ZIP, exact or within a radius.
 * Without a scope the location filters given are applied as they are.
 */
export const MARKETPLACE_SCOPES = ["nationwide", "state", "zip"] as const;
/** The radius choices as form values; must list ZIP_RADIUS_MILES (geo) in order. */
export const ZIP_RADIUS_OPTIONS = ["25", "50", "100"] as const satisfies readonly `${(typeof ZIP_RADIUS_MILES)[number]}`[];

const stateCode = z.string().regex(/^[A-Z]{2}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const zip5 = z.string().regex(/^\d{5}$/);

export const marketplaceFiltersSchema = z.object({
  scope: z.enum(MARKETPLACE_SCOPES).optional(),
  originState: stateCode.optional(),
  destState: stateCode.optional(),
  originZip: zip5.optional(),
  destZip: zip5.optional(),
  /** Radius around originZip / destZip in miles; absent means the exact ZIP. */
  radiusMiles: z.enum(ZIP_RADIUS_OPTIONS).optional(),
  moveDateFrom: isoDate.optional(),
  moveDateTo: isoDate.optional(),
  moveSize: z.enum(MOVE_SIZES).optional(),
  leadType: z.enum(["exclusive", "shared"]).optional(),
  source: z.enum(SOURCE_CATEGORIES).optional(),
});

export type MarketplaceFilters = z.output<typeof marketplaceFiltersSchema>;

const STATE_KEYS = ["originState", "destState"] as const;
const ZIP_KEYS = ["originZip", "destZip", "radiusMiles"] as const;

/** Drops the location filters the chosen scope does not use, so "Nationwide" really means everything. */
export function applyScope(filters: MarketplaceFilters): MarketplaceFilters {
  const out: MarketplaceFilters = { ...filters };
  const drop = (keys: readonly (keyof MarketplaceFilters)[]) => {
    for (const key of keys) delete out[key];
  };
  if (filters.scope === "nationwide") drop([...STATE_KEYS, ...ZIP_KEYS]);
  else if (filters.scope === "state") drop(ZIP_KEYS);
  else if (filters.scope === "zip") drop(STATE_KEYS);
  if (!out.originZip && !out.destZip) delete out.radiusMiles;
  return out;
}

/** Filters from URL search params; invalid values are dropped rather than failing the page. */
export function parseMarketplaceFilters(params: Record<string, string | string[] | undefined>): MarketplaceFilters {
  const out: Record<string, string> = {};
  for (const key of Object.keys(marketplaceFiltersSchema.shape)) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (!value) continue;
    const single = marketplaceFiltersSchema.shape[key as keyof typeof marketplaceFiltersSchema.shape].safeParse(key.endsWith("State") ? value.toUpperCase() : value);
    if (single.success && single.data !== undefined) out[key] = single.data as string;
  }
  return applyScope(out as MarketplaceFilters);
}

export interface MarketplaceListing {
  groupId: string;
  preview: LeadPreview;
  moveType: MoveType | null;
  services: Service[];
  price: NextPrice;
  /** The request's sharing-policy factors, for the credit-policy explanation. */
  policyFactorsBp: number[];
  expiresAt: Date;
  /** Another company holds the in-flight reservation; Buy will ask to retry in a few seconds. */
  purchaseInProgress: boolean;
}

interface ListingRow {
  group_id: string;
  sharing_limit: number;
  factors_bp: number[];
  expires_at: Date;
  buyer_count: number;
  first_name: string;
  origin_city: string | null;
  origin_state: string | null;
  origin_zip: string;
  dest_city: string | null;
  dest_state: string | null;
  dest_zip: string;
  move_date: string | null;
  move_date_flexible: boolean;
  move_size: MoveSize | null;
  move_type: MoveType | null;
  services: Service[];
  source_category: LeadRecord["sourceCategory"];
  created_at: Date;
  stale: boolean;
  in_progress: boolean;
}

/** The allow-listed columns: never add contact columns here. */
const LISTING_SQL = `
  select g.id as group_id, g.sharing_limit, sp.factors_bp, g.expires_at,
         (select count(*) from purchases p where p.group_id = g.id)::int as buyer_count,
         l.first_name, l.origin_city, l.origin_state, l.origin_zip, l.dest_city, l.dest_state, l.dest_zip,
         to_char(l.move_date, 'YYYY-MM-DD') as move_date, l.move_date_flexible, l.move_size, l.move_type, l.services,
         l.source_category, l.created_at,
         e.coverage_version <> c.coverage_version as stale,
         exists (select 1 from purchase_attempts a where a.group_id = g.id and a.status = 'reserved' and a.expires_at > now()) as in_progress
  from lead_eligibility e
  join companies c on c.id = e.company_id
  join lead_groups g on g.id = e.group_id
  join sharing_policies sp on sp.version = g.policy_version
  join lateral (
    select first_name, origin_city, origin_state, origin_zip, dest_city, dest_state, dest_zip, move_date,
           move_date_flexible, move_size, move_type, services, source_category, created_at, status, withdrawn_at
    from leads where group_id = g.id and is_primary order by created_at limit 1
  ) l on true
  where e.company_id = $1 and e.named_in_consent
    and company_can_purchase(c)
    and g.status = 'available' and g.expires_at > now()
    and l.status = 'qualified' and l.withdrawn_at is null
    and (select count(*) from purchases p where p.group_id = g.id) < g.sharing_limit
    and not exists (select 1 from purchases p where p.group_id = g.id and p.company_id = e.company_id)`;

async function queryListings(db: Queryable, companyId: string, options: { groupId?: string; filters?: MarketplaceFilters; limit?: number }): Promise<MarketplaceListing[]> {
  const values: unknown[] = [companyId];
  const where: string[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };
  const f = applyScope(options.filters ?? {});
  if (options.groupId) add("g.id = ?", options.groupId);
  if (f.originState) add("l.origin_state = ?", f.originState);
  if (f.destState) add("l.dest_state = ?", f.destState);
  // ZIP filters: exact, or every ZIP within the radius (haversine over the bundled centroids). An
  // unknown ZIP matches nothing rather than everything.
  const radius = f.radiusMiles ? Number(f.radiusMiles) : null;
  for (const [key, column] of [["originZip", "l.origin_zip"], ["destZip", "l.dest_zip"]] as const) {
    const zip = f[key];
    if (!zip) continue;
    if (radius) add(`${column} = any(?::text[])`, zipsWithinMiles(zip, radius) ?? []);
    else add(`${column} = ?`, zip);
  }
  if (f.moveDateFrom) add("l.move_date >= ?::date", f.moveDateFrom);
  if (f.moveDateTo) add("l.move_date <= ?::date", f.moveDateTo);
  if (f.moveSize) add("l.move_size = ?", f.moveSize);
  if (f.leadType) where.push(f.leadType === "exclusive" ? "g.sharing_limit = 1" : "g.sharing_limit > 1");
  if (f.source) add("l.source_category = ?", f.source);
  values.push(options.limit ?? 100);
  const sql = `${LISTING_SQL}${where.length ? ` and ${where.join(" and ")}` : ""} order by l.created_at desc, g.id limit $${values.length}`;
  const rows = (await db.query<ListingRow>(sql, values)).rows;
  if (rows.length === 0) return [];

  const price = await db.query<{ id: string | null; exclusive_cents: number; shared_cents: number }>(
    "select id, exclusive_cents, shared_cents from current_price($1)",
    [companyId],
  );
  const priceRow = price.rows[0];
  if (!priceRow?.id) return []; // no price configured: nothing can be bought (reserve_purchase would refuse)

  // Snapshots older than the company's coverage: list them only while the matcher still matches.
  const staleRows = rows.filter((r) => r.stale);
  const stillMatching = new Set<string>();
  if (staleRows.length) {
    const loaded = await loadMatchProfile(db, companyId);
    for (const row of staleRows) {
      const facts = loaded ? await leadFactsForGroup(db, row.group_id) : null;
      if (loaded && facts && matchCompany(loaded.profile, facts).eligible) stillMatching.add(row.group_id);
    }
  }

  const showZip = await getShowZipInPreview(db);
  const listings: MarketplaceListing[] = [];
  for (const row of rows) {
    if (row.stale && !stillMatching.has(row.group_id)) continue;
    const next = nextPrice({
      sharingLimit: row.sharing_limit,
      buyerCount: row.buyer_count,
      exclusiveCents: priceRow.exclusive_cents,
      sharedCents: priceRow.shared_cents,
      factorsBp: row.factors_bp,
    });
    if (!next) continue;
    // toPreview takes a full LeadRecord type; the contact fields were never read, so they are
    // empty here, and toPreview's allow-list does not copy them anyway.
    const record: LeadRecord = {
      id: row.group_id,
      firstName: row.first_name,
      lastName: "",
      email: "",
      phone: "",
      originCity: row.origin_city ?? "",
      originState: row.origin_state ?? "",
      originZip: row.origin_zip,
      destCity: row.dest_city ?? "",
      destState: row.dest_state ?? "",
      destZip: row.dest_zip,
      moveDate: row.move_date ?? "",
      moveDateFlexible: row.move_date_flexible,
      moveSize: row.move_size ?? "",
      sourceCategory: row.source_category,
      createdAt: row.created_at.toISOString(),
      sharingLimit: row.sharing_limit,
    };
    listings.push({
      groupId: row.group_id,
      preview: toPreview(record, { buyerCount: row.buyer_count, price: next.chargeCents, showZip }),
      moveType: row.move_type,
      services: row.services,
      price: next,
      policyFactorsBp: row.factors_bp,
      expiresAt: row.expires_at,
      purchaseInProgress: row.in_progress,
    });
  }
  return listings;
}

export interface BuyerContext {
  canPurchase: boolean;
  companyCanPurchase: boolean;
  hasPrice: boolean;
  /** Credit balance minus credit held by in-flight purchases. */
  availableCreditCents: number;
  paymentMethod: { brand: string | null; last4: string | null } | null;
}

/** What the marketplace header and purchase dialog need about the buyer. */
export async function buyerContext(db: Queryable, actor: Pick<CompanyActor, "companyId" | "role" | "canPurchase">, provider: "demo" | "stripe"): Promise<BuyerContext> {
  const result = await db.query<{ eligible: boolean; has_price: boolean; available: number; brand: string | null; last4: string | null; has_pm: boolean }>(
    `select company_can_purchase(c) as eligible,
            (select id from current_price(c.id)) is not null as has_price,
            (coalesce((select balance_cents from company_credit_balance where company_id = c.id), 0)
             - coalesce((select sum(credit_applied_cents) from purchase_attempts where company_id = c.id and status = 'reserved'), 0))::int as available,
            pm.brand, pm.last4, pm.id is not null as has_pm
     from companies c
     left join lateral (select id, brand, last4 from payment_methods
                        where company_id = c.id and provider = $2 and removed_at is null
                        order by is_default desc, created_at desc limit 1) pm on true
     where c.id = $1`,
    [actor.companyId, provider],
  );
  const row = result.rows[0];
  return {
    canPurchase: can(actor, "marketplace.purchase"),
    companyCanPurchase: row?.eligible ?? false,
    hasPrice: row?.has_price ?? false,
    availableCreditCents: Math.max(0, row?.available ?? 0),
    paymentMethod: row?.has_pm ? { brand: row.brand, last4: row.last4 } : null,
  };
}

/** Requests this company can buy now, newest first. */
export async function listAvailable(
  input: { userId: string; companyId: string },
  filters: MarketplaceFilters = {},
  db: Queryable = getPool(),
): Promise<MarketplaceListing[]> {
  const actor = await resolveActor(db, input);
  assertCan(actor, "marketplace.view");
  return queryListings(db, actor.companyId, { filters: marketplaceFiltersSchema.parse(filters) });
}

export type ListingLookup =
  | { state: "available"; listing: MarketplaceListing }
  | { state: "purchased"; purchaseId: string }
  | { state: "unavailable" };

/** One request for the detail page: available to buy, already bought by this company, or neither. */
export async function getListing(input: { userId: string; companyId: string }, groupId: string, db: Queryable = getPool()): Promise<ListingLookup> {
  const actor = await resolveActor(db, input);
  assertCan(actor, "marketplace.view");
  if (!isUuid(groupId)) return { state: "unavailable" };
  const bought = await db.query<{ id: string }>("select id from purchases where group_id = $1 and company_id = $2", [groupId, actor.companyId]);
  if (bought.rows[0]) return { state: "purchased", purchaseId: bought.rows[0].id };
  const [listing] = await queryListings(db, actor.companyId, { groupId, limit: 1 });
  return listing ? { state: "available", listing } : { state: "unavailable" };
}

export type AvailabilityStatus = "available" | "sold_out" | "expired" | "withdrawn" | "purchased" | "unavailable";

/** Real-time availability (lead lifecycle §5): only the request ID, status and buyer count. */
export interface AvailabilityRow {
  groupId: string;
  status: AvailabilityStatus;
  buyerCount: number;
  sharingLimit: number;
  /** Another company holds the in-flight reservation. */
  inProgress: boolean;
}

export const AVAILABILITY_MAX_IDS = 100;

/**
 * Status, sold count and positions for up to AVAILABILITY_MAX_IDS request groups, for the polling
 * client. Gated to the groups the company is named in (lead_eligibility.named_in_consent): any
 * other ID, and any malformed one, answers "unavailable", so the endpoint reveals nothing about
 * requests the company cannot see. The server stays authoritative on Buy.
 */
export async function availabilityFor(input: { userId: string; companyId: string }, groupIds: readonly string[], db: Queryable = getPool()): Promise<AvailabilityRow[]> {
  const actor = await resolveActor(db, input);
  assertCan(actor, "marketplace.view");
  const ids = [...new Set(groupIds.filter(isUuid))].slice(0, AVAILABILITY_MAX_IDS);
  const found = ids.length
    ? await db.query<{ id: string; status: string; expired: boolean; sharing_limit: number; buyer_count: number; purchased: boolean; in_progress: boolean; withdrawn: boolean }>(
        `select g.id, g.status, g.expires_at <= now() as expired, g.sharing_limit,
                (select count(*) from purchases p where p.group_id = g.id)::int as buyer_count,
                exists (select 1 from purchases p where p.group_id = g.id and p.company_id = $1) as purchased,
                exists (select 1 from purchase_attempts a where a.group_id = g.id and a.company_id <> $1 and a.status = 'reserved' and a.expires_at > now()) as in_progress,
                exists (select 1 from leads l where l.group_id = g.id and l.is_primary and l.withdrawn_at is not null) as withdrawn
         from lead_groups g
         join lead_eligibility e on e.group_id = g.id and e.company_id = $1 and e.named_in_consent
         where g.id = any($2::uuid[])`,
        [actor.companyId, ids],
      )
    : { rows: [] };
  const byId = new Map(found.rows.map((r) => [r.id, r]));
  return groupIds.map((groupId) => {
    const r = byId.get(groupId);
    if (!r) return { groupId, status: "unavailable", buyerCount: 0, sharingLimit: 0, inProgress: false };
    let status: AvailabilityStatus = "available";
    if (r.purchased) status = "purchased";
    else if (r.status === "withdrawn" || r.withdrawn) status = "withdrawn";
    else if (r.status === "expired" || r.expired) status = "expired";
    else if (r.status === "sold_out" || r.buyer_count >= r.sharing_limit) status = "sold_out";
    else if (r.status !== "available") status = "unavailable";
    return { groupId, status, buyerCount: r.buyer_count, sharingLimit: r.sharing_limit, inProgress: r.in_progress };
  });
}

/** Purchase dialog numbers: credit applied first, then the card (estimate; the database decides). */
export function dialogSplit(listing: MarketplaceListing, buyer: BuyerContext) {
  return splitCharge(listing.price.chargeCents, buyer.availableCreditCents);
}
