import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";

const hooks = vi.hoisted(() => ({ slots: [], cursor: 0, effects: [] }));
const metrics = vi.hoisted(() => ({ initializeAnalytics: vi.fn(), trackPageView: vi.fn(), revokeAnalytics: vi.fn(), analyticsLoaded: vi.fn() }));
vi.mock("react", async original => ({
  ...await original(),
  useState(initial) { const index = hooks.cursor++; if (!(index in hooks.slots)) hooks.slots[index] = { value: typeof initial === "function" ? initial() : initial }; const slot = hooks.slots[index]; return [slot.value, value => { slot.value = typeof value === "function" ? value(slot.value) : value; }]; },
  useRef(initial) { const index = hooks.cursor++; if (!(index in hooks.slots)) hooks.slots[index] = { current: initial }; return hooks.slots[index]; },
  useEffect(effect, deps) { const index = hooks.cursor++, old = hooks.slots[index]; if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) hooks.effects.push(() => { old?.cleanup?.(); const cleanup = effect(); hooks.slots[index] = { deps, cleanup }; }); },
}));
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));
vi.mock("@/lib/analytics/consent", () => import("./consent.ts"));
vi.mock("@/lib/analytics/events", () => import("./events.ts"));
vi.mock("@/lib/analytics/runtime", () => metrics);

import { AnalyticsController } from "../../components/analytics/analytics-controller.tsx";
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, readAnalyticsConsent } from "./consent.ts";
import { ATTRIBUTION_STORAGE_KEY, captureCampaignAttribution, clearCampaignAttribution, configureAttributionOrigins } from "../attribution.ts";

let local, session, listeners;
const origin = "https://www.americanmovingchoice.com";
const props = { enabled: false, containerId: undefined, origin };
function render(options = props) {
  hooks.cursor = 0;
  let result = AnalyticsController(options);
  const effects = hooks.effects.splice(0); for (const effect of effects) effect();
  hooks.cursor = 0; result = AnalyticsController(options);
  return result;
}
function nodes(value) { if (Array.isArray(value)) return value.flatMap(nodes); return React.isValidElement(value) ? [value, ...nodes(value.props.children)] : []; }
function text(value) { if (Array.isArray(value)) return value.map(text).join(" "); return React.isValidElement(value) ? text(value.props.children) : typeof value === "string" ? value : ""; }
function button(tree, label) { const result = nodes(tree).find(node => node.type === "button" && text(node) === label); expect(result, label).toBeDefined(); return result; }

beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.effects = []; vi.clearAllMocks();
  metrics.initializeAnalytics.mockReturnValue(false); metrics.analyticsLoaded.mockReturnValue(false);
  local = new Map(); session = new Map(); listeners = new Map();
  const store = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  const win = { location: { origin, hostname: "www.americanmovingchoice.com", protocol: "https:", pathname: "/planning/", search: "?utm_source=google&utm_medium=cpc&utm_campaign=moving-search", reload: vi.fn() }, innerWidth: 390,
    localStorage: store(local), sessionStorage: store(session), setTimeout: fn => { fn(); return 1; },
    addEventListener: (name, callback) => { const list = listeners.get(name) ?? new Set(); list.add(callback); listeners.set(name, list); },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    dispatchEvent: event => { for (const callback of listeners.get(event.type) ?? []) callback(event); return true; },
  };
  vi.stubGlobal("window", win); vi.stubGlobal("document", { cookie: "", referrer: "https://www.google.com/search?q=moving" }); vi.stubGlobal("navigator", {});
  configureAttributionOrigins([origin, "https://app.americanmovingchoice.com"]); clearCampaignAttribution();
});
afterEach(() => { for (const slot of hooks.slots) slot?.cleanup?.(); clearCampaignAttribution(); vi.unstubAllGlobals(); });

describe("measurement choices before a Google container is configured", () => {
  it("offers first-party campaign choices with Google off and captures only after opt-in", () => {
    window.addEventListener(ANALYTICS_CONSENT_EVENT, () => captureCampaignAttribution());
    const tree = render();
    expect(text(tree)).toContain("Optional cookies");
    expect(session.has(ATTRIBUTION_STORAGE_KEY)).toBe(false);
    button(tree, "Allow analytics").props.onClick();
    expect(readAnalyticsConsent()).toBe("granted");
    expect(JSON.parse(session.get(ATTRIBUTION_STORAGE_KEY)).first.utmCampaign).toBe("moving-search");
    expect(render()).toBeNull(); expect(metrics.initializeAnalytics).not.toHaveBeenCalled(); expect(metrics.trackPageView).not.toHaveBeenCalled();
  });
  it("opens footer choices and clears existing campaign attribution when permission is withdrawn", () => {
    window.addEventListener(ANALYTICS_CONSENT_EVENT, () => captureCampaignAttribution());
    button(render(), "Allow analytics").props.onClick(); render();
    window.dispatchEvent(new Event("amc:analytics-choices"));
    button(render(), "Keep analytics off").props.onClick();
    expect(readAnalyticsConsent()).toBe("denied"); expect(session.has(ATTRIBUTION_STORAGE_KEY)).toBe(false);
    expect(metrics.initializeAnalytics).not.toHaveBeenCalled();
  });
  it("honors browser privacy controls even without a Google container", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    render(); window.dispatchEvent(new Event("amc:analytics-choices"));
    const tree = render(); expect(button(tree, "Allow analytics").props.disabled).toBe(true);
    button(tree, "Allow analytics").props.onClick();
    expect(readAnalyticsConsent()).toBe("denied"); expect(session.has(ATTRIBUTION_STORAGE_KEY)).toBe(false);
    expect(metrics.initializeAnalytics).not.toHaveBeenCalled();
  });
  it("does not initialize Google or open a public banner on private confirmation pages", () => {
    local.set(ANALYTICS_CONSENT_KEY, JSON.stringify({ version: 1, choice: "granted", savedAt: Date.now() }));
    window.location.pathname = "/get-quotes/confirmation/";
    expect(render()).toBeNull(); expect(metrics.initializeAnalytics).not.toHaveBeenCalled(); expect(metrics.trackPageView).not.toHaveBeenCalled();
  });
  it("keeps campaign choices usable when optional cookie cleanup is blocked", () => {
    metrics.revokeAnalytics.mockImplementationOnce(() => { throw new Error("cookie access blocked"); });
    expect(text(render())).toContain("Your privacy choices");
    expect(metrics.initializeAnalytics).not.toHaveBeenCalled(); expect(window.location.reload).not.toHaveBeenCalled();
  });
});
