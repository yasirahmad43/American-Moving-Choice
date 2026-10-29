"use client";

import { MOVE_SIZE_LABELS, PREFILL_STORAGE_KEY, SURVEY_MOVE_SIZES, addMonths, cleanZip, isSurveyMoveSize, parseWhen } from "@amc/core/src/survey";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";

type Errors = { originZip?: string; destZip?: string; moveSize?: string; moveDate?: string };
export interface HeroSurveyStartProps {
  originExample?: string;
  destinationExample?: string;
  contextLabel?: string;
  headingAs?: "h2" | "h3";
  labels?: Partial<{ routeHeading: string; detailsHeading: string; routeContinue: string; detailsContinue: string; editRoute: string; opening: string; topline: string }>;
}
const PATH = "/get-quotes/";
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** A local-only starter. Contact details and contact permission stay in the full survey. */
export function HeroSurveyStart({ originExample, destinationExample, contextLabel, headingAs = "h2", labels = {} }: HeroSurveyStartProps = {}) {
  const Heading = headingAs;
  // Location context is a hint, never a selected route or inferred customer intent.
  const fromExample = /^\d{5}$/.test(originExample ?? "") ? originExample! : "02108";
  const toExample = /^\d{5}$/.test(destinationExample ?? "") ? destinationExample! : "10001";
  const routeHint = contextLabel?.trim() && (originExample === fromExample || destinationExample === toExample)
    ? `${contextLabel.trim()}: start with your route. Enter your own ZIP codes below.`
    : "Start with your route. We'll take it from there.";
  const router = useRouter();
  const id = useId();
  const [step, setStep] = useState<0 | 1>(0);
  const [originZip, setOriginZip] = useState("");
  const [destZip, setDestZip] = useState("");
  const [moveSize, setMoveSize] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [today, setToday] = useState("");
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [announcement, setAnnouncement] = useState("");
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const origin = useRef<HTMLInputElement>(null);
  const destination = useRef<HTMLInputElement>(null);
  const size = useRef<HTMLSelectElement>(null);
  const date = useRef<HTMLInputElement>(null);
  const stepChanged = useRef(false);
  useEffect(() => { setToday(localToday()); setReady(true); }, []);
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0) {
      const next: Errors = {};
      if (!/^\d{5}$/.test(originZip)) next.originZip = "Enter the 5-digit ZIP code you're moving from.";
      if (!/^\d{5}$/.test(destZip)) next.destZip = "Enter the 5-digit ZIP code you're moving to.";
      setErrors(next);
      if (next.originZip || next.destZip) {
        setAnnouncement("Check the highlighted ZIP codes.");
        (next.originZip ? origin : destination).current?.focus();
        return;
      }
      setAnnouncement("Step 2 of 2. Your move details.");
      stepChanged.current = true;
      setStep(1);
      return;
    }
    const next: Errors = {};
    if (!isSurveyMoveSize(moveSize)) next.moveSize = "Choose the size of your move.";
    if (moveDate) {
      const result = parseWhen({ moveDate }, today || localToday());
      if (!result.ok) next.moveDate = result.errors.moveDate;
    }
    setErrors(next);
    if (next.moveSize || next.moveDate) {
      setAnnouncement("Check the highlighted move details.");
      (next.moveSize ? size : date).current?.focus();
      return;
    }
    try {
      // An explicit allowlist: no contact fields, company IDs, permissions, or URL parameters.
      sessionStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify({ entry: "household", originZip, destZip, moveSize, ...(moveDate ? { moveDate } : {}) }));
    } catch { /* Blocked storage still opens the full survey, which asks for the values again. */ }
    setAnnouncement("Opening your quote request.");
    startTransition(() => {
      // Re-entering from the quote page must remount its one-shot prefill reader.
      if (window.location.pathname.replace(/\/+$/, "") === PATH.replace(/\/+$/, "")) window.location.assign(PATH);
      else router.push(PATH);
    });
  }

  const error = (key: keyof Errors) => errors[key] ? <p id={`${id}-${key}-error`} className="vsh-start__error">{errors[key]}</p> : null;
  return (
    // The server-rendered first step has no named inputs: without JS it opens a clean survey URL.
    <form className="vsh-start" data-vsh-starter="quote" data-ready={ready || undefined} action={PATH} method="get" noValidate onSubmit={submit} aria-labelledby={`${id}-heading`}>
      <div className="vsh-start__topline"><span>{labels.topline ?? "Let's get you moving"}</span><span className="vsh-start__free"><span aria-hidden="true">✓</span> Free to request</span></div>
      <ol className="vsh-start__steps" aria-label="Start your move">
        <li aria-current={step === 0 ? "step" : undefined} data-complete={step === 1 || undefined}><span aria-hidden="true">{step === 1 ? "✓" : "01"}</span> Your route</li>
        <li aria-current={step === 1 ? "step" : undefined}><span aria-hidden="true">02</span> Move details</li>
      </ol>
      <div className="vsh-start__body" key={step}>
        <div className="vsh-start__heading"><Heading ref={heading} id={`${id}-heading`} tabIndex={-1}>{step === 0 ? (labels.routeHeading ?? "Where are you headed?") : (labels.detailsHeading ?? "Make it your move.")}</Heading><p>{step === 0 ? routeHint : "A little detail helps movers understand your move."}</p></div>
        {step === 0 ? <div className="vsh-start__fields">
          <div><div className="vsh-start__field"><label htmlFor={`${id}-origin`}>Moving from · ZIP code</label><input ref={origin} id={`${id}-origin`} inputMode="numeric" autoComplete="postal-code" placeholder={`e.g. ${fromExample}`} value={originZip} onChange={(event) => { setOriginZip(cleanZip(event.target.value)); setErrors((old) => ({ ...old, originZip: undefined })); }} aria-invalid={Boolean(errors.originZip)} aria-describedby={errors.originZip ? `${id}-originZip-error` : undefined} /></div>{error("originZip")}</div>
          <div><div className="vsh-start__field"><label htmlFor={`${id}-destination`}>Moving to · ZIP code</label><input ref={destination} id={`${id}-destination`} inputMode="numeric" autoComplete="off" placeholder={`e.g. ${toExample}`} value={destZip} onChange={(event) => { setDestZip(cleanZip(event.target.value)); setErrors((old) => ({ ...old, destZip: undefined })); }} aria-invalid={Boolean(errors.destZip)} aria-describedby={errors.destZip ? `${id}-destZip-error` : undefined} /></div>{error("destZip")}</div>
        </div> : <>
          <div className="vsh-start__route"><span>{originZip}</span><svg aria-hidden="true" viewBox="0 0 60 14" fill="none"><path d="M1 7h55m-6-5 6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{destZip}</span><button type="button" onClick={() => { setErrors({}); setAnnouncement("Step 1 of 2. Your route."); stepChanged.current = true; setStep(0); }}>{labels.editRoute ?? "Edit route"}</button></div>
          <div className="vsh-start__fields">
            <div><div className="vsh-start__field"><label htmlFor={`${id}-size`}>What are you moving?</label><select ref={size} id={`${id}-size`} value={moveSize} onChange={(event) => { setMoveSize(event.target.value); setErrors((old) => ({ ...old, moveSize: undefined })); }} aria-invalid={Boolean(errors.moveSize)} aria-describedby={errors.moveSize ? `${id}-moveSize-error` : undefined}><option value="">Choose your move size</option>{SURVEY_MOVE_SIZES.map((value) => <option key={value} value={value}>{MOVE_SIZE_LABELS[value]}</option>)}</select></div>{error("moveSize")}</div>
            <div><div className="vsh-start__field"><label htmlFor={`${id}-date`}>Move date <span>· optional</span></label><input ref={date} id={`${id}-date`} type="date" value={moveDate} min={today || undefined} max={today ? addMonths(today, 12) : undefined} onChange={(event) => { setMoveDate(event.target.value); setErrors((old) => ({ ...old, moveDate: undefined })); }} aria-invalid={Boolean(errors.moveDate)} aria-describedby={errors.moveDate ? `${id}-moveDate-error` : undefined} /></div>{error("moveDate")}</div>
          </div>
        </>}
        <button className="vsh-start__submit" type="submit" disabled={pending}><span>{pending ? (labels.opening ?? "Opening your request…") : step === 0 ? (labels.routeContinue ?? "Continue to move details") : (labels.detailsContinue ?? "Continue to my request")}</span><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <p className="vsh-start__permission">Nothing is sent to a mover here. You'll choose your contact limit and permissions before sending your request.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div className="vsh-start__footer"><svg aria-hidden="true" width="15" height="17" viewBox="0 0 16 18" fill="none"><rect x="2" y="7" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" /></svg><span>Your move. Your contact preferences.</span></div>
    </form>
  );
}
