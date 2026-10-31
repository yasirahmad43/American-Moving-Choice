/**
 * Read-only, contact-free growth aggregates. The caller must authorize the admin before calling.
 * These are stored request/content counts, not Google visitors, conversion rates or indexed pages.
 */
import { cleanAttributionPath, cleanCampaignLabel } from "@amc/core";
import { getPool, type Queryable } from "../db/pool";

export interface GrowthSnapshotOptions { touch: "first" | "last" }
export interface GrowthSnapshot {
  generatedAt: string;
  timezone: "America/New_York";
  touch: "first" | "last";
  requests: {
    today: number; last24Hours: number; last7Days: number; last30Days: number;
    last15Minutes: number; lastHour: number; latestAt: string | null;
    byStatus: { status: string; count: number }[];
  };
  daily: { date: string; requests: number }[];
  sources: { source: string; label: string; requests: number }[];
  campaigns: { source: string; medium: string; campaign: string; requests: number }[];
  attribution: { total: number; measured: number; unattributed: number };
  landingPages: { path: string; requests: number }[];
  seo: {
    total: number; published: number; indexable: number; blocked: number;
    latestChangeAt: string | null;
    families: { family: string; published: number; indexable: number; blocked: number }[];
  };
}

const TIMEZONE = "America/New_York" as const;
const STATUSES = ["submitted", "needs_review", "qualified", "unmatched", "rejected"] as const;
const FAMILIES = ["state", "city", "zip", "route", "service", "cost", "question", "planning", "mover-profile"] as const;
const SOURCES: Record<string, string> = {
  organic_search: "Organic search", paid_search: "Paid search", paid_social: "Paid social",
  referral: "Referral", direct: "Direct / unattributed", other: "Other",
};
const OWN_ORIGINS = ["https://www.americanmovingchoice.com", "https://americanmovingchoice.com", "https://amc-web-three.vercel.app"];
const PUBLIC_PATHS = ["/", "/about/", "/contact/", "/privacy/", "/terms/", "/complaints/", "/report-a-concern/", "/verify-a-mover/", "/get-quotes/", "/moving-cost-calculator/", "/moving-cost-calculator/method/", "/which-companies-receive-my-request/", "/how-we-verify-movers/", "/movers-vs-brokers/", "/review-methodology/", "/editorial-policy/", "/explore/"];
const safeSource = (value: unknown): string => typeof value === "string" && Object.hasOwn(SOURCES, value) ? value : "other";
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rowsOf = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(object) : [];

function count(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Growth aggregate unavailable");
  return n;
}
function iso(value: unknown): string | null {
  if (!(value instanceof Date) && typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function label(value: unknown): string | null {
  const cleaned = cleanCampaignLabel(value);
  // Even older stored labels must not expose a phone number or an opaque capability/click token.
  return cleaned && !/[0-9]{3}[ .-]*[0-9]{3}[ .-]*[0-9]{4}/u.test(cleaned)
    && !/^[A-Za-z0-9_-]{32,}$/u.test(cleaned) ? cleaned : null;
}
function trendDays(at: Date): string[] {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const day = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  return Array.from({ length: 14 }, (_, i) => new Date(day.getTime() - (13 - i) * 86_400_000).toISOString().slice(0, 10));
}

/** Fixed column names only; no request text is interpolated into SQL. */
function campaignSql(column: "utm_source" | "utm_medium" | "utm_campaign"): string {
  const v = `btrim(a.${column})`;
  return `case when length(${v}) between 1 and 100 and ${v} ~ '^[A-Za-z0-9 ._~+-]+$'
    and ${v} !~* '(www[.]|sk-ant-|sb_secret_|github_pat_)'
    and ${v} !~ '[0-9]{3}[ .-]*[0-9]{3}[ .-]*[0-9]{4}'
    and ${v} !~ '^[A-Za-z0-9_-]{32,}$' then ${v} end`;
}

const ACQUISITION_SQL = `/* growth:acquisition */
with cohort as materialized (
  select coalesce(a.source_category, 'direct') as source,
         a.evidence_level in ('observed', 'referrer_inferred') as measured,
         ${campaignSql("utm_source")} as utm_source, ${campaignSql("utm_medium")} as utm_medium,
         ${campaignSql("utm_campaign")} as utm_campaign,
         case when a.evidence_level in ('observed', 'referrer_inferred') then
           split_part(split_part(case
             when a.landing_url ~ '^https://((www[.])?americanmovingchoice[.]com|amc-web-three[.]vercel[.]app)/'
               then regexp_replace(a.landing_url, '^https://[^/]+', '')
             when a.landing_url ~ '^/[^/]' or a.landing_url = '/' then a.landing_url
           end, '?', 1), '#', 1) end as raw_path
  from leads l left join attribution_touches a on a.lead_id = l.id and a.touch = $2
  where l.created_at >= $1::timestamptz - interval '720 hours' and l.created_at <= $1::timestamptz
), paths as (
  select *, case when raw_path = '/' or right(raw_path, 1) = '/' then raw_path else raw_path || '/' end as path from cohort
)
select count(*)::int as total, count(*) filter (where measured)::int as measured,
       count(*) filter (where measured is not true)::int as unattributed,
       coalesce((select jsonb_agg(s order by s.requests desc, s.source) from (
         select source, count(*)::int as requests from cohort group by source
       ) s), '[]'::jsonb) as sources,
       coalesce((select jsonb_agg(c order by c.requests desc, c.source, c.medium, c.campaign) from (
         select utm_source as source, utm_medium as medium, utm_campaign as campaign, count(*)::int as requests
         from cohort where utm_source is not null or utm_medium is not null or utm_campaign is not null
         group by utm_source, utm_medium, utm_campaign
         order by requests desc, utm_source nulls last, utm_medium nulls last, utm_campaign nulls last limit 10
       ) c), '[]'::jsonb) as campaigns,
       coalesce((select jsonb_agg(p order by p.requests desc, p.path) from (
         select path, count(*)::int as requests from paths where length(path) <= 300 and
           (path = any($3::text[]) or path ~ '^/(movers|routes|services|planning|questions|moving-costs)/([a-z0-9-]+/)*$')
         group by path order by requests desc, path limit 10
       ) p), '[]'::jsonb) as landing_pages
from cohort`;

/** Auth is intentionally the route/page's responsibility, matching the other admin read models. */
export async function growthSnapshot(options: GrowthSnapshotOptions, db: Queryable = getPool()): Promise<GrowthSnapshot> {
  if (options.touch !== "first" && options.touch !== "last") throw new RangeError("Invalid attribution touch");
  const at = new Date(), generatedAt = at.toISOString(), touch = options.touch;
  // One timestamp binds every read to the same windows, including an Eastern midnight/DST change.
  const [summary, statuses, daily, acquisition, seoRows] = await Promise.all([
    db.query(`/* growth:requests */
      select count(*) filter (where created_at >= ($1::timestamptz at time zone 'America/New_York')::date::timestamp at time zone 'America/New_York')::int as today,
             count(*) filter (where created_at >= $1::timestamptz - interval '24 hours')::int as last_24_hours,
             count(*) filter (where created_at >= $1::timestamptz - interval '168 hours')::int as last_7_days,
             count(*)::int as last_30_days,
             count(*) filter (where created_at >= $1::timestamptz - interval '15 minutes')::int as last_15_minutes,
             count(*) filter (where created_at >= $1::timestamptz - interval '1 hour')::int as last_hour,
             (select max(created_at) from leads where created_at <= $1::timestamptz) as latest_at
      from leads where created_at >= $1::timestamptz - interval '720 hours' and created_at <= $1::timestamptz`, [generatedAt]),
    db.query(`/* growth:statuses */ select status, count(*)::int as count from leads
      where created_at >= $1::timestamptz - interval '720 hours' and created_at <= $1::timestamptz group by status`, [generatedAt]),
    db.query(`/* growth:daily */ with days as (
        select ($1::timestamptz at time zone 'America/New_York')::date - 13 + n as day from generate_series(0, 13) n
      ), recent as (
        select created_at from leads where created_at >= ((($1::timestamptz at time zone 'America/New_York')::date - 13)::timestamp at time zone 'America/New_York')
          and created_at <= $1::timestamptz
      )
      select to_char(d.day, 'YYYY-MM-DD') as date, count(r.created_at)::int as requests
      from days d left join recent r on (r.created_at at time zone 'America/New_York')::date = d.day
      group by d.day order by d.day`, [generatedAt]),
    db.query(ACQUISITION_SQL, [generatedAt, touch, PUBLIC_PATHS]),
    db.query(`/* growth:seo */ select family, count(*)::int as total,
        count(*) filter (where status = 'published')::int as published,
        count(*) filter (where status = 'published' and indexable)::int as indexable,
        count(*) filter (where blocked_reason is not null)::int as blocked, max(updated_at) as latest_at
      from seo_pages group by family order by family`),
  ]);
  const r = object(summary.rows[0]), a = object(acquisition.rows[0]);
  const dailyCounts = new Map(daily.rows.map(row => [String(row.date), count(row.requests)]));
  const statusCounts = new Map(statuses.rows.map(row => [String(row.status), count(row.count)]));
  const sourceCounts = new Map<string, number>();
  for (const row of rowsOf(a.sources)) {
    const key = safeSource(row.source);
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + count(row.requests));
  }
  const campaigns = new Map<string, GrowthSnapshot["campaigns"][number]>();
  for (const row of rowsOf(a.campaigns)) {
    const source = label(row.source), medium = label(row.medium), campaign = label(row.campaign);
    if (!source && !medium && !campaign) continue;
    const entry = { source: source ?? "Not recorded", medium: medium ?? "Not recorded", campaign: campaign ?? "Not recorded", requests: count(row.requests) };
    const key = JSON.stringify([entry.source, entry.medium, entry.campaign]);
    entry.requests += campaigns.get(key)?.requests ?? 0;
    campaigns.set(key, entry);
  }
  const paths = new Map<string, number>();
  for (const row of rowsOf(a.landing_pages)) {
    const path = cleanAttributionPath(row.path, OWN_ORIGINS);
    if (path) paths.set(path, (paths.get(path) ?? 0) + count(row.requests));
  }
  const families: GrowthSnapshot["seo"]["families"] = [];
  let total = 0, published = 0, indexable = 0, blocked = 0, latestChangeAt: string | null = null;
  for (const row of seoRows.rows) {
    if (!(FAMILIES as readonly unknown[]).includes(row.family)) continue;
    const entry = { family: String(row.family), published: count(row.published), indexable: count(row.indexable), blocked: count(row.blocked) };
    total += count(row.total); published += entry.published; indexable += entry.indexable; blocked += entry.blocked;
    const changed = iso(row.latest_at);
    if (changed && (!latestChangeAt || changed > latestChangeAt)) latestChangeAt = changed;
    families.push(entry);
  }
  return {
    generatedAt, timezone: TIMEZONE, touch,
    requests: {
      today: count(r.today), last24Hours: count(r.last_24_hours), last7Days: count(r.last_7_days), last30Days: count(r.last_30_days),
      last15Minutes: count(r.last_15_minutes), lastHour: count(r.last_hour), latestAt: iso(r.latest_at),
      byStatus: STATUSES.map(status => ({ status, count: statusCounts.get(status) ?? 0 })),
    },
    daily: trendDays(at).map(date => ({ date, requests: dailyCounts.get(date) ?? 0 })),
    sources: [...sourceCounts].map(([source, requests]) => ({ source, label: SOURCES[source]!, requests })).sort((x, y) => y.requests - x.requests || x.source.localeCompare(y.source)),
    campaigns: [...campaigns.values()].sort((x, y) => y.requests - x.requests || x.campaign.localeCompare(y.campaign)).slice(0, 10),
    attribution: { total: count(a.total), measured: count(a.measured), unattributed: count(a.unattributed) },
    landingPages: [...paths].map(([path, requests]) => ({ path, requests })).sort((x, y) => y.requests - x.requests || x.path.localeCompare(y.path)).slice(0, 10),
    seo: { total, published, indexable, blocked, latestChangeAt, families },
  };
}
