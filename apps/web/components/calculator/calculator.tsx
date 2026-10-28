"use client";

/**
 * The moving cost calculator island (content/pages/costs/moving-cost-calculator.md, widget copy).
 * Native inputs, nothing preselected, answers kept in component state only: never in the URL,
 * analytics or storage until the reader chooses the call to action, which writes the quote
 * survey's prefill to sessionStorage and opens /get-quotes/ with no query string.
 */
import {
  COST_SERVICES,
  MOVE_SIZES,
  MOVE_SIZE_LABELS,
  SERVICE_LABELS,
  SURVEY_PREFILL_KEY,
  canonicalServices,
  joinWithAnd,
  parseCalculatorAnswers,
  stillNeeded,
  surveyPrefillFor,
  type SurveyPrefill,
} from "@amc/core";
import { Alert, Button, Checkbox, Field, Input, RadioCardGroup, cx } from "@amc/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { calculateAction, checkRouteAction, type CalculatorView, type RouteCheckView } from "./actions";
import { COPY, HOW_MOVERS_CHARGE, METHOD_LINK, MONEY_PAGE, errorCountText, errorText, type TokenCopy } from "./copy";

type AnswerKey = "origin" | "destination" | "size";
type TextPart = { kind: "text"; text: string } | { kind: "link"; label: string };

export interface CalculatorProps {
  tokenCopy: TokenCopy;
  /** ST-7 as stored, with its {{cost.result.*}} tokens unfilled. */
  st7: string;
  /** ST-6 verbatim. */
  st6: string;
  /** ST-1b split into text and its "[How AMC makes money]" link. */
  st1b: TextPart[];
}

const SERVICE_HELP_IDS = { packing: null, storage: "form.services.storage.help", specialty_items: "form.services.specialty_items.help" } as const;

/** ST-7 with the result's values; the range may render large, but only inside the label. */
function RangeLabelText({ template, values }: { template: string; values: Record<string, string> }) {
  const colon = template.indexOf(":");
  const lead = colon > 0 ? template.slice(0, colon + 1) : "";
  const rest = colon > 0 ? template.slice(colon + 1) : template;
  const pieces = rest.split(/(\{\{[a-z0-9_.]+\}\}|\[[^\]]+\])/i).filter(Boolean);
  return (
    <p className="text-text">
      {lead ? <strong>{lead}</strong> : null}
      {pieces.map((piece, index) => {
        const tokenMatch = /^\{\{(.+)\}\}$/.exec(piece);
        if (tokenMatch) {
          const key = tokenMatch[1]!;
          const value = values[key] ?? "[pending]";
          return key === "cost.result.range" ? (
            <span key={index} className="tabular block py-1 type-h3 text-text sm:inline sm:py-0">
              {value}
            </span>
          ) : (
            <span key={index} className={key === "cost.result.as_of" ? "tabular" : undefined}>
              {value}
            </span>
          );
        }
        const linkMatch = /^\[(.+)\]$/.exec(piece);
        if (linkMatch) {
          return (
            <Link key={index} href={METHOD_LINK} className="link">
              {linkMatch[1]}
            </Link>
          );
        }
        return <span key={index}>{piece}</span>;
      })}
    </p>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid list-disc gap-1 pl-6 text-text">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ResultHeading({ children, headingRef }: { children: ReactNode; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <h2 ref={headingRef} tabIndex={-1} className="type-h3 text-text focus:outline-none">
      {children}
    </h2>
  );
}

export function Calculator({ tokenCopy, st7, st6, st1b }: CalculatorProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<AnswerKey, string>>>({});
  const [errorAnnouncement, setErrorAnnouncement] = useState("");
  const [routeCheck, setRouteCheck] = useState<RouteCheckView | null>(null);
  const [view, setView] = useState<CalculatorView | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const routeRequest = useRef(0);
  const [errorAttempt, setErrorAttempt] = useState(0);

  const answers = useMemo(() => ({ origin, destination, size, services: canonicalServices(services) }), [origin, destination, size, services]);
  const answersKey = JSON.stringify(answers);
  const changed = view !== null && view.kind !== "invalid" && viewKey !== answersKey;
  const missing = stillNeeded(answers);

  // Route summary: ask the server once a ZIP code has five digits (debounced; answers stay in the POST body).
  useEffect(() => {
    const digits = (value: string) => value.replace(/\D/g, "").slice(0, 5);
    if (digits(origin).length < 5 && digits(destination).length < 5) {
      setRouteCheck(null);
      return;
    }
    const request = ++routeRequest.current;
    const timer = setTimeout(async () => {
      const checked = await checkRouteAction(origin, destination);
      if (request === routeRequest.current) setRouteCheck(checked);
    }, 250);
    return () => clearTimeout(timer);
  }, [origin, destination]);

  // Focus the heading of whatever renders in the result area.
  useEffect(() => {
    if (view && view.kind !== "invalid") headingRef.current?.focus();
  }, [view]);

  // On a failed submit, focus the first invalid field.
  useEffect(() => {
    if (errorAttempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errorAttempt]);

  const clearError = (field: AnswerKey) => setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  function run() {
    const parsed = parseCalculatorAnswers(answers);
    if (!parsed.ok) {
      const next: Partial<Record<AnswerKey, string>> = {};
      for (const [field, id] of Object.entries(parsed.errors)) {
        const zip = field === "size" ? undefined : (field === "origin" ? origin : destination).replace(/\D/g, "").slice(0, 5);
        next[field as AnswerKey] = errorText(id, zip);
      }
      showErrors(next);
      return;
    }
    const key = answersKey;
    startTransition(async () => {
      let result: CalculatorView;
      try {
        result = await calculateAction(answers);
      } catch {
        result = { kind: "error" };
      }
      if (result.kind === "invalid") {
        showErrors(result.errors);
        return;
      }
      setErrors({});
      setErrorAnnouncement("");
      setView(result);
      setViewKey(key);
    });
  }

  function showErrors(next: Partial<Record<AnswerKey, string>>) {
    setErrors(next);
    setErrorAttempt((n) => n + 1);
    const count = Object.values(next).filter(Boolean).length;
    setErrorAnnouncement(count ? errorCountText(count) : "");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run();
  }

  /** The values carried into the quote survey: from the result, or from valid answers after an error. */
  const prefill: SurveyPrefill | null = (() => {
    if (!view || view.kind === "invalid") return null;
    if (view.kind !== "error") return view.prefill;
    const parsed = parseCalculatorAnswers(answers);
    return parsed.ok ? surveyPrefillFor(parsed.query) : null;
  })();

  function continueToSurvey() {
    if (!prefill) return;
    try {
      sessionStorage.setItem(SURVEY_PREFILL_KEY, JSON.stringify(prefill));
    } catch {
      // Storage can be blocked; the survey then starts empty.
    }
    router.push("/get-quotes/");
  }

  const zipHelp = (side: "origin" | "destination") => {
    const check = routeCheck?.[side];
    return check?.status === "resolved" ? check.text : COPY[`form.${side}.help`];
  };
  const zipError = (side: "origin" | "destination") => {
    if (errors[side]) return errors[side];
    const check = routeCheck?.[side];
    return check?.status === "error" ? check.message : undefined;
  };

  const progressText =
    missing.length === 0 ? COPY["form.progress.done"] : `Still needed: ${joinWithAnd(missing.map((field) => COPY[`form.progress.${field}`]))}`;

  return (
    <div className="grid gap-8">
      <form ref={formRef} aria-label={COPY["form.name"]} noValidate onSubmit={onSubmit} className="grid gap-7 rounded-card border border-border bg-surface p-4 sm:p-6">
        <fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0">
          <legend className="mb-1 p-0 type-h4 text-text">{COPY["form.route.legend"]}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="calc-origin" label={COPY["form.origin.label"]} help={zipHelp("origin")} error={zipError("origin")}>
              <Input
                name="origin"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  clearError("origin");
                }}
              />
            </Field>
            <Field id="calc-destination" label={COPY["form.destination.label"]} help={zipHelp("destination")} error={zipError("destination")}>
              <Input
                name="destination"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  clearError("destination");
                }}
              />
            </Field>
          </div>
          {routeCheck?.route ? (
            <div className="grid gap-1 rounded-control bg-surface-2 px-4 py-3" data-testid="route-summary">
              <p className="font-semibold text-text">{routeCheck.route.summary}</p>
              <p className="tabular text-text-2">{routeCheck.route.distance}</p>
              <p className="text-text-2">
                <span className="font-semibold text-text">{routeCheck.route.typeLabel}</span>
                {": "}
                {routeCheck.route.typeHelp}
              </p>
              <p className="type-small text-text-3">{COPY["route.check"]}</p>
            </div>
          ) : null}
          {routeCheck?.route?.sameZip ? (
            <Alert tone="info" role="none">
              {COPY["notice.zip.same"]}
            </Alert>
          ) : null}
        </fieldset>

        <RadioCardGroup
          id="calc-size"
          name="size"
          legend={COPY["form.size.legend"]}
          help={COPY["form.size.help"]}
          error={errors.size}
          columns={2}
          value={size}
          onValueChange={(value) => {
            setSize(value);
            clearError("size");
          }}
          options={MOVE_SIZES.map((value) => ({ value, label: MOVE_SIZE_LABELS[value] }))}
        />

        <fieldset className="m-0 grid min-w-0 gap-1 border-0 p-0" aria-describedby="calc-services-help">
          <legend className="mb-1 p-0 text-[0.9375rem] font-semibold text-text">{COPY["form.services.legend"]}</legend>
          <p id="calc-services-help" className="type-small text-text-3">
            {COPY["form.services.help"]}
          </p>
          {COST_SERVICES.map((service) => {
            const helpId = SERVICE_HELP_IDS[service];
            return (
              <Checkbox
                key={service}
                id={`calc-service-${service}`}
                name="services"
                value={service}
                label={SERVICE_LABELS[service]}
                description={helpId ? tokenCopy[helpId] : COPY["form.services.packing.help"]}
                checked={services.includes(service)}
                onChange={(event) =>
                  setServices((current) => (event.target.checked ? [...current, service] : current.filter((s) => s !== service)))
                }
              />
            );
          })}
        </fieldset>

        <div className="grid gap-3">
          <p className="text-text-2" data-testid="progress">
            {progressText}
          </p>
          <div>
            <Button type="submit" variant="primary" loading={pending} loadingLabel={COPY["form.submit.busy"]}>
              {COPY["form.submit"]}
            </Button>
          </div>
          <p className="type-small text-text-2">{COPY["form.privacy"]}</p>
          <p aria-live="polite" className="sr-only">
            {errorAnnouncement}
          </p>
        </div>
      </form>

      <div className="empty:hidden" data-nosnippet="" data-testid="result-area">
        {view && view.kind !== "invalid" ? (
          <div className="grid gap-6">
            {changed ? (
              <Alert tone="info" role="none">
                {COPY["results.changed"]}
              </Alert>
            ) : null}
            <section className={cx("grid gap-5", changed && "opacity-50")} aria-labelledby="calc-result-heading">
              <ResultArea view={view} st7={st7} st6={st6} tokenCopy={tokenCopy} headingRef={headingRef} onRetry={run} pending={pending} />
            </section>
            {!changed && prefill ? (
              <div className="grid gap-3 border-t border-border pt-6">
                {view.kind !== "range" ? <p className="text-text">{COPY["state.next.intro"]}</p> : null}
                <div>
                  <Button variant="cta" onClick={continueToSurvey}>
                    {COPY["cta.button"]}
                  </Button>
                </div>
                <p className="type-small text-text-2">{COPY["cta.help"]}</p>
                <p className="type-small text-text-2" data-testid="money-line">
                  {st1b.map((part, index) =>
                    part.kind === "text" ? (
                      <span key={index}>{part.text}</span>
                    ) : (
                      <Link key={index} href={MONEY_PAGE} className="link">
                        {part.label}
                      </Link>
                    ),
                  )}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ResultArea({
  view,
  st7,
  st6,
  tokenCopy,
  headingRef,
  onRetry,
  pending,
}: {
  view: Exclude<CalculatorView, { kind: "invalid" }>;
  st7: string;
  st6: string;
  tokenCopy: TokenCopy;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onRetry: () => void;
  pending: boolean;
}) {
  const heading = (text: string) => (
    <div id="calc-result-heading">
      <ResultHeading headingRef={headingRef}>{text}</ResultHeading>
    </div>
  );
  switch (view.kind) {
    case "range":
      return (
        <>
          {heading(COPY["results.heading"])}
          <div className="rounded-control border-l-4 border-l-primary bg-surface-2 px-4 py-3" data-testid="range-label">
            <RangeLabelText
              template={st7}
              values={{
                "cost.result.range": view.label.range,
                "cost.result.scope": view.label.scope,
                "cost.result.basis": view.label.basis,
                "cost.result.as_of": view.label.asOf,
                "cost.model.version": view.label.modelVersion,
              }}
            />
          </div>
          <div className="grid gap-2">
            <h3 className="type-h4 text-text">{COPY["results.assume.heading"]}</h3>
            <List items={view.lists.assumes} />
          </div>
          <div className="grid gap-2">
            <h3 className="type-h4 text-text">{COPY["results.includes.heading"]}</h3>
            <p className="text-text">{COPY["results.includes.intro"]}</p>
            <List items={view.lists.includes} />
          </div>
          <div className="grid gap-2">
            <h3 className="type-h4 text-text">{COPY["results.excludes.heading"]}</h3>
            <List items={view.lists.excludes} />
            <p className="text-text">
              <Link href={HOW_MOVERS_CHARGE} className="link">
                How movers charge
              </Link>{" "}
              explains valuation and these extra charges.
            </p>
          </div>
          <p className="type-small text-text-2" data-testid="st-6">
            {st6}
          </p>
        </>
      );
    case "no_data":
      if (view.cause === "stale") {
        return (
          <>
            {heading(COPY["state.stale.heading"])}
            <p className="text-text">{tokenCopy["state.stale.body"]}</p>
          </>
        );
      }
      return (
        <>
          {heading(COPY["state.no_data.heading"])}
          <p className="text-text">{tokenCopy["state.no_data.body"]}</p>
          {view.cause === "services" ? <p className="text-text">{COPY["state.no_data.services"]}</p> : null}
        </>
      );
    case "size_unpriced":
      return (
        <>
          {heading(COPY["state.size_unpriced.heading"])}
          <p className="text-text">{COPY["state.size_unpriced.body"]}</p>
        </>
      );
    case "error":
      return (
        <>
          {heading(COPY["state.error.heading"])}
          <p className="text-text">{COPY["state.error.body"]}</p>
          <div>
            <Button variant="secondary" onClick={onRetry} loading={pending}>
              {COPY["state.error.retry"]}
            </Button>
          </div>
        </>
      );
  }
}
