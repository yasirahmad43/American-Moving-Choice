import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Existing app tests use Node; exercise the actual hook/effect closures without a browser or DB.
const hooks = vi.hoisted(() => ({ slots: [], cursor: 0, effects: [] }));
vi.mock("react", async original => ({
  ...await original(),
  useState(initial) {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { value: typeof initial === "function" ? initial() : initial };
    const slot = hooks.slots[index];
    return [slot.value, value => { slot.value = typeof value === "function" ? value(slot.value) : value; }];
  },
  useRef(initial) {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useEffect(effect, deps) {
    const index = hooks.cursor++, old = hooks.slots[index];
    if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) hooks.effects.push(() => {
      old?.cleanup?.();
      const cleanup = effect();
      hooks.slots[index] = { deps, cleanup };
    });
  },
}));
vi.mock("@amc/ui", () => ({
  Button: ({ children, variant: _variant, size: _size, ...props }) => React.createElement("button", props, children),
  Card: ({ children, title, description, ...props }) => React.createElement("section", { ...props, "data-card-title": title },
    title ? React.createElement("h2", null, title) : null,
    description ? React.createElement("p", null, description) : null, children),
}));
vi.mock("next/link", () => ({ default: ({ children, ...props }) => React.createElement("a", props, children) }));

import { GrowthDashboard } from "./growth-dashboard.tsx";

const SITE = "https://www.americanmovingchoice.com";
const NOW = "2026-10-31T12:00:00.000Z";
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
let visibility, listeners, fetcher, props;

function requestData(overrides = {}) {
  return {
    generatedAt: NOW, timezone: "America/New_York", touch: "last",
    requests: { today: 0, last24Hours: 0, last7Days: 0, last30Days: 0, last15Minutes: 0, lastHour: 0, latestAt: null, byStatus: [] },
    daily: [{ date: "2026-10-30", requests: 0 }, { date: "2026-10-31", requests: 0 }],
    sources: [], campaigns: [], attribution: { total: 0, measured: 0, unattributed: 0 }, landingPages: [],
    seo: { total: 0, published: 0, indexable: 0, blocked: 0, latestChangeAt: null, families: [] }, ...overrides,
  };
}
const absent = () => ({ status: "not_configured", checkedAt: null, reportedThrough: null, data: null });
function providerData() { return { generatedAt: NOW, ga4: absent(), searchConsole: absent(), tagManager: absent(), bing: absent() }; }
const connected = (data, reportedThrough = null) => ({ status: "connected", checkedAt: NOW, reportedThrough, data });

function render(options = props) {
  hooks.cursor = 0;
  let tree = GrowthDashboard(options);
  for (const effect of hooks.effects.splice(0)) effect();
  hooks.cursor = 0;
  tree = GrowthDashboard(options);
  return tree;
}
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  return React.isValidElement(value) ? [value, ...nodes(value.props.children)] : [];
}
function text(value) {
  if (Array.isArray(value)) return value.map(text).join(" ");
  return React.isValidElement(value) ? text(value.props.children) : typeof value === "string" ? value : "";
}
function button(tree, label = "Refresh") {
  const result = nodes(tree).find(node => typeof node.props.onClick === "function" && text(node) === label);
  expect(result).toBeDefined(); return result;
}
function input(tree, type) { const result = nodes(tree).find(node => node.type === "input" && node.props.type === type); expect(result).toBeDefined(); return result; }
function select(tree) { const result = nodes(tree).find(node => node.type === "select"); expect(result).toBeDefined(); return result; }
function html(tree = render()) { return renderToStaticMarkup(tree); }
function plain(tree = render()) { return html(tree).replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " "); }
function visible(value) {
  visibility = value ? "visible" : "hidden";
  for (const callback of [...(listeners.get("visibilitychange") ?? [])]) callback(new Event("visibilitychange"));
}
function unmount() { for (const slot of hooks.slots) slot?.cleanup?.(); }

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  hooks.slots = []; hooks.cursor = 0; hooks.effects = []; visibility = "visible"; listeners = new Map(); props = {};
  vi.stubGlobal("document", {
    get visibilityState() { return visibility; },
    addEventListener(name, callback) { const list = listeners.get(name) ?? new Set(); list.add(callback); listeners.set(name, list); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  });
  fetcher = vi.fn(async url => Response.json(String(url).includes("/providers") ? providerData() : requestData()));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { unmount(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("growth dashboard presentation and coupled report lifecycle", () => {
  it("renders honest loading, empty-request and disconnected-provider states", async () => {
    expect(plain(render())).toContain("Loading request totals and campaign activity");
    await flush();
    const output = plain(render());
    expect(output).toContain("Your first submitted request will start this chart");
    expect(output).toContain("No requests yet");
    expect(output).toContain("No requests in this period");
    expect(output.match(/API access not connected/gu)).toHaveLength(4);
    expect(output).toContain("Not yet fetched");
    expect(output).not.toMatch(/NaN|Infinity|Invalid Date|undefined/gu);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("renders connected zero/nullable metrics without inventing percentages or shifting daily dates", async () => {
    const reports = providerData();
    reports.ga4 = connected({ windowMinutes: 30, activeUsers: 3210, screenPageViews: 8129, events: { page_view: 8129, survey_start: 4, survey_step: 7, generate_lead: 0 } });
    reports.searchConsole = connected({ siteUrl: `${SITE}/`, startDate: "2026-10-01", endDate: "2026-10-28", clicks: 0, impressions: 0, ctr: null, position: null, sitemaps: [{ path: "/sitemap.xml", lastSubmitted: null, lastDownloaded: null, isPending: true, errors: 0, warnings: 0, submittedUrls: 4806 }] });
    reports.tagManager = connected({ versionId: "5", tagCount: 6 });
    reports.bing = connected({ siteUrl: `${SITE}/`, traffic: [{ date: "2026-10-30", clicks: 0, impressions: 0 }], feeds: [] }, "2026-10-30");
    fetcher.mockImplementation(async url => Response.json(String(url).includes("/providers") ? reports : requestData()));
    render(); await flush();
    const output = plain(render());
    expect(output).toContain("3,210"); expect(output).toContain("8,129");
    expect(output).toContain("Click-through rate: —"); expect(output).toContain("Average position: —");
    expect(output).toContain("4,806 submitted"); expect(output).toContain("Processing");
    expect(output).toContain("Through Oct 30");
    expect(output).not.toMatch(/Through Oct 29|NaN|Infinity|Invalid Date/gu);
  });

  it.each([["requests", 401], ["requests", 403], ["providers", 401], ["providers", 403]])("status %s/%s clears both datasets, aborts the sibling and permanently stops refreshes", async (terminal, status) => {
    let fail = false;
    const sibling = deferred();
    const reports = providerData(); reports.ga4 = connected({ windowMinutes: 30, activeUsers: 7654, screenPageViews: 0, events: { page_view: 0, survey_start: 0, survey_step: 0, generate_lead: 0 } });
    fetcher.mockImplementation((url, options) => {
      const isProviders = String(url).includes("/providers");
      if (!fail) return Promise.resolve(Response.json(isProviders ? reports : requestData({ requests: { ...requestData().requests, today: 9876 } })));
      if ((terminal === "providers") === isProviders) return Promise.resolve(new Response(null, { status }));
      return sibling.promise;
    });
    render(); await flush();
    let tree = render(); const capturedRefresh = button(tree).props.onClick;
    expect(plain(tree)).toContain("9,876"); expect(plain(tree)).toContain("7,654");
    fail = true; capturedRefresh(); await flush(); tree = render();
    expect(plain(tree)).toContain("Your reporting session ended");
    expect(plain(tree)).not.toMatch(/9,876|7,654|Google Analytics|Requests today/gu);
    const lateCall = fetcher.mock.calls.findLast(([url]) => (terminal === "providers") !== String(url).includes("/providers"));
    expect(lateCall[1].signal.aborted).toBe(true);
    sibling.resolve(Response.json(terminal === "providers" ? requestData({ requests: { ...requestData().requests, today: 999999 } }) : reports));
    await flush(); capturedRefresh(); visible(false); visible(true); await vi.advanceTimersByTimeAsync(300_000); render();
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(plain()).toContain("Your reporting session ended"); expect(plain()).not.toContain("999,999");
  });

  it("pauses hidden/manual updates and resumes both intervals with clean listener teardown", async () => {
    visibility = "hidden";
    let tree = render(); await flush(); expect(fetcher).not.toHaveBeenCalled();
    button(tree).props.onClick(); await flush(); expect(fetcher).not.toHaveBeenCalled();
    visible(true); await flush(); tree = render(); expect(fetcher).toHaveBeenCalledTimes(2);
    input(tree, "checkbox").props.onChange({ target: { checked: true } }); tree = render();
    expect(plain(tree)).toContain("Automatic updates paused"); expect(button(tree).props.disabled).toBe(true);
    visible(false); visible(true); await vi.advanceTimersByTimeAsync(120_000); expect(fetcher).toHaveBeenCalledTimes(2);
    input(tree, "checkbox").props.onChange({ target: { checked: false } }); render(); await flush();
    expect(fetcher).toHaveBeenCalledTimes(4);
    unmount(); expect(listeners.get("visibilitychange")?.size ?? 0).toBe(0);
    await vi.advanceTimersByTimeAsync(120_000); expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("rejects late old-touch results even when the transport ignores abort", async () => {
    const old = deferred(); let waiting = false;
    fetcher.mockImplementation(url => {
      if (String(url).includes("/providers")) return Promise.resolve(Response.json(providerData()));
      if (String(url).endsWith("touch=last")) return waiting ? old.promise : Promise.resolve(Response.json(requestData()));
      return Promise.resolve(Response.json(requestData({ touch: "first", campaigns: [{ campaign: "first touch campaign", source: "google", medium: "cpc", requests: 1 }] })));
    });
    render(); await flush();
    waiting = true; button(render()).props.onClick(); await flush();
    const pending = fetcher.mock.calls.findLast(([url]) => String(url).endsWith("touch=last"));
    select(render()).props.onChange({ target: { value: "first" } });
    render(); await flush();
    expect(pending[1].signal.aborted).toBe(true);
    expect(plain(render())).toContain("first touch campaign");
    old.resolve(Response.json(requestData({ campaigns: [{ campaign: "stale last touch campaign", source: "direct", medium: "none", requests: 99 }] })));
    await flush();
    expect(plain(render())).toContain("first touch campaign"); expect(plain()).not.toContain("stale last touch");
  });

  it("keeps compact request summaries separate from provider calls", async () => {
    props = { compact: true }; render(); await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toBe("/api/admin/growth?touch=last");
    expect(plain(render())).toContain("View growth dashboard");
    expect(plain()).not.toContain("Google &amp; Bing reports");
  });
});
