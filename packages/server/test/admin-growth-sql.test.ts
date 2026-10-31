/**
 * Executes the actual aggregate SQL against inline relations. No table fixtures, contacts,
 * inserts, resets, migrations or provider calls: these CTEs shadow every queried relation.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { growthSnapshot } from "../src/admin/growth";
import { closePool, getPool, type Queryable } from "../src/db/pool";

const lead = (n: number, created_at: string, status = "qualified") => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, created_at, status,
});
const leads = [
  lead(1, "2026-10-01T12:00:00Z"),
  lead(2, "2026-10-31T03:59:00Z"),
  lead(3, "2026-10-31T23:59:00Z", "needs_review"),
  lead(4, "2026-11-01T03:59:00Z", "unmatched"),
  lead(5, "2026-11-01T04:00:00Z"),
  lead(6, "2026-11-01T06:20:00Z"),
  lead(7, "2026-11-01T06:31:00Z"),
];
const touch = (n: number, kind: "first" | "last", extra: Record<string, unknown>) => ({
  lead_id: leads[n - 1]!.id, touch: kind, source_category: "organic_search",
  evidence_level: "referrer_inferred", landing_url: "https://www.americanmovingchoice.com/movers/texas/", ...extra,
});
const attribution = [
  touch(2, "first", { source_category: "paid_search", evidence_level: "observed", utm_source: "google", utm_medium: "cpc", utm_campaign: "Autumn moves", landing_url: "https://www.americanmovingchoice.com/" }),
  touch(2, "last", { landing_url: "https://www.americanmovingchoice.com/movers/new-york/" }),
  touch(3, "first", { landing_url: "https://www.americanmovingchoice.com/routes/california-to-texas/" }),
  touch(3, "last", { source_category: "paid_search", evidence_level: "observed", utm_source: "person@example.invalid", utm_medium: "cpc", utm_campaign: "301-555-0199", landing_url: "https://www.americanmovingchoice.com/my-request/" + "Q".repeat(43) + "/" }),
  touch(5, "first", { source_category: "direct", evidence_level: "unknown", landing_url: "https://www.americanmovingchoice.com/get-quotes/" }),
  touch(5, "last", { source_category: "direct", evidence_level: "unknown", landing_url: "https://www.americanmovingchoice.com/get-quotes/" }),
  touch(6, "first", { landing_url: "https://www.americanmovingchoice.com/movers/texas/?utm_campaign=private#fragment" }),
  touch(6, "last", { utm_source: "Q".repeat(43), utm_medium: "organic", utm_campaign: "sb_secret_should_not_leak", landing_url: "https://www.americanmovingchoice.com/movers/texas/?utm_campaign=private#fragment" }),
];
const seo = [
  { family: "city", status: "published", indexable: true, blocked_reason: null, updated_at: "2026-10-31T00:00:00Z" },
  { family: "city", status: "draft", indexable: true, blocked_reason: "Missing evidence", updated_at: "2026-10-30T00:00:00Z" },
  { family: "question", status: "published", indexable: false, blocked_reason: null, updated_at: "2026-11-01T00:00:00Z" },
];

/** The only SQL execution is SELECT over these inline synthetic relations. */
const inlineDb: Queryable = {
  async query(text, supplied = []) {
    const values = [...supplied];
    const relation = (name: string, fields: string, records: unknown[]) => {
      values.push(JSON.stringify(records));
      return `${name} as (select * from jsonb_to_recordset($${values.length}::jsonb) as r(${fields}))`;
    };
    const relations = [
      relation("leads", "id uuid, created_at timestamptz, status text", leads),
      relation("attribution_touches", "lead_id uuid, touch text, source_category text, evidence_level text, utm_source text, utm_medium text, utm_campaign text, landing_url text", attribution),
      relation("seo_pages", "family text, status text, indexable boolean, blocked_reason text, updated_at timestamptz", seo),
    ];
    const body = text.replace(/^\s*\/\*[\s\S]*?\*\//u, "").trim();
    const sql = `with ${relations.join(", ")}${/^with\s/iu.test(body) ? ", " + body.replace(/^with\s+/iu, "") : " " + body}`;
    return getPool().query(sql, values);
  },
};

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-01T06:30:00Z")); });
afterEach(() => vi.useRealTimers());
afterAll(async () => closePool());

describe("growth SQL over inline read-only records", () => {
  it("counts Eastern midnight, repeated DST hour, rolling windows and excludes future/old rows", async () => {
    const result = await growthSnapshot({ touch: "last" }, inlineDb);
    expect(result.requests).toMatchObject({
      today: 2, last24Hours: 4, last7Days: 5, last30Days: 5,
      last15Minutes: 1, lastHour: 1, latestAt: "2026-11-01T06:20:00.000Z",
    });
    expect(result.requests.byStatus).toContainEqual({ status: "qualified", count: 3 });
    expect(result.daily).toHaveLength(14);
    expect(result.daily[0]).toEqual({ date: "2026-10-19", requests: 0 });
    expect(result.daily.slice(-3)).toEqual([
      { date: "2026-10-30", requests: 1 }, { date: "2026-10-31", requests: 2 }, { date: "2026-11-01", requests: 2 },
    ]);
  });

  it("counts each submission once for either touch and separates missing/unknown attribution", async () => {
    for (const selected of ["first", "last"] as const) {
      const result = await growthSnapshot({ touch: selected }, inlineDb);
      expect(result.attribution).toEqual({ total: 5, measured: 3, unattributed: 2 });
      expect(result.sources.reduce((sum, row) => sum + row.requests, 0)).toBe(5);
      expect(result.sources.find(row => row.source === "direct")).toEqual({ source: "direct", label: "Direct / unattributed", requests: 2 });
    }
    const first = await growthSnapshot({ touch: "first" }, inlineDb);
    const last = await growthSnapshot({ touch: "last" }, inlineDb);
    expect(first.campaigns).toContainEqual({ source: "google", medium: "cpc", campaign: "Autumn moves", requests: 1 });
    expect(last.campaigns).not.toContainEqual({ source: "google", medium: "cpc", campaign: "Autumn moves", requests: 1 });
    expect(first.landingPages).toHaveLength(3);
    expect(last.landingPages).toEqual([{ path: "/movers/new-york/", requests: 1 }, { path: "/movers/texas/", requests: 1 }]);
  });

  it("suppresses untrusted old metadata in SQL and counts indexable only when published", async () => {
    const result = await growthSnapshot({ touch: "last" }, inlineDb);
    const serialized = JSON.stringify(result);
    for (const value of ["person@example.invalid", "301-555-0199", "Q".repeat(43), "sb_secret_should_not_leak", "?utm", "#fragment", "/get-quotes/", "/my-request/"]) expect(serialized).not.toContain(value);
    expect(result.seo).toEqual({
      total: 3, published: 2, indexable: 1, blocked: 1, latestChangeAt: "2026-11-01T00:00:00.000Z",
      families: [{ family: "city", published: 1, indexable: 1, blocked: 1 }, { family: "question", published: 1, indexable: 0, blocked: 0 }],
    });
  });
});
