import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";
import { STATES } from "../../../../packages/server/src/geo/states.ts";

vi.mock("server-only", () => ({}));
vi.mock("@amc/server/geo", async () => import("../../../../packages/server/src/geo/states.ts"));
const { StateGuideMap } = await import("../site/state-guide-map.tsx");
const guides = STATES.map(state => ({ stateCode: state.code, url: `/movers/${state.slug}/`, h1: `Moving in ${state.name}` }));

describe("responsive native state discovery", () => {
  it("retains every published state destination in both the map and readable narrow atlas", () => {
    const html = renderToStaticMarkup(createElement(StateGuideMap, { guides, overview: null }));
    const codes = [...html.matchAll(/data-state-code="([A-Z]+)"/g)].map(match => match[1]);
    expect(codes).toHaveLength(102);
    expect(new Set(codes).size).toBe(51);
    for (const state of STATES) {
      expect(codes.filter(code => code === state.code)).toHaveLength(2);
      expect(html.split(`href="/movers/${state.slug}/"`).length - 1).toBe(2);
    }
    expect(html.match(/name="state-guide-region"/g)).toHaveLength(5);
    expect(html).toContain('data-state-name="District of Columbia"');
    expect(html).not.toMatch(/scroll the map|<button|onClick|javascript:/i);
  });

  it("omits unpublished atlas links and empty regions without inventing destinations", () => {
    expect(renderToStaticMarkup(createElement(StateGuideMap, { guides: [], overview: null }))).toBe("");
    const selected = guides.filter(guide => ["NY", "RI"].includes(guide.stateCode));
    const html = renderToStaticMarkup(createElement(StateGuideMap, { guides: selected, overview: null }));
    expect(html.match(/name="state-guide-region"/g)).toHaveLength(1);
    expect(html.match(/data-state-code=/g)).toHaveLength(4);
    expect(html).not.toContain('href="/movers/california/"');
    expect(html).toContain('href="/movers/rhode-island/"');
    expect(html).toContain("2 state &amp; district guides");
  });
});
