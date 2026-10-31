"use client";

import type { GrowthSnapshot } from "@amc/server/admin";
import type { ReportingSnapshot } from "@amc/server/reporting";
import { Button, Card } from "@amc/ui";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createReportPoller, type PollState, type ReportPoller } from "./report-poller";
import "./growth.css";

const EMPTY: PollState = { loading: false, error: false, checkedAt: null };
const number = (value: number) => value.toLocaleString("en-US");
const time = (value: string | null) => value ? new Date(value).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }) + " ET" : "Not yet fetched";
const date = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const humanize = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

function useGrowth(touch: "first" | "last", paused: boolean, compact: boolean) {
  const [requests, setRequests] = useState<GrowthSnapshot | null>(null);
  const [providers, setProviders] = useState<ReportingSnapshot | null>(null);
  const [requestState, setRequestState] = useState(EMPTY);
  const [providerState, setProviderState] = useState(EMPTY);
  const [revoked, setRevoked] = useState(false);
  const refresh = useRef(() => {});
  const previousTouch = useRef(touch);
  useEffect(() => {
    if (revoked) return;
    let closed = false;
    const streams: ReportPoller[] = [];
    const onAuthFailure = () => {
      closed = true;
      streams.forEach(stream => stream.stop());
      refresh.current = () => {};
      setRequests(null); setProviders(null); setRequestState(EMPTY); setProviderState(EMPTY); setRevoked(true);
    };
    const visible = () => !paused && document.visibilityState === "visible";
    if (previousTouch.current !== touch) { setRequests(null); previousTouch.current = touch; }
    streams.push(createReportPoller<GrowthSnapshot>({ url: `/api/admin/growth?touch=${touch}`, interval: 15_000, visible, onAuthFailure,
      onData: data => { if (!closed) setRequests(data); }, onState: state => { if (!closed) setRequestState(state); } }));
    if (!compact) streams.push(createReportPoller<ReportingSnapshot>({ url: "/api/admin/growth/providers", interval: 60_000, timeout: 25_000, visible, onAuthFailure,
      onData: data => { if (!closed) setProviders(data); }, onState: state => { if (!closed) setProviderState(state); } }));
    const update = () => streams.forEach(stream => stream.visibilityChanged());
    refresh.current = () => { if (!closed) streams.forEach(stream => stream.refresh()); };
    document.addEventListener("visibilitychange", update);
    if (!paused) refresh.current();
    return () => { closed = true; streams.forEach(stream => stream.stop()); document.removeEventListener("visibilitychange", update); refresh.current = () => {}; };
  }, [touch, paused, revoked, compact]);
  return { requests, providers, requestState, providerState, revoked, refresh: () => refresh.current() };
}

function Metric({ label, value, note }: { label: string; value: number; note?: string }) {
  return <div className="growth-metric"><p>{label}</p><strong>{number(value)}</strong>{note ? <span>{note}</span> : null}</div>;
}
function Empty({ children }: { children: ReactNode }) { return <p className="growth-empty">{children}</p>; }
function Panel({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return <Card className={`growth-panel ${className}`} title={title} description={note}>{children}</Card>;
}
function External({ href, children }: { href: string; children: ReactNode }) {
  return <a className="growth-external" href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>;
}
function ProviderStatus({ report }: { report: { status: string; checkedAt: string | null } | undefined }) {
  const label = !report ? "Loading report" : report.status === "connected" ? "Connected" : report.status === "not_configured" ? "API access not connected" : report.status === "access_denied" ? "Reporting permission needed" : "Provider unavailable · retrying";
  return <p className="growth-provider-status"><span className={`growth-dot ${report?.status === "connected" ? "growth-dot-live" : ""}`} aria-hidden="true" />{label}</p>;
}

export function GrowthDashboard({ compact = false }: { compact?: boolean }) {
  const [touch, setTouch] = useState<"first" | "last">("last");
  const [paused, setPaused] = useState(false);
  const { requests: data, providers, requestState, providerState, revoked, refresh } = useGrowth(touch, paused, compact);
  if (revoked) return <Card><p role="alert">Your reporting session ended. Sign in again to continue.</p><Link className="growth-external" href="/login?next=%2Fadmin%2Fgrowth">Sign in</Link></Card>;
  const ga = providers?.ga4, search = providers?.searchConsole, gtm = providers?.tagManager, bing = providers?.bing;
  const status = paused ? "Automatic updates paused" : requestState.error ? "Connection interrupted · retrying" : data ? "Requests update every 15 seconds" : "Loading saved requests…";
  return (
    <div className="growth-dashboard">
      <div className="growth-toolbar">
        <div role="status"><p className="growth-status"><span className={`growth-dot ${data && !paused && !requestState.error ? "growth-dot-live" : ""}`} aria-hidden="true" />{status}</p><p className="growth-caption">{data ? `Updated ${time(data.generatedAt)}` : "All dates use US Eastern time."}</p></div>
        <div className="growth-actions">
          {!compact ? <label className="growth-pause"><input type="checkbox" checked={paused} onChange={event => setPaused(event.target.checked)} />Pause</label> : null}
          <Button variant="secondary" size="sm" disabled={paused || requestState.loading || providerState.loading} onClick={refresh}>Refresh</Button>
          {compact ? <Link className="growth-external" href="/admin/growth">View growth dashboard →</Link> : null}
        </div>
      </div>
      {data ? <>
        <div className="growth-metrics"><Metric label="Requests today" value={data.requests.today} note="Since midnight ET" /><Metric label="Last 15 minutes" value={data.requests.last15Minutes} note="Saved move requests" /><Metric label="Last 7 days" value={data.requests.last7Days} /><Metric label="Last 30 days" value={data.requests.last30Days} /></div>
        {!compact ? <>
          <div className="growth-two-columns">
            <Panel title="Your request trend" note="14 calendar days, including today. Every bar is one day.">
              {data.daily.some(day => day.requests > 0) ? <>
                <div className="growth-chart" role="img" aria-label={`${number(data.daily.reduce((sum, day) => sum + day.requests, 0))} requests over 14 calendar days. Open daily totals below for every value.`}>
                  {data.daily.map(day => <div key={day.date} style={{ height: `${day.requests / Math.max(1, ...data.daily.map(item => item.requests)) * 100}%` }} title={`${date(day.date)}: ${number(day.requests)}`} />)}
                </div>
                <div className="growth-chart-axis"><span>{date(data.daily[0]!.date)}</span><span>Daily requests</span><span>{date(data.daily.at(-1)!.date)}</span></div>
              </> : <Empty>Your first submitted request will start this chart.</Empty>}
              <details className="growth-details"><summary>View daily totals</summary><dl className="growth-daily">{data.daily.map(day => <div key={day.date}><dt>{date(day.date)}</dt><dd>{number(day.requests)}</dd></div>)}</dl></details>
              <p className="growth-caption">Latest request: {data.requests.latestAt ? time(data.requests.latestAt) : "No requests yet"}</p>
            </Panel>
            <Panel title="Request status" note="Saved requests in the last 30 days."><dl className="growth-list">{data.requests.byStatus.map(row => <div key={row.status}><dt>{humanize(row.status)}</dt><dd>{number(row.count)}</dd></div>)}</dl>{!data.requests.byStatus.length ? <Empty>No requests in this period.</Empty> : null}<Link className="growth-external" href="/admin/leads">Open requests →</Link></Panel>
          </div>
          <section className="growth-section" aria-labelledby="growth-acquisition">
            <div className="growth-section-header"><div><h2 id="growth-acquisition">What brings people to you</h2><p className="growth-caption">Request attribution · last 30 days · one touch per request.</p></div><label className="growth-select">Attribution<select value={touch} onChange={event => setTouch(event.target.value as "first" | "last")}><option value="last">Latest touch</option><option value="first">First touch</option></select></label></div>
            <div className="growth-two-columns">
              <Panel title="Lead sources" note="Direct / unattributed also includes requests without observed campaign evidence."><div className="growth-bars">{data.sources.map(row => <div key={row.source}><div><span>{row.label}</span><strong>{number(row.requests)}</strong></div><div className="growth-bar-track"><span style={{ width: `${row.requests / Math.max(1, data.attribution.total) * 100}%` }} /></div></div>)}</div>{!data.sources.length ? <Empty>Sources appear as requests arrive.</Empty> : null}<p className="growth-caption">Observed attribution: {number(data.attribution.measured)} of {number(data.attribution.total)} requests.</p></Panel>
              <Panel title="Campaigns" note={`${touch === "first" ? "First" : "Latest"} observed touch for each request.`}><ol className="growth-records">{data.campaigns.map((row, index) => <li key={`${index}-${row.campaign}`}><div><strong>{row.campaign}</strong><span>{row.source} / {row.medium}</span></div><b>{number(row.requests)}</b></li>)}</ol>{!data.campaigns.length ? <Empty>Named campaigns will appear when tagged visits lead to submitted requests.</Empty> : null}</Panel>
            </div>
            <Panel title="Landing pages that generate requests" note="Observed public landing paths only. Missing attribution is excluded."><ol className="growth-records growth-landing">{data.landingPages.map(row => <li key={row.path}><span>{row.path}</span><b>{number(row.requests)}</b></li>)}</ol>{!data.landingPages.length ? <Empty>Landing-page results appear with observed attribution on submitted requests.</Empty> : null}</Panel>
          </section>
          <section className="growth-section" aria-labelledby="growth-search">
            <div className="growth-section-header"><div><h2 id="growth-search">Search visibility</h2><p className="growth-caption">Published pages and search-engine reports measure different things.</p></div><Link className="growth-external" href="/admin/content/publication">Manage publication →</Link></div>
            <div className="growth-metrics growth-metrics-three"><Metric label="Published SEO pages" value={data.seo.published} /><Metric label="Published & indexable" value={data.seo.indexable} note="Eligible for search; not an indexed-page count" /><Metric label="Pages blocked by checks" value={data.seo.blocked} /></div>
            <Panel title="SEO page library" note="Programmatic pages in our database. Core website pages are tracked separately in the sitemap."><div className="growth-family-grid">{data.seo.families.map(row => <div key={row.family}><h3>{humanize(row.family)}</h3><p><strong>{number(row.published)}</strong> published</p><span>{number(row.indexable)} indexable · {number(row.blocked)} blocked</span></div>)}</div></Panel>
          </section>
        </> : null}
      </> : <div className="growth-loading" role="status">{requestState.error ? "Request totals could not be loaded. We’re retrying automatically; you can also choose Refresh." : "Loading request totals and campaign activity…"}</div>}
      {!compact ? <>
        <section className="growth-section" aria-labelledby="growth-providers">
          <div className="growth-section-header"><div><h2 id="growth-providers">Google & Bing reports</h2><p className="growth-caption">Reporting connections are separate from website tracking. Reports check automatically while this page is open.</p></div></div>
          {providerState.error ? <p className="growth-alert" role="status">Provider connection interrupted. Displayed reports retain their last successful fetch time while we retry.</p> : null}
          <div className="growth-two-columns">
            <Panel title="Google Analytics" note="Active users in the last 30 minutes. Opted-in website activity only.">
              <ProviderStatus report={ga} />
              {ga?.data ? <><div className="growth-inline-metrics"><Metric label="Active users" value={ga.data.activeUsers} /><Metric label="Page views" value={ga.data.screenPageViews} /></div><dl className="growth-list"><div><dt>Survey starts</dt><dd>{number(ga.data.events.survey_start)}</dd></div><div><dt>Survey steps</dt><dd>{number(ga.data.events.survey_step)}</dd></div><div><dt>Measured lead events</dt><dd>{number(ga.data.events.generate_lead)}</dd></div></dl><p className="growth-caption">Measured lead events may differ from saved requests because visitor analytics requires consent.</p></> : <Empty>{ga?.status === "not_configured" ? "Website tracking is set up. A separate read-only API connection is needed to bring its reports into this screen." : "Visitor counts appear after the reporting connection returns a successful response."}</Empty>}
              <ProviderFooter at={ga?.checkedAt} href="https://analytics.google.com/analytics/web/#/a414235382p561692313/realtime/overview">Open Google Analytics</ProviderFooter>
            </Panel>
            <Panel title="Google Search Console" note="Daily search performance · last 28 complete days. Recent data can arrive 2–3 days later.">
              <ProviderStatus report={search} />
              {search?.data ? <><div className="growth-inline-metrics"><Metric label="Search clicks" value={search.data.clicks} /><Metric label="Impressions" value={search.data.impressions} /></div><p className="growth-caption">Click-through rate: {search.data.ctr === null ? "—" : `${(search.data.ctr * 100).toFixed(1)}%`} · Average position: {search.data.position === null ? "—" : search.data.position.toFixed(1)}<br />Report window: {date(search.data.startDate)} – {date(search.data.endDate)}</p><dl className="growth-list">{search.data.sitemaps.map(row => <div key={row.path}><dt>{row.path}<small>{row.isPending ? "Processing" : `${number(row.errors)} errors · ${number(row.warnings)} warnings`}</small></dt><dd>{number(row.submittedUrls)} submitted</dd></div>)}</dl></> : <Empty>Search Console is verified. Search performance and sitemap processing will appear here after read-only reporting access is connected.</Empty>}
              <ProviderFooter at={search?.checkedAt} href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.americanmovingchoice.com%2F">Open Search Console</ProviderFooter>
            </Panel>
            <Panel title="Bing Webmaster Tools" note="Traffic updates daily. Submission and crawling do not guarantee indexing.">
              <ProviderStatus report={bing} />
              {bing?.data ? <><div className="growth-inline-metrics"><Metric label="Reported clicks" value={bing.data.traffic.reduce((sum, day) => sum + day.clicks, 0)} /><Metric label="Reported impressions" value={bing.data.traffic.reduce((sum, day) => sum + day.impressions, 0)} /></div><p className="growth-caption">Through {bing.reportedThrough ? date(bing.reportedThrough) : "the provider’s latest available day"}. Bing combines search verticals in these totals.</p><dl className="growth-list">{bing.data.feeds.map(row => <div key={row.url}><dt>{new URL(row.url).pathname}<small>{row.status}</small></dt><dd>{number(row.urlCount)} URLs</dd></div>)}</dl></> : <Empty>Bing is verified and the sitemap has been submitted. A read-only reporting connection is needed to show daily results here.</Empty>}
              <ProviderFooter at={bing?.checkedAt} href="https://www.bing.com/webmasters/sitemaps?siteUrl=https://www.americanmovingchoice.com/">Open Bing Webmaster Tools</ProviderFooter>
            </Panel>
            <Panel title="Tracking & website operations" note="Published tag configuration and the website’s operational dashboards.">
              <ProviderStatus report={gtm} />
              {gtm?.data ? <dl className="growth-list"><div><dt>Published GTM version</dt><dd>{gtm.data.versionId}</dd></div><div><dt>Tags in published version</dt><dd>{number(gtm.data.tagCount)}</dd></div></dl> : <Empty>Google Tag Manager is published. Its API connection will show the current container version here; configuration alone does not prove tags fired.</Empty>}
              <ProviderFooter at={gtm?.checkedAt} href="https://tagmanager.google.com/#/container/accounts/6401413548/containers/284497986/">Open Tag Manager</ProviderFooter>
              <div className="growth-operation-links"><External href="https://vercel.com/yasirahmad43s-projects/amc-web">Website security & delivery</External><External href="https://www.americanmovingchoice.com/sitemap.xml">Live sitemap</External><Link className="growth-external" href="/admin/audit-log">Admin security events →</Link></div>
              <p className="growth-caption">Open Vercel to review website firewall and bot activity.</p>
            </Panel>
          </div>
        </section>
        <p className="growth-caption">Saved requests are the source of truth for leads. First touch shows how a visitor first arrived; latest touch shows their most recent recorded source. Updates pause when this tab is hidden. Provider reports retain their own processing delays.</p>
      </> : null}
    </div>
  );
}

function ProviderFooter({ at, href, children }: { at: string | null | undefined; href: string; children: ReactNode }) {
  return <div className="growth-provider-footer"><p className="growth-caption">Fetched: {time(at ?? null)}</p><External href={href}>{children}</External></div>;
}
