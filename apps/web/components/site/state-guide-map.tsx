import { STATES } from "@amc/server/geo";
import type { DiscoveryOverview } from "@amc/server/seo";
import shapes from "./state-guide-shapes.json";
import "./state-guide-map.css";

interface StateGuide { stateCode: string | null; url: string; h1: string }

/** Native SVG links are usable without hydration; the adjacent state search is the compact path. */
export function StateGuideMap({ guides, overview }: { guides: readonly StateGuide[]; overview: DiscoveryOverview | null }) {
  if (!guides.length) return null;
  const links = new Map(guides.map(guide => [guide.stateCode, guide]));
  const counts = new Map(overview?.states.map(state => [state.code, state.total]));
  return <figure className="state-guide-map" aria-labelledby="state-guide-map-title" data-motion="rise">
    <figcaption className="state-guide-map-heading">
      <div><p className="type-overline">Your next chapter, on the map</p><h3 id="state-guide-map-title">Explore state guides.</h3></div>
      <a href="#home-guide-library-guide-state">Search by state <span aria-hidden="true">↓</span></a>
    </figcaption>
    <svg viewBox="0 0 975 610" className="state-guide-map-art" role="group" aria-label="Map links to published state moving guides">
      <defs><pattern id="guide-map-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern></defs>
      <rect width="975" height="610" fill="url(#guide-map-grid)" className="state-guide-map-grid" />
      {shapes.map(shape => {
        const state = STATES.find(item => item.fips === shape.fips);
        const guide = state && links.get(state.code);
        if (!state) return null;
        const count = counts.get(state.code);
        const label = `${state.name}${count ? `: ${count.toLocaleString("en-US")} published moving guides` : ": moving guide"}`;
        return guide ? <a key={state.code} href={guide.url} aria-label={label} className="state-guide-map-link"><title>{label}</title><path d={shape.path} /></a> : <path key={state.code} d={shape.path} className="state-guide-map-unpublished" />;
      })}
    </svg>
    <div className="state-guide-map-note"><span><i aria-hidden="true" />{guides.length} state &amp; district guides</span><p>Choose a place. Get local facts, city guides and a clearer starting point.</p></div>
  </figure>;
}
