import type { ReactNode } from "react";
import { Breadcrumbs, LineIcon, cx, type LineIconName } from "@amc/ui";
import { AmbientVideo } from "@/components/media/ambient-video";
import { pageMediaPlan } from "@/lib/page-media";
import { HeroSurveyStart } from "./hero-survey-start";
import { StateGuideBadge } from "./state-guide-badge";
import "./video-survey-hero.css";

export interface VideoSurveyHeroProps {
  url: string;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  /** The real quote survey can replace the starter without changing the page's hero. */
  survey?: ReactNode;
  className?: string;
  originExample?: string;
  destinationExample?: string;
  contextLabel?: string;
  /** Name the right-hand interaction when it serves a different audience. */
  surveyLabel?: string;
  mobileActionLabel?: string;
  mobileActionHref?: string;
}

type Scene = "route" | "cost" | "planning" | "service" | "carrier";
function sceneFor(url: string): Scene {
  if (url.startsWith("/for-movers/") || url === "/mover-terms/") return "carrier";
  if (/cost|price|calculator|estimate/.test(url)) return "cost";
  if (/planning|question|guide|explore|how-it-works/.test(url)) return "planning";
  if (/service|packing|storage|for-movers/.test(url)) return "service";
  return "route";
}
const SCENES: Record<Scene, { from: string; to: string; items: { icon: LineIconName; text: string }[] }> = {
  carrier: { from: "Your coverage", to: "Matching requests", items: [{ icon: "truck", text: "Household-goods carriers only" }, { icon: "check", text: "Screening before approval" }, { icon: "ledger", text: "Preview before you buy" }] },
  route: { from: "Your move", to: "Your next chapter", items: [{ icon: "route", text: "Your route comes first" }, { icon: "users", text: "You set the contact limit" }, { icon: "truck", text: "Companies introduce themselves" }] },
  cost: { from: "Plan the details", to: "Understand the quote", items: [{ icon: "chart", text: "Explore planning costs" }, { icon: "ledger", text: "Compare quotes directly" }, { icon: "users", text: "You set the contact limit" }] },
  planning: { from: "A clearer plan", to: "One step at a time", items: [{ icon: "calendar", text: "Plan your next steps" }, { icon: "check", text: "Keep the details together" }, { icon: "users", text: "Choose your contact preferences" }] },
  service: { from: "What you need", to: "A move that fits", items: [{ icon: "box", text: "Tell us what you need" }, { icon: "route", text: "Start with your route" }, { icon: "users", text: "Choose how companies contact you" }] },
};

function SceneGraphic({ kind }: { kind: Scene }) {
  if (kind === "cost") return <svg viewBox="0 0 300 54" fill="none" focusable="false"><path d="M10 9h280M10 27h280M10 45h280" stroke="currentColor" strokeOpacity=".3" /><path d="M15 9h120M15 27h190M15 45h150" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /><path className="vsh__ledger-marker" d="M235 4v46" stroke="#ff6b7d" strokeWidth="2" /></svg>;
  if (kind === "planning") return <svg viewBox="0 0 300 54" fill="none" focusable="false"><path d="M12 27h276" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" />{[12, 104, 196, 288].map((x, i) => <g key={x} className="vsh__timeline-stop" style={{ animationDelay: `${i * 130}ms` }}><circle cx={x} cy="27" r="7" fill={i === 3 ? "#e1192d" : "#082c58"} stroke="white" strokeWidth="2" /><path d={`M${x - 2.5} 27l2 2 3.5-4`} stroke="white" strokeWidth="1.2" /></g>)}</svg>;
  if (kind === "service") return <svg viewBox="0 0 300 54" fill="none" focusable="false"><g className="vsh__service-panels" stroke="currentColor" strokeWidth="1.4"><rect x="36" y="7" width="66" height="40" rx="5" /><rect x="117" y="4" width="66" height="46" rx="5" /><rect x="198" y="7" width="66" height="40" rx="5" /><path d="M48 19h42M48 29h30M129 17h42M129 27h30M210 19h42M210 29h30" strokeOpacity=".5" /></g><path d="m141 37 6 5 12-13" stroke="#ff6b7d" strokeWidth="2.5" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 300 50" fill="none" focusable="false"><path d="M10 33C68 33 69 9 135 9S212 33 288 17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" /><circle cx="10" cy="33" r="5" fill="#082c58" stroke="white" strokeWidth="2" /><circle className="vsh__route-point" cx="288" cy="17" r="6" fill="#e1192d" stroke="white" strokeWidth="2" /></svg>;
}

/** One cinematic opening and one H1. Media is planned without claiming another page's asset. */
export function VideoSurveyHero({ url, title, description, eyebrow, breadcrumbs, children, survey, className, originExample, destinationExample, contextLabel, surveyLabel = "Start your quote request", mobileActionLabel = "Plan my move", mobileActionHref = "#hero-survey" }: VideoSurveyHeroProps) {
  const { video } = pageMediaPlan(url);
  const scene = sceneFor(url);
  const story = SCENES[scene];
  const embedded = survey !== undefined && survey !== null;
  return (
    <section className={cx("vsh", embedded && "vsh--embedded", scene === "carrier" && "vsh--carrier", className)} data-scene={scene} aria-labelledby="page-title">
      {/* The layer is intentionally accessible: AmbientVideo's Pause/Play button stays usable. */}
      <div className="vsh__media"><AmbientVideo asset={video} /></div>
      <div className="vsh__wash" aria-hidden="true" />
      <div className="vsh__texture" aria-hidden="true" />
      <div className="vsh__inner">
        <div className="vsh__copy">
          {breadcrumbs?.length ? <div className="vsh__breadcrumbs"><Breadcrumbs items={breadcrumbs} /></div> : null}
          <p className="vsh__eyebrow"><span aria-hidden="true" />{eyebrow ?? "A new place. A fresh start."}</p>
          <h1 id="page-title" className="vsh__title">{title}</h1>
          {description ? <div className="vsh__description">{description}</div> : null}
          <a className="vsh__mobile-action" href={mobileActionHref}>{mobileActionLabel} <span aria-hidden="true">↓</span></a>
        </div>
        <div id="hero-survey" tabIndex={-1} role="region" aria-label={surveyLabel} className="vsh__survey">
          {survey ?? <HeroSurveyStart originExample={originExample} destinationExample={destinationExample} contextLabel={contextLabel} />}
        </div>
        <div className="vsh__supplement">
          {/^\/movers\/[^/]+\//.test(url) ? <StateGuideBadge url={url} /> : <div className="vsh__route" aria-hidden="true">
            <span className="vsh__route-word">{story.from}</span>
            <SceneGraphic kind={scene} />
            <span className="vsh__route-word">{story.to}</span>
          </div>}
          {children ? <div className="vsh__support" data-motion="stagger">{children}</div> : null}
          <ul className="vsh__promises">
            {story.items.map((item) => <li key={item.text}><LineIcon name={item.icon} size={16} />{item.text}</li>)}
          </ul>
          {video.credit.attribution_required ? <p className="vsh__credit">Video: {video.credit.source_url ? <a href={video.credit.source_url} rel="noopener noreferrer">{video.credit.creator}</a> : video.credit.creator} · {video.credit.license}</p> : null}
        </div>
      </div>
      <div className="vsh__edge" aria-hidden="true"><span /><i /></div>
    </section>
  );
}
