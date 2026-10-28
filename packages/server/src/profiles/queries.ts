/**
 * Directory and company-profile reads (mover verification §4–§6; site architecture §1.2, §2.5,
 * §4.5; implications §4.1–§4.4). Every claim shown on a public page comes from a dated record:
 * credentials from verification results, the movers-only claim from the latest authority check,
 * ratings from published reviews. No money input (purchases, prices, balances, plans) is read.
 */
import type { MoveSize, MoveType, Service } from "@amc/core";
import { getPool, type Queryable } from "../db/pool";
import { countyByFips, stateByCode } from "../geo/geo";
import { getSettings } from "../settings/settings";
import { fmcsaSnapshotUrl } from "../verification/run";
import {
  DIRECTORY_PAGE_SIZE,
  PROFILE_REVIEW_PREVIEW,
  REVIEWS_SUBPAGE_MIN,
  REVIEW_TYPES,
  authorityLabel,
  describeCoverage,
  isNewToNetwork,
  pageSlice,
  sortListings,
  statesServed,
  summarizeRatings,
  type CoverageRuleInput,
  type DirectorySort,
  type EvidenceLevel,
  type RatedReview,
  type RatingSummary,
  type ReviewType,
} from "./logic";

/** FMCSA Licensing and Insurance (authority and insurance filings). */
export const FMCSA_LI_URL = "https://li-public.fmcsa.dot.gov/LIVIEW/pkg_menu.prc_menu";
/** FMCSA Protect Your Move (complaint history and consumer guidance). */
export const PROTECT_YOUR_MOVE_URL = "https://www.fmcsa.dot.gov/protect-your-move";

/**
 * Official pages for the state credentials How we verify movers names. A state credential row
 * renders only with a source link, so a state missing here shows no row.
 * [Verify: these are the registration pages How we verify movers cites, not lookups.]
 */
export const STATE_CREDENTIAL_SOURCES: Record<string, { label: string; url: string }> = {
  TX: { label: "Texas DMV (TxDMV)", url: "https://www.txdmv.gov/motor-carriers/txdmv-number" },
  CA: { label: "California Bureau of Household Goods and Services", url: "https://www.bhgs.dca.ca.gov/" },
  FL: { label: "Florida Department of Agriculture and Consumer Services", url: "https://www.fdacs.gov/Business-Services/Moving-Companies" },
  NY: { label: "New York State Department of Transportation", url: "https://www.dot.ny.gov/" },
};

/** The federal checks the badge and the "last checked" date rest on (ST-5; mover verification §3). */
const FEDERAL_CHECKS = ["usdot_active", "authority_type", "authority_status", "insurance_filings"] as const;

export interface Listing {
  companyId: string;
  slug: string;
  displayName: string;
  isDemo: boolean;
  usdot: string | null;
  /** Shown while the MC rule is on and the company has one on record (site architecture §1.2). */
  mcNumber: string | null;
  basedIn: { city: string; state: string; stateName: string } | null;
  website: string | null;
  joinedAt: Date | null;
  isNew: boolean;
  /** The screening badge, shown only while it is active and the latest federal checks passed. */
  badge: { verifiedDate: Date } | null;
  /** "No broker authority" may render only while the latest authority check passed (implications §4.1). */
  noBrokerClaim: boolean;
  /** Where the verification data came from: recorded demo fixtures or the live FMCSA service. */
  checkSource: "fixture" | "live" | null;
  ratings: Record<ReviewType, RatingSummary>;
  services: Service[];
  moveTypes: MoveType[];
  moveSizes: MoveSize[];
  coverage: { serves: string[]; excludes: string[] };
  statesServed: string[];
}

interface CompanyRow {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  is_demo: boolean;
  usdot_number: string | null;
  mc_number: string | null;
  has_broker_authority: boolean;
  address_city: string | null;
  address_state: string | null;
  website: string | null;
  network_joined_at: Date | null;
  approved_at: Date | null;
}

const LISTED = `c.status = 'approved' and p.public_status = 'live' and c.billing_status <> 'suspended' and not c.has_broker_authority`;

const COMPANY_COLUMNS = `c.id, p.slug, p.display_name, p.description, c.is_demo, c.usdot_number, c.mc_number, c.has_broker_authority,
  c.address_city, c.address_state, coalesce(p.website, c.website) as website, p.network_joined_at, c.approved_at`;

/** Only http(s) websites are shown or linked. */
function safeWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

interface Extras {
  checks: Map<string, Map<string, { result: string; source: string; retrievedAt: Date }>>;
  badges: Set<string>;
  reviews: Map<string, RatedReview[]>;
  capabilities: Map<string, { moveTypes: MoveType[]; moveSizes: MoveSize[]; services: Service[] }>;
  rules: Map<string, CoverageRuleInput[]>;
}

async function loadExtras(ids: string[], db: Queryable): Promise<Extras> {
  const [checks, badges, reviews, capabilities, rules] = await Promise.all([
    db.query<{ company_id: string; check_type: string; result: string; source: string; retrieved_at: Date }>(
      `select distinct on (company_id, check_type) company_id, check_type, result, source, retrieved_at
       from verification_checks where company_id = any($1::uuid[]) and check_type = any($2::text[])
       order by company_id, check_type, created_at desc, retrieved_at desc`,
      [ids, FEDERAL_CHECKS],
    ),
    db.query<{ company_id: string }>(
      `select distinct company_id from badges where company_id = any($1::uuid[]) and revoked_at is null and issued_at <= now()`,
      [ids],
    ),
    db.query<{ company_id: string; review_type: ReviewType; rating: number; evidence_level: EvidenceLevel; published_at: Date }>(
      `select company_id, review_type, rating, evidence_level, published_at from reviews
       where company_id = any($1::uuid[]) and status = 'published' and published_at is not null`,
      [ids],
    ),
    db.query<{ company_id: string; move_types: MoveType[]; move_sizes: MoveSize[]; services: Service[] }>(
      `select company_id, move_types, move_sizes, services from company_capabilities where company_id = any($1::uuid[])`,
      [ids],
    ),
    db.query<{ company_id: string; id: string; kind: "include" | "exclude"; paused: boolean; move_types: MoveType[]; side: string | null; level: string | null; value: string | null }>(
      `select r.company_id, r.id, r.kind, r.paused, r.move_types, l.side, l.level, l.value
       from coverage_rules r left join coverage_rule_locations l on l.rule_id = r.id
       where r.company_id = any($1::uuid[]) order by r.created_at, r.id, l.side, l.level, l.value`,
      [ids],
    ),
  ]);

  const checkMap: Extras["checks"] = new Map();
  for (const row of checks.rows) {
    const forCompany = checkMap.get(row.company_id) ?? new Map();
    forCompany.set(row.check_type, { result: row.result, source: row.source, retrievedAt: row.retrieved_at });
    checkMap.set(row.company_id, forCompany);
  }
  const reviewMap: Extras["reviews"] = new Map();
  for (const row of reviews.rows) {
    const list = reviewMap.get(row.company_id) ?? [];
    list.push({ reviewType: row.review_type, rating: row.rating, evidenceLevel: row.evidence_level, publishedAt: row.published_at });
    reviewMap.set(row.company_id, list);
  }
  const ruleMap: Extras["rules"] = new Map();
  const byRule = new Map<string, CoverageRuleInput>();
  for (const row of rules.rows) {
    let rule = byRule.get(row.id);
    if (!rule) {
      rule = {
        kind: row.kind,
        paused: row.paused,
        moveTypes: row.move_types,
        origin: { states: [], counties: [], zips: [] },
        destination: { states: [], counties: [], zips: [] },
      };
      byRule.set(row.id, rule);
      const list = ruleMap.get(row.company_id) ?? [];
      list.push(rule);
      ruleMap.set(row.company_id, list);
    }
    if (row.side && row.level && row.value) {
      const set = row.side === "origin" ? rule.origin : rule.destination;
      (row.level === "state" ? set.states : row.level === "county" ? set.counties : set.zips).push(row.value);
    }
  }
  return {
    checks: checkMap,
    badges: new Set(badges.rows.map((r) => r.company_id)),
    reviews: reviewMap,
    capabilities: new Map(capabilities.rows.map((r) => [r.company_id, { moveTypes: r.move_types, moveSizes: r.move_sizes, services: r.services }])),
    rules: ruleMap,
  };
}

const coverageNames = {
  state: (code: string) => stateByCode(code)?.name ?? code,
  county: (fips: string) => {
    const county = countyByFips(fips);
    return county ? `${county.name}, ${county.state}` : `county ${fips}`;
  },
};

function toListing(row: CompanyRow, extras: Extras, settings: { requireMc: boolean; newDays: number }, now: Date): Listing {
  const checks = extras.checks.get(row.id) ?? new Map<string, { result: string; source: string; retrievedAt: Date }>();
  const federal = FEDERAL_CHECKS.map((type) => checks.get(type));
  const federalPass = federal.every((c) => c?.result === "pass");
  const verifiedDate = federalPass ? new Date(Math.max(...federal.map((c) => c!.retrievedAt.getTime()))) : null;
  const authority = checks.get("authority_type");
  const reviews = extras.reviews.get(row.id) ?? [];
  const caps = extras.capabilities.get(row.id) ?? { moveTypes: [], moveSizes: [], services: [] };
  const rules = extras.rules.get(row.id) ?? [];
  const state = row.address_state ? stateByCode(row.address_state) : null;
  const anySource = federal.find((c) => c)?.source ?? null;
  return {
    companyId: row.id,
    slug: row.slug,
    displayName: row.display_name,
    isDemo: row.is_demo,
    usdot: row.usdot_number,
    mcNumber: settings.requireMc ? row.mc_number : null,
    basedIn: row.address_city && row.address_state ? { city: row.address_city, state: row.address_state, stateName: state?.name ?? row.address_state } : null,
    website: safeWebsite(row.website),
    joinedAt: row.network_joined_at ?? row.approved_at,
    isNew: isNewToNetwork(row.network_joined_at ?? row.approved_at, settings.newDays, now),
    badge: extras.badges.has(row.id) && verifiedDate ? { verifiedDate } : null,
    noBrokerClaim: !row.has_broker_authority && authority?.result === "pass",
    checkSource: anySource === null ? null : anySource === "fixture" ? "fixture" : "live",
    ratings: Object.fromEntries(REVIEW_TYPES.map((t) => [t, summarizeRatings(reviews, t, now)])) as Record<ReviewType, RatingSummary>,
    services: caps.services,
    moveTypes: caps.moveTypes,
    moveSizes: caps.moveSizes,
    coverage: describeCoverage(rules, caps.moveTypes, coverageNames),
    statesServed: statesServed(rules),
  };
}

export interface DirectoryPage {
  listings: Listing[];
  page: number;
  totalPages: number;
  total: number;
  sort: DirectorySort;
  rankMinReviews: number;
}

/**
 * One page of the directory: approved companies with live profiles, in good standing and with no
 * broker authority, sorted by the published rule. Null when the page is past the end.
 */
export async function listDirectory(
  input: { page?: number; sort?: DirectorySort } = {},
  db: Queryable = getPool(),
  now: Date = new Date(),
): Promise<DirectoryPage | null> {
  const page = input.page ?? 1;
  const sort = input.sort ?? "name";
  const settings = await getSettings(db);
  const companies = await db.query<CompanyRow>(
    `select ${COMPANY_COLUMNS} from companies c join company_profiles p on p.company_id = c.id where ${LISTED}`,
  );
  const extras = await loadExtras(companies.rows.map((r) => r.id), db);
  const all = companies.rows.map((row) =>
    toListing(row, extras, { requireMc: settings.require_mc_number, newDays: settings.new_to_network_days }, now),
  );
  const sorted = sortListings(all, sort, settings.rank_min_reviews);
  const slice = pageSlice(sorted, page, DIRECTORY_PAGE_SIZE);
  if (!slice) return null;
  return { listings: slice.items, page, totalPages: slice.totalPages, total: all.length, sort, rankMinReviews: settings.rank_min_reviews };
}

export interface CredentialRowData {
  key: string;
  label: string;
  value: string;
  status: "verified" | "rechecking";
  checkedAt: Date;
  sourceLabel: string;
  sourceUrl: string;
}

export interface PublicReview {
  id: string;
  reviewType: ReviewType;
  rating: number;
  title: string | null;
  body: string | null;
  reviewerName: string;
  originState: string | null;
  destState: string | null;
  evidenceLevel: EvidenceLevel;
  publishedAt: Date;
  incentiveDisclosure: string | null;
  response: { body: string; postedAt: Date } | null;
}

export interface Profile extends Listing {
  description: string | null;
  credentials: CredentialRowData[];
  /** Newest first. On the profile, at most PROFILE_REVIEW_PREVIEW once the reviews page exists. */
  reviews: PublicReview[];
  publishedReviewCount: number;
  /** /companies/{slug}/reviews/ exists only at REVIEWS_SUBPAGE_MIN eligible reviews. */
  hasReviewsPage: boolean;
  /** Eligible reviews across both experiences (the count the reviews page threshold uses). */
  eligibleReviewCount: number;
  reviewsSubpageMin: number;
}

export type ProfileResult =
  | { kind: "live"; profile: Profile }
  /** Suspended or under review: 200 with a neutral status notice, noindex (site architecture §2.5). */
  | { kind: "suspended"; slug: string; displayName: string; isDemo: boolean; usdot: string | null };

async function credentialRows(row: CompanyRow, listing: Listing, db: Queryable): Promise<CredentialRowData[]> {
  const [credentials, authorities, authorityCheck] = await Promise.all([
    db.query<{ credential_type: string; number: string | null; state: string | null; issuer: string | null; status: string; verified_at: Date | null }>(
      `select distinct on (credential_type, coalesce(state, '')) credential_type, number, state, issuer, status, verified_at
       from credentials where company_id = $1 and credential_type in ('usdot', 'docket', 'state_license', 'insurance_filing')
       order by credential_type, coalesce(state, ''), created_at desc`,
      [row.id],
    ),
    db.query<{ docket_number: string; authority_type: "common" | "contract" | "broker"; scope: "household_goods" | "property"; status: string }>(
      `select distinct on (docket_number, authority_type) docket_number, authority_type, scope, status
       from authority_records where company_id = $1 order by docket_number, authority_type, created_at desc`,
      [row.id],
    ),
    db.query<{ result: string; retrieved_at: Date }>(
      `select result, retrieved_at from verification_checks where company_id = $1 and check_type = 'authority_type'
       order by created_at desc, retrieved_at desc limit 1`,
      [row.id],
    ),
  ]);
  const out: CredentialRowData[] = [];
  const find = (type: string) => credentials.rows.find((c) => c.credential_type === type);
  const status = (s: string): CredentialRowData["status"] | null => (s === "verified" ? "verified" : s === "pending" ? "rechecking" : null);

  const usdot = find("usdot");
  if (usdot?.number && usdot.verified_at && status(usdot.status)) {
    out.push({
      key: "usdot", label: "USDOT number", value: usdot.number, status: status(usdot.status)!, checkedAt: usdot.verified_at,
      sourceLabel: "FMCSA company snapshot (SAFER)", sourceUrl: fmcsaSnapshotUrl(usdot.number),
    });
  }
  const docket = find("docket");
  if (listing.mcNumber && docket?.number && docket.verified_at && status(docket.status)) {
    out.push({
      key: "mc", label: "MC number", value: docket.number, status: status(docket.status)!, checkedAt: docket.verified_at,
      sourceLabel: "FMCSA Licensing and Insurance", sourceUrl: FMCSA_LI_URL,
    });
  }
  const check = authorityCheck.rows[0];
  if (check?.result === "pass") {
    for (const grant of authorities.rows) {
      if (grant.authority_type === "broker" || grant.status !== "active") continue;
      out.push({
        key: `authority-${grant.docket_number}-${grant.authority_type}`, label: "Operating authority",
        value: `${authorityLabel(grant.authority_type, grant.scope)} (${grant.docket_number})`, status: "verified",
        checkedAt: check.retrieved_at, sourceLabel: "FMCSA Licensing and Insurance", sourceUrl: FMCSA_LI_URL,
      });
    }
    const brokerOnRecord = authorities.rows.some((a) => a.authority_type === "broker" && a.status !== "revoked");
    if (listing.noBrokerClaim && !brokerOnRecord) {
      out.push({
        key: "no-broker", label: "Broker authority", value: "No broker authority on record", status: "verified",
        checkedAt: check.retrieved_at, sourceLabel: "FMCSA Licensing and Insurance", sourceUrl: FMCSA_LI_URL,
      });
    }
  }
  const filing = find("insurance_filing");
  if (filing?.verified_at && status(filing.status)) {
    out.push({
      key: "insurance", label: "Insurance filings", value: "The federal insurance filings required for its authority are on record",
      status: status(filing.status)!, checkedAt: filing.verified_at, sourceLabel: "FMCSA Licensing and Insurance", sourceUrl: FMCSA_LI_URL,
    });
  }
  for (const license of credentials.rows.filter((c) => c.credential_type === "state_license")) {
    const source = license.state ? STATE_CREDENTIAL_SOURCES[license.state] : undefined;
    if (!source || !license.number || !license.verified_at || license.status !== "verified") continue;
    out.push({
      key: `state-${license.state}`, label: `State credential (${stateByCode(license.state!)?.name ?? license.state})`,
      value: license.number, status: "verified", checkedAt: license.verified_at, sourceLabel: source.label, sourceUrl: source.url,
    });
  }
  return out;
}

async function publishedReviews(companyId: string, db: Queryable, limit: number | null): Promise<PublicReview[]> {
  const rows = await db.query<{
    id: string; review_type: ReviewType; rating: number; title: string | null; body: string | null; reviewer_display_name: string;
    origin_state: string | null; dest_state: string | null; evidence_level: EvidenceLevel; published_at: Date;
    incentive_disclosure: string | null; response_body: string | null; response_at: Date | null;
  }>(
    `select r.id, r.review_type, r.rating, r.title, r.body, r.reviewer_display_name, r.origin_state, r.dest_state, r.evidence_level,
            r.published_at, r.incentive_disclosure, resp.body as response_body, resp.created_at as response_at
     from reviews r
     left join lateral (
       select body, created_at from review_responses
       where review_id = r.id and company_id = r.company_id and status = 'published'
       order by created_at desc limit 1
     ) resp on true
     where r.company_id = $1 and r.status = 'published' and r.published_at is not null
     order by r.published_at desc, r.id
     ${limit === null ? "" : "limit $2"}`,
    limit === null ? [companyId] : [companyId, limit],
  );
  return rows.rows.map((r) => ({
    id: r.id,
    reviewType: r.review_type,
    rating: r.rating,
    title: r.title,
    body: r.body,
    reviewerName: r.reviewer_display_name,
    originState: r.origin_state,
    destState: r.dest_state,
    evidenceLevel: r.evidence_level,
    publishedAt: r.published_at,
    incentiveDisclosure: r.incentive_disclosure,
    response: r.response_body && r.response_at ? { body: r.response_body, postedAt: r.response_at } : null,
  }));
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A company profile by slug: the full profile for a listed company, the neutral status notice for
 * one that is suspended or under review, and null (404) for anything never approved or hidden.
 */
export async function getProfile(slug: string, db: Queryable = getPool(), now: Date = new Date()): Promise<ProfileResult | null> {
  if (!SLUG.test(slug) || slug.length > 120) return null;
  const found = await db.query<CompanyRow & { status: string; public_status: string; billing_status: string }>(
    `select ${COMPANY_COLUMNS}, c.status, p.public_status, c.billing_status
     from companies c join company_profiles p on p.company_id = c.id where p.slug = $1`,
    [slug],
  );
  const row = found.rows[0];
  if (!row) return null;
  const listed = row.status === "approved" && row.public_status === "live" && row.billing_status !== "suspended" && !row.has_broker_authority;
  if (!listed) {
    // Only a company that was once approved has a public profile to keep (site architecture §2.5).
    const wasApproved = row.approved_at !== null || row.network_joined_at !== null;
    if (!wasApproved || row.public_status === "hidden" || row.status === "rejected") return null;
    return { kind: "suspended", slug: row.slug, displayName: row.display_name, isDemo: row.is_demo, usdot: row.usdot_number };
  }
  const settings = await getSettings(db);
  const extras = await loadExtras([row.id], db);
  const listing = toListing(row, extras, { requireMc: settings.require_mc_number, newDays: settings.new_to_network_days }, now);
  const eligible = listing.ratings.quote_experience.count + listing.ratings.move_experience.count;
  const hasReviewsPage = eligible >= REVIEWS_SUBPAGE_MIN;
  const [credentials, reviews, publishedCount] = await Promise.all([
    credentialRows(row, listing, db),
    publishedReviews(row.id, db, hasReviewsPage ? PROFILE_REVIEW_PREVIEW : null),
    db.query<{ n: number }>(`select count(*)::int as n from reviews where company_id = $1 and status = 'published'`, [row.id]),
  ]);
  return {
    kind: "live",
    profile: {
      ...listing,
      description: row.description,
      credentials,
      reviews,
      publishedReviewCount: publishedCount.rows[0]?.n ?? 0,
      hasReviewsPage,
      eligibleReviewCount: eligible,
      reviewsSubpageMin: REVIEWS_SUBPAGE_MIN,
    },
  };
}

/** Every published review for the /reviews/ page, or null when the page must not exist. */
export async function getProfileReviews(slug: string, db: Queryable = getPool(), now: Date = new Date()): Promise<{ profile: Profile; reviews: PublicReview[] } | null> {
  const result = await getProfile(slug, db, now);
  if (!result || result.kind !== "live" || !result.profile.hasReviewsPage) return null;
  return { profile: result.profile, reviews: await publishedReviews(result.profile.companyId, db, null) };
}

/** A listed company with this USDOT number, for "in our network" on verify-a-mover. */
export async function listedProfileByUsdot(usdot: string, db: Queryable = getPool()): Promise<{ slug: string; displayName: string } | null> {
  const found = await db.query<{ slug: string; display_name: string }>(
    `select p.slug, p.display_name from companies c join company_profiles p on p.company_id = c.id
     where c.usdot_number = $1 and ${LISTED} limit 1`,
    [usdot],
  );
  const row = found.rows[0];
  return row ? { slug: row.slug, displayName: row.display_name } : null;
}
