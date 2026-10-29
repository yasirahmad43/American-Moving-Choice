"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type Authority = "carrier" | "broker" | "unsure";

/** A local orientation check. Approval happens only in the existing application flow. */
export function CarrierEligibilityStart({ appUrl }: { appUrl: string }) {
  const id = useId();
  const [authority, setAuthority] = useState<Authority | "">("");
  const [result, setResult] = useState<Authority | null>(null);
  const [error, setError] = useState(false);
  const input = useRef<HTMLSelectElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const changedStep = useRef(false);
  useEffect(() => {
    if (result) { changedStep.current = true; heading.current?.focus({ preventScroll: true }); }
    else if (changedStep.current) input.current?.focus({ preventScroll: true });
  }, [result]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authority) { setError(true); input.current?.focus(); return; }
    setError(false);
    setResult(authority);
  }
  return <form className="vsh-start" data-carrier-starter="" action="/for-movers/eligibility/" method="get" noValidate onSubmit={submit} aria-labelledby={`${id}-heading`}>
    <div className="vsh-start__topline"><span>A network for carriers</span><span className="vsh-start__free"><span aria-hidden="true">✓</span> Free to apply</span></div>
    <ol className="vsh-start__steps" aria-label="Before you apply">
      <li aria-current={result ? undefined : "step"} data-complete={result ? true : undefined}><span aria-hidden="true">{result ? "✓" : "01"}</span> Your authority</li>
      <li aria-current={result ? "step" : undefined}><span aria-hidden="true">02</span> Your next step</li>
    </ol>
    <div className="vsh-start__body" key={result ? "next-step" : "authority"}>
      {!result ? <>
        <div className="vsh-start__heading"><h2 id={`${id}-heading`}>Start with your authority.</h2><p>Choose the description that fits your federal record. We verify every application.</p></div>
        <div><div className="vsh-start__field">
          <label htmlFor={`${id}-authority`}>Your company&apos;s authority</label>
          <select ref={input} id={`${id}-authority`} value={authority} onChange={(event) => { setAuthority(event.target.value as Authority | ""); setError(false); }} aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined}>
            <option value="">Choose your authority type</option><option value="carrier">Carrier, without broker authority</option><option value="broker">Broker, or carrier and broker</option><option value="unsure">I&apos;m not sure yet</option>
          </select>
        </div>{error ? <p id={`${id}-error`} className="vsh-start__error">Choose the description that fits your company.</p> : null}</div>
        <button type="submit" className="vsh-start__submit"><span>Check my next step</span><span aria-hidden="true">→</span></button>
        <p className="vsh-start__permission">This check sends nothing and does not approve your company. Your federal record, business details and coverage are reviewed in the application.</p>
      </> : <>
        <div className="vsh-start__heading"><h2 ref={heading} tabIndex={-1} id={`${id}-heading`}>{result === "carrier" ? "Apply for a record review." : result === "broker" ? "Carrier authority only." : "Check your record first."}</h2>
          <p>{result === "carrier" ? "Household-goods carriers without broker authority can apply. Approval still depends on our screening." : result === "broker" ? "Companies with broker authority, including dual carrier and broker registrations, cannot join this network." : "Your federal record distinguishes carrier authority from broker authority. Review it before applying."}</p>
        </div>
        {result === "carrier" ? <><ul className="grid list-disc gap-2 pl-5 text-sm leading-relaxed text-text-2"><li>Have your USDOT and MC numbers ready.</li><li>Confirm the areas and move types you serve.</li><li>We check registration, authority and insurance filings before approval.</li></ul><a href={`${appUrl.replace(/\/+$/, "")}/signup`} className="vsh-start__submit"><span>Start my application</span><span aria-hidden="true">↗</span></a></> : <Link href={result === "broker" ? "/for-movers/eligibility/" : "/verify-a-mover/"} className="vsh-start__submit"><span>{result === "broker" ? "Read the eligibility rules" : "Check a federal record"}</span><span aria-hidden="true">↗</span></Link>}
        <button className="vsh-carrier__back" type="button" onClick={(event) => { event.preventDefault(); setResult(null); }}>Change my answer</button>
      </>}
    </div>
    <div className="vsh-start__footer"><span>Screening first. Your company&apos;s pipeline stays private.</span></div>
  </form>;
}
