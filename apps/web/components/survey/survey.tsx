"use client";

/**
 * The quote survey island (build plan §7.2; implications §2.1–§2.5, §3.1–§3.3; VD §9.2, §9.3,
 * §13.7). Steps: What you need, Where, When, Size and services, What we found, Your details, How
 * many movers, Review and send, then Confirmation. Household-move entry points start at Where.
 *
 * - Nothing is preselected and every input is native.
 * - Move details persist in sessionStorage so back navigation and reloads keep them; contact
 *   details are never stored client-side (VD §9.3).
 * - The server runs the matcher before any contact field (What we found) and again on sending.
 * - No ZIP code, date, size or contact detail goes into a URL or any analytics; this page loads no
 *   third-party script (site architecture §8.8).
 */
import {
  CHANNELS,
  CHANNEL_LABELS,
  DRAFT_STORAGE_KEY,
  MOVE_SIZE_LABELS,
  PREFILL_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  SERVICE_LABELS,
  STEP_LABELS,
  SURVEY_MOVE_SIZES,
  SURVEY_SERVICES,
  SURVEY_STEPS,
  addMonths,
  cleanZip,
  consentTextSha256,
  countOptions,
  isSurveyMoveSize,
  isSurveyService,
  parseDetails,
  parseNeed,
  parseSize,
  parseWhen,
  parseWhere,
  renderConsentText,
  type Channel,
  type FieldErrors,
  type Need,
  type SurveyService,
  type SurveyStep,
} from "@amc/core/src/survey";
import type { SubmitResult, SurveyCoverageResult } from "@amc/server/leads";
import { Alert, Button, Checkbox, Field, FieldError, Input, RadioCardGroup, Stepper, cx, errorId, formatAbsoluteDate } from "@amc/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { ConfirmationView, type ConfirmationData } from "./confirmation-view";
import { StoredTextLine, type SurveyTexts } from "./texts";

type FoundState = Extract<SurveyCoverageResult, { ok: true }>;
type Coverage = Extract<FoundState["coverage"], { ok: true }>;
type Mover = Coverage["movers"][number];

interface Draft {
  entry: "full" | "household";
  step: SurveyStep;
  need: Need | null;
  originZip: string;
  destZip: string;
  moveDate: string;
  flexible: boolean;
  latestDate: string;
  moveSize: string;
  services: SurveyService[];
  profileCompanyId: string | null;
}

interface Contact {
  channels: Channel[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Attribution {
  referrerOrigin: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

const EMPTY_DRAFT: Draft = {
  entry: "full",
  step: "need",
  need: null,
  originZip: "",
  destZip: "",
  moveDate: "",
  flexible: false,
  latestDate: "",
  moveSize: "",
  services: [],
  profileCompanyId: null,
};

const EMPTY_CONTACT: Contact = { channels: [], firstName: "", lastName: "", email: "", phone: "" };

/** The input each answer's error points at, for focus and aria-describedby. */
const FIELD_IDS: Record<string, string> = {
  need: "need",
  originZip: "origin-zip",
  destZip: "dest-zip",
  moveDate: "move-date",
  latestDate: "latest-date",
  moveSize: "move-size",
  services: "services",
  channels: "channels",
  firstName: "first-name",
  lastName: "last-name",
  email: "email",
  phone: "phone",
  limit: "limit",
  movers: "movers",
  consent: "consent",
  terms: "terms",
  form: "form-alert",
};

const FIELD_STEPS: Record<string, SurveyStep> = {
  need: "need",
  originZip: "where",
  destZip: "where",
  moveDate: "when",
  latestDate: "when",
  moveSize: "size",
  services: "size",
  channels: "details",
  firstName: "details",
  lastName: "details",
  email: "details",
  phone: "details",
};

/** Steps a restored draft may reopen on: later steps need contact details, which are never stored. */
const RESTORABLE: SurveyStep[] = ["need", "where", "when", "size"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readSession<T>(key: string, remove = false): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (remove) window.sessionStorage.removeItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the survey still works without it.
  }
}

/** Restores the draft, then applies a prefill and profile origin handed over by another page. */
function initialDraft(): { draft: Draft; prefilled: boolean } {
  const stored = readSession<Partial<Draft>>(DRAFT_STORAGE_KEY);
  const draft: Draft = { ...EMPTY_DRAFT };
  if (stored) {
    if (stored.entry === "household") draft.entry = "household";
    if (typeof stored.step === "string" && RESTORABLE.includes(stored.step)) draft.step = stored.step;
    if (typeof stored.need === "string" && ["household", "loading_help", "vehicle_only", "truck_rental"].includes(stored.need)) draft.need = stored.need;
    for (const key of ["originZip", "destZip", "moveDate", "latestDate"] as const) {
      if (typeof stored[key] === "string") draft[key] = stored[key].slice(0, 10);
    }
    draft.flexible = stored.flexible === true;
    if (isSurveyMoveSize(stored.moveSize)) draft.moveSize = stored.moveSize;
    if (Array.isArray(stored.services)) draft.services = stored.services.filter(isSurveyService);
    // Profile-specific acquisition is retired; restored drafts always use the central flow.
  }

  let prefilled = false;
  const prefill = readSession<Record<string, unknown>>(PREFILL_STORAGE_KEY, true);
  const profile = readSession<Record<string, unknown>>(PROFILE_STORAGE_KEY, true);
  const params = new URLSearchParams(window.location.search);
  if (prefill || profile || params.get("entry") === "household") {
    if (draft.entry !== "household") {
      draft.entry = "household";
      if (draft.step === "need") draft.step = "where";
    }
    if (!draft.need) draft.need = "household";
  }
  if (prefill) {
    // Carried values are shown for the visitor to confirm, never silently accepted (implications §2.2).
    if (typeof prefill.originZip === "string" && cleanZip(prefill.originZip).length === 5) draft.originZip = cleanZip(prefill.originZip);
    // Two writers: the home page sends destZip, the cost calculator destinationZip.
    const destZip = typeof prefill.destZip === "string" ? prefill.destZip : prefill.destinationZip;
    if (typeof destZip === "string" && cleanZip(destZip).length === 5) draft.destZip = cleanZip(destZip);
    if (isSurveyMoveSize(prefill.moveSize)) draft.moveSize = prefill.moveSize;
    if (typeof prefill.moveDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(prefill.moveDate)) draft.moveDate = prefill.moveDate;
    if (Array.isArray(prefill.services)) draft.services = prefill.services.filter(isSurveyService);
    prefilled = Boolean(draft.originZip || draft.destZip || draft.moveSize || draft.moveDate);
    draft.step = "where";
  }

  return { draft, prefilled };
}

function readAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  let referrerOrigin: string | null = null;
  try {
    if (document.referrer) {
      const origin = new URL(document.referrer).origin;
      if (origin !== window.location.origin) referrerOrigin = origin;
    }
  } catch {
    referrerOrigin = null;
  }
  return {
    referrerOrigin,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
  };
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const errorCount = (errors: FieldErrors) => Object.keys(errors).length;

export interface SurveyProps {
  texts: SurveyTexts;
  checkCoverage: (input: unknown) => Promise<SurveyCoverageResult>;
  submitRequest: (input: unknown) => Promise<SubmitResult>;
  lookupZip: (zip: unknown) => Promise<{ city: string; state: string } | null>;
  webUrl: string;
}

export function Survey(props: SurveyProps) {
  const restoration = useRef<ReturnType<typeof initialDraft> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [prefilled, setPrefilled] = useState(false);
  const [today, setToday] = useState("");
  const attribution = useRef<Attribution>({ referrerOrigin: null, utmSource: null, utmMedium: null, utmCampaign: null });

  useEffect(() => {
    // A one-shot prefill must not be consumed twice by development Strict Mode effect replay.
    const { draft: restored, prefilled: wasPrefilled } = restoration.current ??= initialDraft();
    setDraft(restored);
    setPrefilled(wasPrefilled);
    setToday(localToday());
    attribution.current = readAttribution();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <p className="text-text-2" role="status">
        Loading the quote survey…
      </p>
    );
  }
  return <SurveyFlow {...props} initial={draft} prefilled={prefilled} today={today} attribution={attribution.current} />;
}

function SurveyFlow({
  texts,
  checkCoverage,
  submitRequest,
  lookupZip,
  webUrl,
  initial,
  prefilled,
  today,
  attribution,
}: SurveyProps & { initial: Draft; prefilled: boolean; today: string; attribution: Attribution }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [found, setFound] = useState<FoundState | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [recount, setRecount] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ tone: "error" | "warning" | "info"; title: string; body?: ReactNode } | null>(null);
  const [infoPath, setInfoPath] = useState<"vehicle_only" | "truck_rental" | null>(null);
  const [done, setDone] = useState<{ confirmation: ConfirmationData; manageUrl: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [zipHelp, setZipHelp] = useState<{ origin: string | null; dest: string | null }>({ origin: null, dest: null });
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const focusField = useRef<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  const steps = useMemo(() => (draft.entry === "household" ? SURVEY_STEPS.filter((s) => s !== "need") : [...SURVEY_STEPS]), [draft.entry]);
  const stepIndex = Math.max(0, steps.indexOf(draft.step));

  // Move details persist across reloads; contact details never do.
  useEffect(() => {
    if (!done) writeSession(DRAFT_STORAGE_KEY, draft);
  }, [draft, done]);

  // Focus the step heading and announce the step on every change (VD §9.3), except on first load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (done) {
      confirmationRef.current?.focus();
      setAnnouncement("Request sent.");
      return;
    }
    headingRef.current?.focus();
    setAnnouncement(`Step ${stepIndex + 1} of ${steps.length}: ${STEP_LABELS[draft.step]}`);
  }, [draft.step, done, infoPath, stepIndex, steps.length]);

  // After errors render, move focus to the first invalid field (VD §9.2).
  useEffect(() => {
    const id = focusField.current;
    if (!id) return;
    focusField.current = null;
    const element = document.getElementById(id);
    const target = element instanceof HTMLFieldSetElement ? element.querySelector<HTMLElement>("input:not([disabled]), button") : element;
    target?.focus();
  }, [errors, alert]);

  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const goTo = useCallback(
    (step: SurveyStep) => {
      setErrors({});
      setAlert(null);
      update({ step });
    },
    [update],
  );

  const showErrors = useCallback((next: FieldErrors) => {
    setErrors(next);
    const keys = Object.keys(next);
    const first = keys.map((k) => FIELD_IDS[k]).find(Boolean);
    focusField.current = first ?? null;
    setAnnouncement(keys.length === 1 ? "1 answer needs attention." : `${keys.length} answers need attention.`);
  }, []);

  const back = () => {
    if (infoPath) {
      setInfoPath(null);
      return;
    }
    const previous = steps[stepIndex - 1];
    if (previous) goTo(previous);
  };

  // ---------------------------------------------------------------- derived values
  const coverage: Coverage | null = found && found.coverage.ok ? found.coverage : null;
  const movers: Mover[] = coverage?.movers ?? [];
  const named = movers.filter((m) => !removed.includes(m.companyId));
  const maxLimit = found?.maxLimit ?? 5;
  const consentText =
    found && limit !== null && named.length > 0 && limit <= named.length && contact.channels.length > 0
      ? renderConsentText(found.consent.body, { movers: named, limit, channels: contact.channels })
      : null;

  // ---------------------------------------------------------------- step handlers
  const submitNeed = (event: FormEvent) => {
    event.preventDefault();
    const result = parseNeed({ need: draft.need });
    if (!result.ok) return showErrors(result.errors);
    if (result.value.need === "vehicle_only" || result.value.need === "truck_rental") {
      setErrors({});
      setInfoPath(result.value.need);
      return;
    }
    goTo("where");
  };

  const submitWhere = (event: FormEvent) => {
    event.preventDefault();
    const result = parseWhere(draft);
    if (!result.ok) return showErrors(result.errors);
    update({ originZip: result.value.originZip, destZip: result.value.destZip });
    goTo("when");
  };

  const submitWhen = (event: FormEvent) => {
    event.preventDefault();
    const result = parseWhen(draft, today);
    if (!result.ok) return showErrors(result.errors);
    goTo("size");
  };

  const runCoverage = (onDone: (state: FoundState) => void) => {
    startTransition(async () => {
      try {
        const result = await checkCoverage({
          originZip: draft.originZip,
          destZip: draft.destZip,
          moveSize: draft.moveSize,
          services: draft.services,
          need: draft.need,
          profileCompanyId: null,
        });
        if (!result.ok) {
          if (result.kind === "rate_limited") {
            setAlert({ tone: "error", title: "Too many checks in a short time", body: "Wait a few minutes, then try again." });
            focusField.current = FIELD_IDS.form!;
            return;
          }
          const step = Object.keys(result.errors).map((k) => FIELD_STEPS[k]).find(Boolean);
          if (step && step !== draft.step) update({ step });
          showErrors(result.errors);
          return;
        }
        onDone(result);
      } catch {
        setAlert({ tone: "error", title: "We couldn't check coverage", body: "Check your connection and try again." });
        focusField.current = FIELD_IDS.form!;
      }
    });
  };

  const submitSize = (event: FormEvent) => {
    event.preventDefault();
    const result = parseSize(draft);
    if (!result.ok) return showErrors(result.errors);
    runCoverage((state) => {
      setFound(state);
      setLimit(null);
      setRemoved([]);
      setRecount(false);
      setConsentChecked(false);
      goTo("found");
    });
  };

  const submitDetails = (event: FormEvent) => {
    event.preventDefault();
    const result = parseDetails(contact);
    if (!result.ok) return showErrors(result.errors);
    goTo("count");
  };

  const chooseCount = (value: string) => {
    setErrors({});
    setRemoved([]);
    setLimit(Number(value));
    setRecount(false);
    setConsentChecked(false);
  };

  const submitCount = (event: FormEvent) => {
    event.preventDefault();
    if (limit === null || limit > named.length) return showErrors({ limit: "Choose how many moving companies you'd like to hear from." });
    goTo("review");
  };


  const handleResult = (result: SubmitResult) => {
    if (result.ok) {
      setDone({ confirmation: result.confirmation, manageUrl: `${webUrl}/my-request/${result.manageToken}/` });
      writeSession(DRAFT_STORAGE_KEY, null);
      try {
        // A reload shows the cookie-backed confirmation page; the URL carries nothing about the request.
        window.history.replaceState(null, "", "/get-quotes/confirmation/");
      } catch {
        // ignore
      }
      return;
    }
    switch (result.kind) {
      case "invalid": {
        const step = Object.keys(result.errors).map((k) => FIELD_STEPS[k]).find(Boolean);
        if (step) update({ step });
        if (result.errors.limit) {
          setLimit(null);
          setRecount(true);
        }
        showErrors(result.errors);
        if (result.errors.form) setAlert({ tone: "error", title: "We couldn't send your request", body: result.errors.form });
        return;
      }
      case "movers_changed": {
        const fresh = result.coverage;
        setFound((f) => (f ? { ...f, coverage: fresh, consent: result.consent } : f));
        const freshIds = fresh.ok ? fresh.movers.map((m) => m.companyId) : [];
        const keptRemoved = removed.filter((id) => freshIds.includes(id));
        setRemoved(keptRemoved);
        const remaining = freshIds.length - keptRemoved.length;
        if (limit !== null && limit > remaining) {
          setLimit(null);
          setRecount(true);
        }
        setConsentChecked(false);
        setAlert({
          tone: "warning",
          title: "The movers available for your move changed",
          body: "Review the updated availability and contact preferences, then tick the box again if you want to send your request.",
        });
        focusField.current = FIELD_IDS.form!;
        return;
      }
      case "no_coverage":
        setFound((f) => (f && f.coverage.ok ? { ...f, coverage: { ...f.coverage, movers: [] } } : f));
        goTo("found");
        return;
      case "expired":
        runCoverage((state) => {
          setFound(state);
          setConsentChecked(false);
          setAlert({ tone: "warning", title: "We checked coverage again", body: "Your session was open for a long time, so we checked which movers serve your move again. Review your preferences and tick the box again." });
          focusField.current = FIELD_IDS.form!;
        });
        return;
      case "rejected":
        setAlert({
          tone: "error",
          title: "We couldn't send your request",
          body:
            result.reason === "rate_limited"
              ? "Several requests came from your connection in a short time. Wait an hour, then try again."
              : "Wait a moment, then select Send my request again.",
        });
        focusField.current = FIELD_IDS.form!;
        return;
    }
  };

  const submitReview = (event: FormEvent) => {
    event.preventDefault();
    if (!found || !coverage) return;
    const next: FieldErrors = {};
    if (named.length === 0) next.movers = "Check coverage again before sending your request.";
    if (limit === null || limit > named.length) next.limit = "Choose how many moving companies you'd like to hear from.";
    if (!consentChecked) next.consent = "To send your request, tick the box to agree to be contacted by participating moving companies matched to your move.";
    if (!termsAccepted) next.terms = "To send your request, accept the Terms of Use and acknowledge the Privacy Policy.";
    setDeclined(!consentChecked && named.length > 0);
    if (errorCount(next) || !consentText || limit === null) return showErrors(next);
    setErrors({});
    setAlert(null);
    const payload = {
      need: draft.need,
      originZip: draft.originZip,
      destZip: draft.destZip,
      moveDate: draft.moveDate,
      flexible: draft.flexible,
      latestDate: draft.flexible ? draft.latestDate : null,
      moveSize: draft.moveSize,
      services: draft.services,
      channels: contact.channels,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      limit,
      onlyProfileCompany: false,
      shownCompanyIds: movers.map((m) => m.companyId),
      removedCompanyIds: removed,
      profileCompanyId: null,
      consentChecked,
      termsAccepted,
      consentVersionId: found.consent.versionId,
      renderedTextSha256: consentTextSha256(consentText),
      website: honeypot.current?.value ?? "",
      ticket: found.ticket,
      attribution,
    };
    startTransition(async () => {
      try {
        handleResult(await submitRequest(payload));
      } catch {
        setAlert({ tone: "error", title: "We couldn't send your request", body: "Check your connection and try again. Nothing was sent." });
        focusField.current = FIELD_IDS.form!;
      }
    });
  };

  // ---------------------------------------------------------------- ZIP helper line
  const resolveZip = (side: "origin" | "dest", value: string) => {
    const zip = cleanZip(value);
    if (zip.length !== 5) {
      setZipHelp((h) => ({ ...h, [side]: null }));
      return;
    }
    lookupZip(zip)
      .then((found) => setZipHelp((h) => ({ ...h, [side]: found ? `${found.city}, ${found.state}` : "We don't recognize this ZIP code." })))
      .catch(() => undefined);
  };

  // ---------------------------------------------------------------- render
  if (done) {
    return <ConfirmationView confirmation={done.confirmation} manageUrl={done.manageUrl} texts={texts} headingRef={confirmationRef} headingLevel="h2" />;
  }

  const heading = (text: string, sub?: ReactNode) => (
    <div className="grid gap-2">
      <h2 ref={headingRef} tabIndex={-1} className="type-display-l text-text focus:outline-none">
        {text}
      </h2>
      {sub ? <div className="text-text-2">{sub}</div> : null}
    </div>
  );

  const nav = (continueLabel = "Continue", options: { cta?: boolean; hideContinue?: boolean } = {}) => (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {!options.hideContinue ? (
        <Button type="submit" variant={options.cta ? "cta" : "primary"} loading={pending} loadingLabel={options.cta ? "Sending…" : "Checking…"}>
          {continueLabel}
        </Button>
      ) : null}
      {stepIndex > 0 || infoPath ? (
        <Button type="button" variant="secondary" onClick={back} disabled={pending}>
          Back
        </Button>
      ) : null}
    </div>
  );

  const formAlert = alert ? (
    <div id="form-alert" tabIndex={-1} className="focus:outline-none">
      <Alert tone={alert.tone} title={alert.title}>
        {alert.body}
      </Alert>
    </div>
  ) : null;

  let body: ReactNode;
  if (infoPath) {
    body = (
      <div className="grid gap-5">
        {heading(infoPath === "vehicle_only" ? "Vehicle shipping isn't part of our requests" : "Truck rental isn't part of our requests")}
        <p className="text-text">
          {infoPath === "vehicle_only"
            ? "We send requests only to household-goods movers in our network, so we can't send a request to ship a vehicle on its own. No request has been sent and we haven't asked for any contact details."
            : "Movers in our network move your belongings for you; they don't rent trucks through us. No request has been sent and we haven't asked for any contact details."}
        </p>
        <p className="text-text">
          Before you hire any company, you can{" "}
          <Link href="/movers-vs-brokers/" className="link">
            check its federal record
          </Link>
          . If you need movers for your household after all, go back and choose a household move.
        </p>
        {nav("Continue", { hideContinue: true })}
      </div>
    );
  } else {
    switch (draft.step) {
      case "need":
        body = (
          <form noValidate onSubmit={submitNeed} className="grid gap-5">
            {heading("What do you need help with?")}
            <RadioCardGroup
              id="need"
              name="need"
              legend="What do you need help with?"
              hideLegend
              value={draft.need}
              onValueChange={(value) => update({ need: value as Need })}
              error={errors.need}
              options={[
                { value: "household", label: "Moving my home", description: "Movers pack, load, move and unload your belongings." },
                { value: "loading_help", label: "Loading or unloading help only", description: "Movers load or unload a truck or container you arrange." },
                { value: "vehicle_only", label: "Shipping a vehicle only" },
                { value: "truck_rental", label: "Renting a truck" },
              ]}
            />
            {nav()}
          </form>
        );
        break;
      case "where":
        body = (
          <form noValidate onSubmit={submitWhere} className="grid gap-5">
            {heading("Where are you moving?", draft.entry === "household" ? (
              <button type="button" className="link type-small" onClick={() => { update({ entry: "full", step: "need" }); setErrors({}); }}>
                Not a household move?
              </button>
            ) : null)}
            {prefilled ? (
              <Alert tone="info" title="Check the answers we carried over">
                We filled in what you entered on the previous page. Check each answer before you continue.
              </Alert>
            ) : null}
            <Field id="origin-zip" label="ZIP code you're moving from" help={zipHelp.origin ?? "5 digits, for example 75201."} error={errors.originZip} required>
              <Input
                name="originZip"
                inputMode="numeric"
                autoComplete="postal-code"
                value={draft.originZip}
                onChange={(e) => update({ originZip: e.target.value.slice(0, 20) })}
                onBlur={(e) => {
                  const clean = cleanZip(e.target.value);
                  update({ originZip: clean });
                  resolveZip("origin", clean);
                }}
                className="max-w-[12rem] tabular"
              />
            </Field>
            <Field id="dest-zip" label="ZIP code you're moving to" help={zipHelp.dest ?? "5 digits, for example 77002."} error={errors.destZip} required>
              <Input
                name="destZip"
                inputMode="numeric"
                autoComplete="off"
                value={draft.destZip}
                onChange={(e) => update({ destZip: e.target.value.slice(0, 20) })}
                onBlur={(e) => {
                  const clean = cleanZip(e.target.value);
                  update({ destZip: clean });
                  resolveZip("dest", clean);
                }}
                className="max-w-[12rem] tabular"
              />
            </Field>
            {nav()}
          </form>
        );
        break;
      case "when":
        body = (
          <form noValidate onSubmit={submitWhen} className="grid gap-5">
            {heading("When are you moving?", "A date within the next 12 months. Movers use it to plan; it doesn't change which movers serve your move.")}
            <Field id="move-date" label={draft.flexible ? "Earliest date" : "Move date"} error={errors.moveDate} required>
              <Input
                type="date"
                name="moveDate"
                min={today}
                max={today ? addMonths(today, 12) : undefined}
                value={draft.moveDate}
                onChange={(e) => update({ moveDate: e.target.value })}
                className="max-w-[14rem] tabular"
              />
            </Field>
            <Checkbox
              id="flexible"
              label="My dates are flexible"
              checked={draft.flexible}
              onChange={(e) => update({ flexible: e.target.checked })}
            />
            {draft.flexible ? (
              <Field id="latest-date" label="Latest date" error={errors.latestDate} required>
                <Input
                  type="date"
                  name="latestDate"
                  min={draft.moveDate || today}
                  max={today ? addMonths(today, 12) : undefined}
                  value={draft.latestDate}
                  onChange={(e) => update({ latestDate: e.target.value })}
                  className="max-w-[14rem] tabular"
                />
              </Field>
            ) : null}
            {nav()}
          </form>
        );
        break;
      case "size":
        body = (
          <form noValidate onSubmit={submitSize} className="grid gap-6">
            {heading("How big is your move?")}
            {formAlert}
            <RadioCardGroup
              id="move-size"
              name="moveSize"
              legend="Size of your move"
              columns={2}
              value={draft.moveSize || null}
              onValueChange={(value) => update({ moveSize: value })}
              error={errors.moveSize}
              options={SURVEY_MOVE_SIZES.map((size) => ({ value: size, label: MOVE_SIZE_LABELS[size] }))}
            />
            <fieldset id="services" className="m-0 grid gap-1 border-0 p-0" aria-describedby={errors.services ? errorId("services") : "services-help"}>
              <legend className="mb-1 p-0 text-[0.9375rem] font-semibold text-text">Services you need (optional)</legend>
              <p id="services-help" className="type-small text-text-3">
                Choose any that apply. Only movers that offer every service you choose are matched.
              </p>
              {SURVEY_SERVICES.filter((s) => s !== "labor_only" || draft.need === "loading_help").map((service) => (
                <Checkbox
                  key={service}
                  id={`service-${service}`}
                  label={SERVICE_LABELS[service]}
                  checked={draft.services.includes(service)}
                  onChange={(e) =>
                    update({ services: e.target.checked ? [...draft.services, service] : draft.services.filter((s) => s !== service) })
                  }
                />
              ))}
              {errors.services ? <FieldError id={errorId("services")}>{errors.services}</FieldError> : null}
            </fieldset>
            {nav("Check which movers serve my move")}
          </form>
        );
        break;
      case "found":
        body = <FoundStep heading={heading} coverage={coverage} onContinue={() => goTo("details")} nav={nav} />;
        break;
      case "details":
        body = (
          <form noValidate onSubmit={submitDetails} className="grid gap-6">
            {heading("Your details")}
            <section aria-labelledby="why-heading" className="grid gap-2 rounded-card border border-border bg-surface-2 p-5">
              <h3 id="why-heading" className="type-h4 text-text">
                Why we ask for your contact details
              </h3>
              {/* Consent draft §3 without its "We don't sell your details" sentence, which waits on counsel (implications §3.7). */}
              <p className="text-text">
                To prepare a quote, movers need to reach you to confirm details like access, stairs and inventory. You'll choose how many movers may
                receive your details and which methods they may use. Each company introduces itself when it contacts you.
              </p>
            </section>
            <fieldset id="channels" className="m-0 grid gap-1 border-0 p-0" aria-describedby={["channels-help", errors.channels ? errorId("channels") : null].filter(Boolean).join(" ")}>
              <legend className="mb-1 p-0 text-[0.9375rem] font-semibold text-text">How may movers contact you?</legend>
              <p id="channels-help" className="type-small text-text-3">
                Choose at least one. Movers see your choice, and our terms require them to keep to it.
              </p>
              {CHANNELS.map((channel) => (
                <Checkbox
                  key={channel}
                  id={`channel-${channel}`}
                  label={CHANNEL_LABELS[channel]}
                  checked={contact.channels.includes(channel)}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, channels: e.target.checked ? [...c.channels, channel] : c.channels.filter((x) => x !== channel) }))
                  }
                  {...(errors.channels ? { "aria-invalid": true } : {})}
                />
              ))}
              {errors.channels ? <FieldError id={errorId("channels")}>{errors.channels}</FieldError> : null}
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field floating id="first-name" label="First name" error={errors.firstName} required>
                <Input name="firstName" autoComplete="given-name" value={contact.firstName} onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))} />
              </Field>
              <Field floating id="last-name" label="Last name" error={errors.lastName} required>
                <Input name="lastName" autoComplete="family-name" value={contact.lastName} onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))} />
              </Field>
            </div>
            <Field floating id="email" label="Email" error={errors.email} required>
              <Input type="email" name="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
            </Field>
            <Field id="phone" label="Phone number" help="A US number. We send it only to movers that buy your request." error={errors.phone} required>
              <Input type="tel" name="phone" autoComplete="tel-national" inputMode="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className="max-w-[16rem] tabular" />
            </Field>
            {nav()}
          </form>
        );
        break;
      case "count": {
        const options = countOptions(named.length, maxLimit);
        body = (
          <form noValidate onSubmit={submitCount} className="grid gap-5">
            {heading("How many movers")}
            <CountQuestion
              options={options}
              value={limit === null ? null : String(limit)}
              onChange={chooseCount}
              error={errors.limit}
              helper={texts.st4a}
              available={named.length}
            />
            {nav()}
          </form>
        );
        break;
      }
      case "review":
        body = (
          <form noValidate onSubmit={submitReview} className="grid gap-6">
            {heading("Review and send")}
            {formAlert}
            <RequestSummary draft={draft} coverage={coverage} contact={contact} onEdit={goTo} />

            <section aria-labelledby="contact-plan-heading" className="grid gap-3 rounded-card border border-border bg-surface p-5">
              <h3 id="contact-plan-heading" className="type-h3 text-text">Your contact preferences</h3>
              <p className="text-text-2">Participating moving companies that serve your move may contact you using only the methods you choose. Each company will introduce itself when it gets in touch.</p>
              {errors.movers ? <FieldError id={errorId("movers")}>{errors.movers}</FieldError> : null}
            </section>

            {recount || limit === null ? (
              <div className="grid gap-3 rounded-card border-[1.5px] border-warning p-5">
                <p className="font-semibold text-text">
                  {named.length > 0
                    ? `${named.length} ${named.length === 1 ? "mover is" : "movers are"} available, so choose again.`
                    : "Check coverage again, then choose how many movers you'd like to hear from."}
                </p>
                {named.length > 0 ? (
                  <CountQuestion
                    options={countOptions(named.length, maxLimit)}
                    value={limit === null ? null : String(limit)}
                    onChange={chooseCount}
                    error={errors.limit}
                    helper={texts.st4a}
                    available={named.length}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-text">
                <strong className="tabular">
                  {limit === 1 ? "Only 1 mover" : `Up to ${limit} movers`}
                </strong>{" "}
                may receive your details and contact you.{" "}
                <button type="button" className="link" onClick={() => goTo("count")}>
                  Change the number
                </button>
              </p>
            )}

            <div className="grid gap-3 rounded-card bg-surface-2 p-5 type-small text-text-2">
              <p>{texts.st1a}</p>
              <p>
                <StoredTextLine parts={texts.st2} />
              </p>
              <p>{texts.st4b}</p>
            </div>

            {/* Honeypot: hidden from people and assistive technology; bots that fill it are refused. */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label htmlFor="website">Leave this field empty</label>
              <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <div className="grid gap-1">
              <Checkbox
                id="consent"
                name="consent"
                checked={consentChecked}
                disabled={!consentText}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked) setDeclined(false);
                }}
                error={errors.consent}
                label={<span className="whitespace-pre-line">{consentText ?? "Choose how many movers you'd like to hear from to see what you're agreeing to."}</span>}
              />
              <Checkbox
                id="terms"
                name="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                error={errors.terms}
                label={
                  <span>
                    I agree to the{" "}
                    <Link href="/terms/" className="link" target="_blank" rel="noopener">
                      Terms of Use
                    </Link>{" "}
                    and acknowledge the{" "}
                    <Link href="/privacy/" className="link" target="_blank" rel="noopener">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                }
              />
            </div>

            {declined ? (
              <Alert tone="info" title="Your request has not been sent">
                Contact permission is optional. Leave the box unticked and no request or contact details will be shared. You can go back to edit your contact preferences or leave this page.
              </Alert>
            ) : null}

            {nav("Send my request", { cta: true })}
          </form>
        );
        break;
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-12">
      <div className="grid content-start gap-6">
        <details className="rounded-card border border-border bg-surface p-4 lg:hidden">
          <summary className="cursor-pointer font-semibold text-text">Your move{summaryLine(draft, coverage) ? `: ${summaryLine(draft, coverage)}` : ""}</summary>
          <div className="mt-3">
            <MoveSidebar draft={draft} coverage={coverage} texts={texts} />
          </div>
        </details>
        <Stepper current={stepIndex + 1} total={steps.length} label={infoPath ? STEP_LABELS.need : STEP_LABELS[draft.step]} />
        {draft.step !== "size" && draft.step !== "review" ? formAlert : null}
        {body}
        <p aria-live="polite" role="status" className="sr-only">
          {announcement}
        </p>
      </div>
      <aside aria-label="Your move" className="hidden lg:block">
        <div className="sticky top-6 rounded-card border border-border bg-surface p-6 shadow-e1">
          <h2 className="mb-3 type-h4 text-text">Your move</h2>
          <MoveSidebar draft={draft} coverage={coverage} texts={texts} />
        </div>
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------ pieces

function summaryLine(draft: Draft, coverage: Coverage | null): string {
  const route = coverage
    ? `${coverage.move.origin.city} → ${coverage.move.destination.city}`
    : draft.originZip && draft.destZip
      ? `${draft.originZip} → ${draft.destZip}`
      : "";
  const date = draft.moveDate ? formatAbsoluteDate(draft.moveDate) : "";
  return [route, date].filter(Boolean).join(" · ");
}

function MoveSidebar({ draft, coverage, texts }: { draft: Draft; coverage: Coverage | null; texts: SurveyTexts }) {
  const rows: [string, string][] = [];
  if (coverage) {
    rows.push(["From", `${coverage.move.origin.city}, ${coverage.move.origin.state}`], ["To", `${coverage.move.destination.city}, ${coverage.move.destination.state}`]);
  } else {
    if (draft.originZip) rows.push(["From", draft.originZip]);
    if (draft.destZip) rows.push(["To", draft.destZip]);
  }
  if (draft.moveDate) rows.push(["When", `${draft.flexible ? "From " : ""}${formatAbsoluteDate(draft.moveDate, { month: "long" })}`]);
  if (isSurveyMoveSize(draft.moveSize)) rows.push(["Size", MOVE_SIZE_LABELS[draft.moveSize]]);
  if (draft.services.length) rows.push(["Services", draft.services.map((s) => SERVICE_LABELS[s]).join(", ")]);
  return (
    <div className="grid gap-4">
      {rows.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 type-small">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold text-text">{k}</dt>
              <dd className="tabular text-text-2">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="type-small text-text-2">Your answers appear here as you go.</p>
      )}
      <ul className="grid gap-2 border-t border-border pt-4 type-small text-text-2">
        <li>
          <strong className="text-text">Movers only, no brokers.</strong>{" "}
          <Link href="/how-we-verify-movers/" className="link">
            How we verify movers
          </Link>
        </li>
        <li>
          <strong className="text-text">You choose how many companies</strong> can receive your details. Companies introduce themselves when they contact you.{" "}
          <Link href="/which-companies-receive-my-request/" className="link">
            Which companies receive my request
          </Link>
        </li>
      </ul>
    </div>
  );
}

function FoundStep({
  heading,
  coverage,
  onContinue,
  nav,
}: {
  heading: (text: string, sub?: ReactNode) => ReactNode;
  coverage: Coverage | null;
  onContinue: () => void;
  nav: (label?: string, options?: { cta?: boolean; hideContinue?: boolean }) => ReactNode;
}) {
  const movers = coverage?.movers ?? [];
  if (!coverage || movers.length === 0) {
    // No coverage: the flow ends here, with honest next steps and no contact fields (lead lifecycle §2 step 5).
    return (
      <form noValidate onSubmit={(e) => e.preventDefault()} className="grid gap-5">
        {heading("No mover in our network serves this move yet")}
        <p className="text-text">
          {coverage
            ? `We checked every mover in our network for a move from ${coverage.move.origin.city}, ${coverage.move.origin.state} to ${coverage.move.destination.city}, ${coverage.move.destination.state} with the size and services you chose. None serves it today.`
            : "We couldn't find a mover in our network for this move."}{" "}
          We haven't asked for or shared any contact details, and no request was sent.
        </p>
        <section aria-labelledby="next-steps" className="grid gap-2">
          <h3 id="next-steps" className="type-h4 text-text">
            What you can do
          </h3>
          <ul className="grid list-disc gap-1.5 pl-6 text-text">
            <li>Go back and change your answers. Removing a service can bring in movers that don't offer it.</li>
            <li>
              Before you hire any mover, check its federal registration and complaint history on the{" "}
              <a href="https://safer.fmcsa.dot.gov/CompanySnapshot.aspx" className="link" target="_blank" rel="noopener noreferrer">
                FMCSA company snapshot<span className="sr-only"> (opens in a new tab)</span>
              </a>
              . Our guide to{" "}
              <Link href="/movers-vs-brokers/" className="link">
                movers and brokers
              </Link>{" "}
              explains what to look for.
            </li>
            <li>
              See{" "}
              <Link href="/how-we-verify-movers/" className="link">
                how we verify movers
              </Link>{" "}
              before they can join our network.
            </li>
          </ul>
        </section>
        {nav("Continue", { hideContinue: true })}
      </form>
    );
  }
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); onContinue(); }} className="grid gap-5">
      {heading(
        movers.length === 1 ? "1 mover in our network serves your move" : `${movers.length} movers in our network serve your move`,
        `From ${coverage.move.origin.city}, ${coverage.move.origin.state} to ${coverage.move.destination.city}, ${coverage.move.destination.state}, with the size and services you chose. Availability does not reserve a moving date.`,
      )}
      <div className="rounded-card border border-border bg-surface-2 p-5">
        <p className="font-semibold text-text">Your next step: choose how to hear from movers.</p>
        <p className="mt-2 text-text-2">You choose how many participating companies may contact you and which contact methods they can use. Each company identifies itself when it gets in touch.</p>
      </div>
      {nav()}
    </form>
  );
}

function CountQuestion({
  options,
  value,
  onChange,
  error,
  helper,
  available,
}: {
  options: ReturnType<typeof countOptions>;
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  helper: string;
  available: number;
}) {
  return (
    <div className="grid gap-3">
      <RadioCardGroup
        id="limit"
        name="limit"
        legend="How many moving companies would you like to hear from?"
        help={helper}
        value={value}
        onValueChange={onChange}
        error={error}
        columns={1}
        options={[
          ...options.map((o) => ({
            value: String(o.value),
            label: <span className="tabular">{o.value}</span>,
            disabled: !o.enabled,
            ...(o.reason ? { disabledReason: o.reason } : {}),
          })),

        ]}
      />
      <p className="type-small text-text-2 tabular">
        {available === 1 ? "1 mover in our network serves your move." : `${available} movers in our network serve your move.`}
      </p>
    </div>
  );
}

function RequestSummary({
  draft,
  coverage,
  contact,
  onEdit,
}: {
  draft: Draft;
  coverage: Coverage | null;
  contact: Contact;
  onEdit: (step: SurveyStep) => void;
}) {
  const rows: { label: string; value: string; step: SurveyStep }[] = [
    {
      label: "Route",
      value: coverage
        ? `${coverage.move.origin.city}, ${coverage.move.origin.state} to ${coverage.move.destination.city}, ${coverage.move.destination.state}`
        : `${draft.originZip} to ${draft.destZip}`,
      step: "where",
    },
    {
      label: "Date",
      value: draft.moveDate
        ? draft.flexible && draft.latestDate
          ? `${formatAbsoluteDate(draft.moveDate, { month: "long" })} to ${formatAbsoluteDate(draft.latestDate, { month: "long" })}`
          : formatAbsoluteDate(draft.moveDate, { month: "long" })
        : "",
      step: "when",
    },
    {
      label: "Size and services",
      value: [isSurveyMoveSize(draft.moveSize) ? MOVE_SIZE_LABELS[draft.moveSize] : "", ...draft.services.map((s) => SERVICE_LABELS[s])].filter(Boolean).join(", "),
      step: "size",
    },
    { label: "Contact by", value: contact.channels.map((c) => CHANNEL_LABELS[c]).join(", "), step: "details" },
    { label: "Your details", value: `${contact.firstName} ${contact.lastName} · ${contact.email} · ${contact.phone}`, step: "details" },
  ];
  return (
    <section aria-labelledby="summary-heading" className="grid gap-2">
      <h3 id="summary-heading" className="type-h3 text-text">
        Your request
      </h3>
      <dl className="grid gap-0 rounded-card border border-border">
        {rows.map((row) => (
          <div key={row.label} className={cx("grid gap-1 border-t border-border px-4 py-3 first:border-t-0")}>
            <dt className="type-small font-semibold text-text">{row.label}</dt>
            <dd className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="tabular min-w-0 break-words text-text-2">{row.value}</span>
              <button type="button" className="link type-small" onClick={() => onEdit(row.step)}>
                Change<span className="sr-only"> {row.label.toLowerCase()}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
