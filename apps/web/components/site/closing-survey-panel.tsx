"use client";

import { useId, type ReactNode } from "react";
import { LineIcon } from "@amc/ui";
import { HeroSurveyStart } from "./hero-survey-start";

export function ClosingSurveyPanel({ consumerPhoto }: { consumerPhoto: ReactNode }) {
  const heading = useId();
  return <section className="closing-survey" tabIndex={-1} data-closing-survey="" data-audience="consumer" aria-labelledby={heading}>
    <div className="closing-survey__inner">
      <div className="closing-survey__visual">
        {consumerPhoto}
        <div className="closing-survey__wash" aria-hidden="true" />
        <div className="closing-survey__copy">
          <p className="closing-survey__eyebrow"><span aria-hidden="true" />Your next chapter</p>
          <h2 id={heading}>A fresh start.<br />Your first step.</h2>
          <p>Start with your route and move size. Choose how many companies may contact you, then review and send your request.</p>
          <ul>
            <li><LineIcon name="route" size={18} />Your move details come first</li>
            <li><LineIcon name="users" size={18} />Your contact preferences stay in your hands</li>
          </ul>
        </div>
      </div>
      <div className="closing-survey__form">
        <HeroSurveyStart headingAs="h3" labels={{ topline: "Ready when you are", routeHeading: "Start your moving plan.", detailsHeading: "Add your move details.", routeContinue: "Add details to my move", detailsContinue: "Open my moving request", editRoute: "Change these ZIP codes", opening: "Opening your moving request…" }} />
      </div>
    </div>
  </section>;
}
