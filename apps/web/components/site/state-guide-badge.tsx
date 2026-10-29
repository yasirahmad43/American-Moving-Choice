import Link from "next/link";
import { STATES } from "@amc/server/geo";
import shapes from "./state-guide-shapes.json";

/** Real state geometry gives each place guide its own local identity, without inventing a route. */
export function StateGuideBadge({ url }: { url: string }) {
  const slug = /^\/movers\/([^/]+)\//.exec(url)?.[1];
  const state = STATES.find(item => item.slug === slug);
  const shape = state && shapes.find(item => item.fips === state.fips);
  if (!state || !shape) return null;
  const content = <>
    <svg className="vsh-place__shape" viewBox={shape.viewBox} aria-hidden="true" focusable="false"><path d={shape.path} /></svg>
    <span className="vsh-place__copy"><span className="vsh-place__label">Your local starting point</span><strong>{state.name}</strong><span>State facts. City guides. A clearer plan. {url !== `/movers/${state.slug}/` ? <span aria-hidden="true">↗</span> : null}</span></span>
    <span className="vsh-place__code" aria-hidden="true">{state.code}</span>
  </>;
  return url === `/movers/${state.slug}/` ? <div className="vsh-place">{content}</div> : <Link href={`/movers/${state.slug}/`} className="vsh-place" aria-label={`Explore the ${state.name} moving guide`}>{content}</Link>;
}
