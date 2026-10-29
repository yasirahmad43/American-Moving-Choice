import { STATES } from "@amc/server/geo";
import type { DiscoveryOverview } from "@amc/server/seo";
import shapes from "./state-guide-shapes.json";
import "./state-guide-map.css";

interface StateGuide { stateCode: string | null; url: string; h1: string }

const CALLOUTS: Record<string, number> = { "50": 90, "33": 146, "25": 202, "44": 258, "09": 314, "34": 370, "10": 426, "24": 482, "11": 538 };
const LABELS: Record<string, { x?: number; y?: number; size?: number; rotate?: number }> = {
  "02": { x: 110, y: 531, size: 21 }, "06": { x: 89, y: 285, size: 17, rotate: 57 },
  "12": { x: 778, y: 526, size: 16, rotate: 50 }, "15": { x: 276, y: 604, size: 18 },
  "17": { size: 14 }, "18": { size: 14 }, "22": { x: 603, y: 533, size: 16 }, "26": { x: 684, y: 188, size: 14, rotate: -75 },
  "27": { x: 521, y: 143, size: 12.5 },
  "28": { size: 15, rotate: 88 }, "30": { size: 20 }, "36": { x: 828, y: 169, size: 16 },
  "37": { x: 800, y: 351, size: 14 }, "42": { size: 14 }, "45": { size: 14 },
  "48": { size: 24 }, "51": { x: 804, y: 305, size: 15, rotate: -12 }, "54": { x: 765, y: 283, size: 12.5 },
};

function StateName({ shape }: { shape: (typeof shapes)[number] }) {
  const calloutY = CALLOUTS[shape.fips];
  if (calloutY) return <g className="state-guide-map-callout" aria-hidden="true">
    <path className="state-guide-map-leader" d={`M${shape.centroid[0]},${shape.centroid[1]}H965L994,${calloutY}H1006`} />
    <circle cx={shape.centroid[0]} cy={shape.centroid[1]} r="2.4" className="state-guide-map-dot" />
    <rect x="1005" y={calloutY - 23} width="218" height="46" rx="7" className="state-guide-map-label-box" />
    <text x="1018" y={calloutY} dominantBaseline="central" className="state-guide-map-callout-name" data-state-name={shape.name}>{shape.name}</text>
  </g>;
  const override = LABELS[shape.fips];
  const x = override?.x ?? shape.centroid[0]!, y = override?.y ?? shape.centroid[1]!, size = override?.size ?? 17;
  const lines = shape.name.includes(" ") ? shape.name.split(" ") : [shape.name];
  return <>{shape.fips === "22" ? <g aria-hidden="true"><path className="state-guide-map-leader" d={`M${shape.centroid[0]},${shape.centroid[1]}V510L593,525`} /><circle cx={shape.centroid[0]} cy={shape.centroid[1]} r="2.4" className="state-guide-map-dot" /></g> : null}<text className={`state-guide-map-state-name${shape.fips === "15" || shape.fips === "22" ? " state-guide-map-water-name" : ""}`} data-state-name={shape.name} aria-hidden="true" textAnchor="middle" dominantBaseline="central"
    x={x} y={y - (lines.length - 1) * size * .53} fontSize={size} transform={override?.rotate ? `rotate(${override.rotate} ${x} ${y})` : undefined}>
    {lines.map((line,index) => <tspan key={line} x={x} dy={index ? size * 1.06 : 0}>{line}{index < lines.length - 1 ? " " : ""}</tspan>)}
  </text></>;
}

/** Native SVG links are usable without hydration; the adjacent state search is the compact path. */
export function StateGuideMap({ guides, overview }: { guides: readonly StateGuide[]; overview: DiscoveryOverview | null }) {
  if (!guides.length) return null;
  const links = new Map(guides.map(guide => [guide.stateCode, guide]));
  const counts = new Map(overview?.states.map(state => [state.code, state.total]));
  const byFips = new Map(shapes.map(shape => [shape.fips, shape]));
  return <figure className="state-guide-map" aria-labelledby="state-guide-map-title" data-motion="rise">
    <figcaption className="state-guide-map-heading">
      <div><p className="type-overline">Your next chapter, on the map</p><h3 id="state-guide-map-title">Explore state guides.</h3></div>
      <a href="#home-guide-library-guide-state">Search by state <span aria-hidden="true">↓</span></a>
    </figcaption>
    <p id="state-guide-map-help" className="state-guide-map-help"><span aria-hidden="true">↔</span> On smaller screens, scroll the map to read each state name, or use the state selector.</p>
    <div className="state-guide-map-viewport" role="region" aria-label="State guide map and labels" aria-describedby="state-guide-map-help" tabIndex={0}>
    <svg viewBox="-85 -10 1325 640" className="state-guide-map-art" role="group" aria-label="Map links to published state moving guides">
      <defs><pattern id="guide-map-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern></defs>
      <rect x="-85" y="-10" width="1325" height="640" fill="url(#guide-map-grid)" className="state-guide-map-grid" />
      <text x="1005" y="40" className="state-guide-map-callout-heading" aria-hidden="true">STATE GUIDE LINKS</text>
      {STATES.map(state => {
        const shape = byFips.get(state.fips);
        if (!shape) return null;
        const guide = links.get(state.code);
        const count = counts.get(state.code);
        const label = `${state.name}${count ? `: ${count.toLocaleString("en-US")} published moving guides` : ": moving guide"}`;
        const content = <><path d={shape.path} className="state-guide-map-shape" /><StateName shape={shape} /></>;
        return guide ? <a key={state.code} href={guide.url} aria-label={label} className="state-guide-map-link" data-state-code={state.code}><title>{label}</title>{content}</a> : <g key={state.code} className="state-guide-map-unpublished">{content}</g>;
      })}
    </svg>
    </div>
    <div className="state-guide-map-note"><span><i aria-hidden="true" />{guides.length} state &amp; district guides</span><p>Choose a place. Get local facts, city guides and a clearer starting point.</p></div>
  </figure>;
}
