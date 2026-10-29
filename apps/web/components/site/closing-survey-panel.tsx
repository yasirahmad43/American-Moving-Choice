"use client";

import { usePathname } from "next/navigation";
import { useId, type ReactNode } from "react";
import { LineIcon } from "@amc/ui";
import { CarrierEligibilityStart } from "./carrier-eligibility-start";
import { HeroSurveyStart } from "./hero-survey-start";

export function ClosingSurveyPanel({ appUrl, consumerPhoto, carrierPhoto }: { appUrl: string; consumerPhoto: ReactNode; carrierPhoto: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const carrier = pathname === "/for-movers" || pathname.startsWith("/for-movers/") || /^\/mover-terms\/?$/.test(pathname);
  const heading = useId();
  return <section className="closing-survey" data-closing-survey="" data-audience={carrier ? "carrier" : "consumer"} aria-labelledby={heading}>
    <div className="closing-survey__inner">
      <div className="closing-survey__visual">
        {carrier ? carrierPhoto : consumerPhoto}
        <div className="closing-survey__wash" aria-hidden="true" />
        <div className="closing-survey__copy">
          <p className="closing-survey__eyebrow"><span aria-hidden="true" />{carrier ? "Your company's next chapter" : "Your next chapter"}</p>
          <h2 id={heading}>{carrier ? <>The right requests.<br />A clear next step.</> : <>A fresh start.<br />Your first step.</>}</h2>
          <p>{carrier ? "Find out whether your company fits the carrier-only network. Applying is free, and every application is screened." : "Start with your route and move size. Then review your request and choose how many companies may contact you, and how."}</p>
          <ul>
            <li><LineIcon name={carrier ? "truck" : "route"} size={18} />{carrier ? "Household-goods carriers only" : "Your move details come first"}</li>
            <li><LineIcon name={carrier ? "check" : "users"} size={18} />{carrier ? "Screening before approval" : "Your contact preferences stay in your hands"}</li>
          </ul>
        </div>
      </div>
      <div className="closing-survey__form">
        {carrier ? <CarrierEligibilityStart appUrl={appUrl} headingAs="h3" labels={{ heading: "Take the next carrier step.", next: "See my carrier next step", apply: "Continue to carrier application", change: "Change this carrier answer" }} />
          : <HeroSurveyStart headingAs="h3" labels={{ topline: "Ready when you are", routeHeading: "Start your moving plan.", detailsHeading: "Add your move details.", routeContinue: "Add details to my move", detailsContinue: "Open my moving request", editRoute: "Change these ZIP codes", opening: "Opening your moving request…" }} />}
      </div>
    </div>
  </section>;
}
