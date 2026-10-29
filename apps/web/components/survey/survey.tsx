"use client";

/**
 * The quote survey island (build plan §7.2; implications §2.1–§2.5, §3.1–§3.3; VD §9.2, §9.3,
 * §13.7). Household journey: route, date, services, contact details and company limit, review.
 * Starter answers continue into this same five-step journey without being asked again.
 *
 * - Move answers and company limits are not preselected; native inputs remain editable.
 * - Move details persist in sessionStorage so back navigation and reloads keep them; contact
 *   details are never stored client-side (VD §9.3).
 * - Eligibility stays internal; it never blocks a valid request. Permission is given by Send.
 * - No ZIP code, date, size or contact detail goes into a URL or any analytics; this page loads no
 *   third-party script (site architecture §8.8).
 */
import {
  COMPACT_SURVEY_STEPS,
  REQUEST_SUBMIT_CHANNELS,
  isSubmitButtonConsent,
  DRAFT_STORAGE_KEY,
  MOVE_SIZE_LABELS,
  PREFILL_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  SERVICE_LABELS,
  STEP_LABELS,
  SURVEY_MOVE_SIZES,
  SURVEY_SERVICES,
  addMonths,
  cleanZip,
  consentTextSha256,
  countOptions,
  requestCountOptions,
  isRequestCount,
  isRequestIntakeConsent,
  isSurveyMoveSize,
  parseDetails,
  parseNeed,
  parseSize,
  parseWhen,
  parseWhere,
  renderConsentText,
  type Channel,
  type FieldErrors,
  type Need,
  type SurveyStep,
} from "@amc/core/src/survey";
import type { SubmitResult, SurveyCoverageResult } from "@amc/server/leads";
import { Alert, Button, Checkbox, Field, FieldError, Input, RadioCardGroup, Stepper, cx, errorId, formatAbsoluteDate } from "@amc/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { ConfirmationView, type ConfirmationData } from "./confirmation-view";
import { EMPTY_DRAFT, restoreSurveyDraft, type SurveyDraft as Draft } from "./draft";
import { StoredTextLine, type SurveyTexts } from "./texts";

type FoundState = Extract<SurveyCoverageResult, { ok: true }>;
type Coverage = Extract<FoundState["coverage"], { ok: true }>;
type Mover = Coverage["movers"][number];

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

const EMPTY_CONTACT: Contact = { channels: [...REQUEST_SUBMIT_CHANNELS], firstName: "", lastName: "", email: "", phone: "" };

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
  limit: "details",
};

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

/** Apply one-shot carried answers once, then persist the continuation before exposing controls. */
function initialDraft(): { draft: Draft; prefilled: boolean } {
  const stored = readSession<Partial<Draft>>(DRAFT_STORAGE_KEY);
  const prefill = readSession<Record<string, unknown>>(PREFILL_STORAGE_KEY, true);
  const profile = readSession<Record<string, unknown>>(PROFILE_STORAGE_KEY, true);
  const params = new URLSearchParams(window.location.search);
  const restored = restoreSurveyDraft({ stored, prefill, householdEntry: Boolean(profile) || params.get("entry") === "household", today: localToday() });
  writeSession(DRAFT_STORAGE_KEY, restored.draft);
  return restored;
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
  const draftRef = useRef(initial);
  const [editingSize, setEditingSize] = useState(false);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [found, setFound] = useState<FoundState | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
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

  const steps = useMemo<SurveyStep[]>(() => (draft.entry === "household" ? COMPACT_SURVEY_STEPS.filter((s) => s !== "need") : [...COMPACT_SURVEY_STEPS]), [draft.entry]);
  const stepIndex = Math.max(0, steps.indexOf(draft.step));

  // Focus the step heading and announce the step on every change (VD §9.3), except on first load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (done) {
      confirmationRef.current?.focus();
      setAnnouncement("Request received.");
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

  // Persist each checkpoint synchronously, before a route remount or browser Back can occur.
  // This ref also composes multiple patches in one event without stale closure values.
  const update = useCallback((patch: Partial<Draft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    writeSession(DRAFT_STORAGE_KEY, next);
    setDraft(next);
  }, []);

  const goTo = useCallback(
    (step: SurveyStep) => {
      setErrors({});
      setAlert(null);
      update({ step: step === "found" || step === "count" ? "details" : step });
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
  const requestIntake = isRequestIntakeConsent(found?.consent.body ?? "");
  const submitButtonConsent = isSubmitButtonConsent(found?.consent.body ?? "");
  const validLimit = (value: number | null) => value !== null && (requestIntake ? isRequestCount(value, maxLimit) : value >= 1 && value <= Math.min(named.length, maxLimit));
  const contactOptions = requestIntake ? requestCountOptions(maxLimit) : countOptions(named.length, maxLimit);
  const consentText =
    found && limit !== null && validLimit(limit) && contact.channels.length > 0
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
    goTo(draft.starterComplete && parseWhen(draft, today).ok ? "size" : "when");
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
        setAlert({ tone: "error", title: "We couldn't continue", body: "Check your connection and try again." });
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
      setConsentChecked(false);
      goTo("details");
    });
  };

  const submitDetails = (event: FormEvent) => {
    event.preventDefault();
    const result = parseDetails(contact);
    if (!result.ok) return showErrors(result.errors);
    if (!validLimit(limit)) return showErrors({ limit: "Choose how many moving companies you would like to hear from." });
    goTo("review");
  };

  const chooseCount = (value: string) => {
    setErrors({});
    setRemoved([]);
    setLimit(Number(value));
    setConsentChecked(false);
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
        if (limit !== null && (isRequestIntakeConsent(result.consent.body) ? !isRequestCount(limit, maxLimit) : limit > remaining)) {
          setLimit(null);
          update({ step: "details" });
        }
        setConsentChecked(false);
        setAlert({
          tone: "warning",
          title: "Review your contact preferences",
          body: "Review your request details and select Send my request.",
        });
        focusField.current = FIELD_IDS.form!;
        return;
      }
      case "no_coverage":
        setFound((f) => (f && f.coverage.ok ? { ...f, coverage: { ...f.coverage, movers: [] } } : f));
        goTo("details");
        return;
      case "expired":
        runCoverage((state) => {
          setFound(state);
          setConsentChecked(false);
          setAlert({ tone: "warning", title: "Review your request details", body: "Your session has been open for a while. Review your details and select Send my request." });
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
    if (!requestIntake && named.length === 0) next.movers = "Refresh your request details before sending.";
    if (!validLimit(limit)) next.limit = "Choose how many moving companies you'd like to hear from.";
    if (!submitButtonConsent && !consentChecked) next.consent = "To send your request, tick the box to confirm your contact permissions.";
    if (!submitButtonConsent && !termsAccepted) next.terms = "To send your request, accept the Terms of Use and acknowledge the Privacy Policy.";
    setDeclined(!submitButtonConsent && !consentChecked);
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
      authorizationMethod: submitButtonConsent ? "submit_button" : "checkbox",
      consentChecked: submitButtonConsent ? false : consentChecked,
      termsAccepted: submitButtonConsent ? true : termsAccepted,
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
        <Button type="submit" variant={options.cta ? "cta" : "primary"} disabled={Boolean(options.cta && !consentText)} aria-describedby={options.cta && submitButtonConsent ? "submit-notice" : undefined} loading={pending} loadingLabel={options.cta ? "Sending…" : "Checking…"}>
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
              <button type="button" className="link type-small" onClick={() => { update({ entry: "full", step: "need", need: null, starterComplete: false }); setErrors({}); }}>
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
            {heading(draft.starterComplete ? "Anything else for your move?" : "How big is your move?", draft.starterComplete ? "Your route, estimated date and home size are saved. Add any services you need, or continue without extras." : undefined)}
            {formAlert}
            {draft.starterComplete ? <section className="grid min-w-0 gap-3 rounded-card border border-border bg-surface-2 p-4" data-content-inset="card" aria-labelledby="saved-move-heading">
              <h3 id="saved-move-heading" className="text-lg font-bold leading-[1.45] text-text">Your saved move</h3>
              <dl className="grid min-w-0 gap-2 type-small">
                <div><dt className="font-semibold text-text">Route</dt><dd className="text-text-2 tabular">{draft.originZip} → {draft.destZip}</dd></div>
                <div><dt className="font-semibold text-text">Estimated move date</dt><dd className="text-text-2">{formatAbsoluteDate(draft.moveDate)}</dd></div>
                <div><dt className="font-semibold text-text">Home size</dt><dd className="text-text-2">{isSurveyMoveSize(draft.moveSize) ? MOVE_SIZE_LABELS[draft.moveSize] : draft.moveSize}</dd></div>
              </dl>
              <div className="flex min-w-0 flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => goTo("where")}>Edit route</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => goTo("when")}>Edit date</Button>
                <Button type="button" variant="secondary" size="sm" aria-expanded={editingSize} onClick={() => setEditingSize(value => !value)}>Edit home size</Button>
              </div>
            </section> : null}
            {!draft.starterComplete || editingSize ? <RadioCardGroup
              id="move-size"
              name="moveSize"
              legend="Size of your move"
              columns={2}
              value={draft.moveSize || null}
              onValueChange={(value) => update({ moveSize: value })}
              error={errors.moveSize}
              options={SURVEY_MOVE_SIZES.map((size) => ({ value: size, label: MOVE_SIZE_LABELS[size] }))}
            /> : null}
            <fieldset id="services" className="m-0 grid gap-1 border-0 p-0" aria-describedby={errors.services ? errorId("services") : "services-help"}>
              <legend className="mb-1 p-0 text-[0.9375rem] font-semibold text-text">Services you need (optional)</legend>
              <p id="services-help" className="type-small text-text-3">
                Choose any that apply so your request includes the help you need.
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
            {nav("Continue")}
          </form>
        );
        break;
      case "details":
        body = (
          <form noValidate onSubmit={submitDetails} className="grid gap-5">
            {heading("Your details", "Where should we follow up about your move?")}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field floating id="first-name" label="First name" error={errors.firstName} required>
                <Input name="firstName" autoComplete="given-name" value={contact.firstName} onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))} />
              </Field>
              <Field floating id="last-name" label="Last name" error={errors.lastName} required>
                <Input name="lastName" autoComplete="family-name" value={contact.lastName} onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))} />
              </Field>
              <Field floating id="email" label="Email" error={errors.email} required>
                <Input type="email" name="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
              </Field>
              <Field floating id="phone" label="Phone number" error={errors.phone} required>
                <Input type="tel" name="phone" autoComplete="tel-national" inputMode="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
              </Field>
            </div>
            <CountQuestion options={contactOptions} value={limit === null ? null : String(limit)} onChange={chooseCount} error={errors.limit} helper="Choose the maximum number of companies you would like to hear from." />
            {nav("Review my request")}
          </form>
        );
        break;
      case "review":
        body = (
          <form noValidate onSubmit={submitReview} className="grid gap-6">
            {heading("Review and send")}
            {formAlert}
            <RequestSummary draft={draft} coverage={coverage} contact={contact} onEdit={goTo} />

            {limit !== null ? (
              <p className="type-small text-text-2">
                <strong className="text-text">{limit === 1 ? "1 moving company" : `Up to ${limit} moving companies`}</strong> may contact you.{" "}
                <button type="button" className="link" onClick={() => goTo("details")}>Change the number</button>
              </p>
            ) : null}

            {/* Honeypot: hidden from people and assistive technology; bots that fill it are refused. */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label htmlFor="website">Leave this field empty</label>
              <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            {submitButtonConsent ? (
              <SubmitNotice text={consentText} />
            ) : (
              <>
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

              </>
            )}

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
        <Stepper current={stepIndex + 1} total={steps.length} label={infoPath ? STEP_LABELS.need : draft.starterComplete && draft.step === "size" ? "Services" : STEP_LABELS[draft.step]} />
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

function SubmitNotice({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p id="submit-notice" data-authorization-method="submit_button" className="text-[0.8125rem] leading-relaxed text-text-2">
      {text.split(/(Terms of Use|Privacy Policy)/).map((part, index) => part === "Terms of Use" || part === "Privacy Policy" ? (
        <Link key={index} href={part === "Terms of Use" ? "/terms/" : "/privacy/"} className="link" target="_blank" rel="noopener">{part}</Link>
      ) : part)}
    </p>
  );
}


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

function CountQuestion({
  options,
  value,
  onChange,
  error,
  helper,
}: {
  options: ReturnType<typeof countOptions>;
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  helper: string;
}) {
  return (
    <fieldset id="limit" className="m-0 grid min-w-0 gap-2.5 border-0 p-0" aria-describedby={error ? errorId("limit") : "limit-help"}>
      <legend className="mb-2 text-[0.9375rem] font-semibold text-text">How many moving companies would you like to hear from?</legend>
      <p id="limit-help" className="type-small text-text-3">{helper}</p>
      <div className="grid grid-cols-3 gap-2 min-[360px]:grid-cols-5">
        {options.map(option => (
          <label key={option.value} htmlFor={`limit-${option.value}`} className="relative min-w-0 cursor-pointer">
            <input id={`limit-${option.value}`} name="limit" type="radio" value={option.value} disabled={!option.enabled} checked={value === String(option.value)} onChange={() => onChange(String(option.value))} aria-describedby={error ? errorId("limit") : "limit-help"} aria-invalid={error ? true : undefined} className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0" />
            <span data-content-inset="compact" className="pointer-events-none relative flex min-h-12 items-center justify-center rounded-control border-[1.5px] border-border-strong bg-surface font-semibold tabular text-text peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:bg-surface-3 peer-disabled:text-text-3">
              {option.value}
              {value === String(option.value) ? <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="absolute right-1 top-1 size-2.5"><path d="m2 6 2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? <FieldError id={errorId("limit")}>{error}</FieldError> : null}
    </fieldset>
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
