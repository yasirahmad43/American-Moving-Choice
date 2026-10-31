import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Queryable } from "../db/pool";
import { growthSnapshot } from "./growth";

function fixture() {
  return {
    requests: [{ today: 2, last_24_hours: 3, last_7_days: 8, last_30_days: 10, last_15_minutes: 1, last_hour: 2, latest_at: new Date("2026-10-31T02:00:00Z") }],
    statuses: [{ status: "unmatched", count: 3 }, { status: "qualified", count: 6 }, { status: "needs_review", count: 1 }],
    daily: [{ date: "2026-10-30", requests: 3 }, { date: "2026-10-31", requests: 2 }],
    acquisition: [{
      total: 10, measured: 6, unattributed: 4,
      sources: [{ source: "direct", requests: 4 }, { source: "organic_search", requests: 4 }, { source: "paid_search", requests: 2 }],
      campaigns: [{ source: "google", medium: "cpc", campaign: "Fall moves", requests: 2 }],
      landing_pages: [{ path: "/movers/florida/", requests: 4 }],
    }],
    seo: [
      { family: "city", total: 8, published: 6, indexable: 5, blocked: 2, latest_at: "2026-10-29T10:00:00Z" },
      { family: "question", total: 2, published: 2, indexable: 2, blocked: 0, latest_at: "2026-10-30T10:00:00Z" },
    ],
  };
}
function injected(data: ReturnType<typeof fixture>) {
  const calls: { sql: string; values?: unknown[] }[] = [];
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    calls.push({ sql, values });
    const key = /growth:(requests|statuses|daily|acquisition|seo)/u.exec(sql)?.[1] as keyof typeof data | undefined;
    if (!key) throw new Error("Unexpected query");
    return { rows: data[key], rowCount: data[key].length, command: "SELECT", oid: 0, fields: [] };
  });
  return { db: { query } as unknown as Queryable, calls, query };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-31T14:00:00Z")); });
afterEach(() => vi.useRealTimers());

describe("contact-free growth read model", () => {
  it("returns the agreed serializable counts without confusing attribution or publication with visits/indexing", async () => {
    const { db } = injected(fixture());
    const result = await growthSnapshot({ touch: "last" }, db);
    expect(result.requests).toMatchObject({ today: 2, last24Hours: 3, last7Days: 8, last30Days: 10, last15Minutes: 1, lastHour: 2, latestAt: "2026-10-31T02:00:00.000Z" });
    expect(result.requests.byStatus.find(row => row.status === "rejected")?.count).toBe(0);
    expect(result.attribution).toEqual({ total: 10, measured: 6, unattributed: 4 });
    expect(result.sources.find(row => row.source === "direct")?.label).toBe("Direct / unattributed");
    expect(result.seo).toEqual({
      total: 10, published: 8, indexable: 7, blocked: 2, latestChangeAt: "2026-10-30T10:00:00.000Z",
      families: [{ family: "city", published: 6, indexable: 5, blocked: 2 }, { family: "question", published: 2, indexable: 2, blocked: 0 }],
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(Object.keys(result)).toEqual(["generatedAt", "timezone", "touch", "requests", "daily", "sources", "campaigns", "attribution", "landingPages", "seo"]);
  });

  it.each(["first", "last"] as const)("binds %s touch exactly once and uses one coherent clock across every bounded window", async touch => {
    const { db, calls } = injected(fixture());
    const result = await growthSnapshot({ touch }, db);
    const acquisition = calls.find(row => row.sql.includes("growth:acquisition"))!;
    expect(acquisition.values?.[1]).toBe(touch);
    expect(acquisition.sql.match(/join attribution_touches/gu)).toHaveLength(1);
    expect(acquisition.sql).toContain("a.touch = $2");
    expect(acquisition.sql).toContain("where measured is not true");
    expect(acquisition.sql).toContain("a.evidence_level in ('observed', 'referrer_inferred') then");
    expect(calls.filter(row => row.values).map(row => row.values![0])).toEqual(Array(4).fill(result.generatedAt));
    expect(calls.every(row => !/\b(?:insert|update|delete|call|notify)\b/iu.test(row.sql))).toBe(true);
    expect(calls.every(row => !/\b(?:first_name|last_name|phone_e164|manage_token_hash|click_ids)\b/u.test(row.sql))).toBe(true);
  });

  it.each([
    ["2026-11-01T03:30:00Z", "2026-10-18", "2026-10-31"],
    ["2026-11-01T06:30:00Z", "2026-10-19", "2026-11-01"],
    ["2026-03-08T07:30:00Z", "2026-02-23", "2026-03-08"],
  ])("keeps14 Eastern calendar days across midnight/DST at %s", async (now, start, end) => {
    vi.setSystemTime(new Date(now));
    const { db, calls } = injected(fixture());
    const result = await growthSnapshot({ touch: "first" }, db);
    expect(result.timezone).toBe("America/New_York");
    expect(result.daily).toHaveLength(14);
    expect(new Set(result.daily.map(row => row.date)).size).toBe(14);
    expect(result.daily[0]?.date).toBe(start);
    expect(result.daily.at(-1)?.date).toBe(end);
    expect(calls.find(row => row.sql.includes("growth:daily"))?.sql).toContain("at time zone 'America/New_York'");
  });

  it("rechecks old metadata and returns only a bounded public-safe whitelist", async () => {
    const data = fixture(), token = "Q".repeat(43);
    data.acquisition[0]!.campaigns = [
      { source: "person@example.invalid", medium: "cpc", campaign: "301-555-0199", requests: 2 },
      { source: token, medium: "email", campaign: "sb_secret_should_not_leak", requests: 1 },
      ...Array.from({ length: 16 }, (_, i) => ({ source: "google", medium: "cpc", campaign: "Campaign " + i, requests: 1 })),
    ];
    data.acquisition[0]!.landing_pages = [
      { path: "/my-request/" + token + "/", requests: 5 },
      { path: "https://external.invalid/about/", requests: 4 },
      { path: "/get-quotes/confirmation/", requests: 3 },
      { path: "/movers/florida/?email=person@example.invalid#private", requests: 2 },
    ];
    Object.assign(data.requests[0]!, { email: "person@example.invalid", phone: "301-555-0199", click_ids: token });
    Object.assign(data.seo[0]!, { error: "person@example.invalid", content: { private: token } });
    const { db } = injected(data);
    const result = await growthSnapshot({ touch: "last" }, db);
    const serialized = JSON.stringify(result);
    for (const secret of ["person@example.invalid", "301-555-0199", "sb_secret_should_not_leak", token, "external.invalid", "click_ids", "?email", "confirmation"]) expect(serialized).not.toContain(secret);
    expect(result.landingPages).toEqual([{ path: "/movers/florida/", requests: 2 }]);
    expect(result.campaigns).toHaveLength(10);
  });

  it("represents an empty store with14 zero-filled days, not invented traffic or missing rows", async () => {
    const data = fixture();
    data.requests = [{ today: 0, last_24_hours: 0, last_7_days: 0, last_30_days: 0, last_15_minutes: 0, last_hour: 0, latest_at: null as unknown as Date }];
    data.statuses = []; data.daily = []; data.seo = [];
    data.acquisition = [{ total: 0, measured: 0, unattributed: 0, sources: [], campaigns: [], landing_pages: [] }];
    const { db } = injected(data);
    const result = await growthSnapshot({ touch: "first" }, db);
    expect(result.requests.latestAt).toBeNull();
    expect(result.daily.every(row => row.requests === 0)).toBe(true);
    expect(result.daily).toHaveLength(14);
    expect(result.attribution).toEqual({ total: 0, measured: 0, unattributed: 0 });
    expect(result.sources).toEqual([]);
    expect(result.seo.latestChangeAt).toBeNull();
  });

  it("rejects invalid touch without a query and invalid counts instead of reporting fictional zeroes", async () => {
    const invalid = injected(fixture());
    await expect(growthSnapshot({ touch: "all" } as never, invalid.db)).rejects.toBeInstanceOf(RangeError);
    expect(invalid.query).not.toHaveBeenCalled();
    const data = fixture(); data.requests[0]!.last_30_days = -1;
    await expect(growthSnapshot({ touch: "last" }, injected(data).db)).rejects.toThrow("Growth aggregate unavailable");
  });
});
