import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const source = vi.hoisted(() => ({ googleEnabled: false, overview: vi.fn() }));
vi.mock("@amc/server/env", () => ({ env: () => ({ APP_URL: "https://app.example.test", SITE_INDEXABLE: true, ANALYTICS_ENABLED: source.googleEnabled, GTM_CONTAINER_ID: undefined }) }));
vi.mock("@/lib/public-discovery", () => ({ navigationOverview: source.overview }));
vi.mock("@/lib/site", () => ({
  GEONAMES_CREDIT: { sourceUrl: "https://example.test/source", licenseUrl: "https://example.test/license" },
  GUIDE_FAMILIES: [{ id: "state", short: "State guides" }],
  PUBLIC_NAV_GROUPS: [{ id: "planning", label: "Plan your move", links: [{ href: "/planning/", label: "Moving checklists" }] }],
  PREVIEW_BANNER_TEXT: "Preview",
}));
vi.mock("@/lib/public-copy", () => ({ PUBLIC_ROLE_STATEMENT: "Moving request guidance." }));
vi.mock("next/link", () => ({ default: ({ children, ...props }) => React.createElement("a", props, children) }));
vi.mock("@amc/ui", () => ({
  ArrowRightIcon: () => React.createElement("svg", { "aria-hidden": true }),
  RouteMapArt: () => React.createElement("svg", { "aria-hidden": true }),
  Wordmark: ({ href }) => React.createElement("a", { href }, "American Moving Choice"),
}));
vi.mock("../../components/navigation/guide-discovery", () => ({ GuideDiscovery: ({ searchLabel }) => React.createElement("input", { "aria-label": searchLabel }) }));
vi.mock("../../components/navigation/category-icon", () => ({ CategoryIcon: () => React.createElement("svg", { "aria-hidden": true }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/analytics/consent", () => import("./consent.ts"));
vi.mock("@/lib/analytics/events", () => import("./events.ts"));
vi.mock("@/lib/analytics/runtime", () => import("./runtime.ts"));

// Render the real footer and the real AnalyticsChoicesButton. Discovery/env are isolated
// so this public HTML regression needs neither a database nor a network connection.
import { SiteFooter } from "../../components/site-footer.tsx";

beforeEach(() => { source.googleEnabled = false; source.overview.mockReset(); source.overview.mockResolvedValue(null); });

describe("server-rendered footer campaign choices", () => {
  it.each([false, true])("keeps the choices button available with no Google container (Google enabled=%s)", async enabled => {
    source.googleEnabled = enabled;
    const html = renderToStaticMarkup(await SiteFooter());
    expect(html).toMatch(/<button[^>]*>Analytics choices<\/button>/u);
    expect(html.match(/>Analytics choices<\/button>/gu)).toHaveLength(1);
    expect(html).toContain('href="/get-quotes/"');
    expect(html).toContain('href="https://app.example.test/login"');
    expect(html).not.toMatch(/googletagmanager\.com|google-analytics\.com|<script/iu);
    expect(source.overview).toHaveBeenCalledOnce();
  });
});
