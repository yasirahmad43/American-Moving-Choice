"use client";

/**
 * Coverage editor (lead lifecycle §3): include and exclude rules with pickup and destination
 * location sets (states, counties of a state, ZIP lists), move types, sizes and services; pause
 * and resume; the capability ceiling; and a "test a move" tool that runs the matcher. Everything
 * is validated again on the server.
 */
import { Alert, Badge, Button, Card, Dialog, Field, Input, Select, StatusPill, Textarea, cx } from "@amc/ui";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  countiesAction,
  deleteRuleAction,
  saveCapabilitiesAction,
  saveRuleAction,
  setPausedAction,
  testMoveAction,
} from "@/app/(portal)/portal/coverage/actions";
import { ChoiceGroup } from "./choice-group";

export interface LocationSetValue {
  states: string[];
  counties: string[];
  zips: string[];
}

export interface RuleValue {
  kind: "include" | "exclude";
  label: string | null;
  origin: LocationSetValue;
  destination: LocationSetValue;
  moveTypes: string[];
  moveSizes: string[];
  services: string[];
  paused: boolean;
}

export interface StoredRuleValue extends RuleValue {
  id: string;
  updatedAt: string;
}

export interface Labeled {
  value: string;
  label: string;
}

export interface CoverageEditorProps {
  rules: StoredRuleValue[];
  capabilities: { moveTypes: string[]; moveSizes: string[]; services: string[] };
  coverageVersion: number;
  options: { states: Labeled[]; moveTypes: Labeled[]; moveSizes: Labeled[]; services: Labeled[] };
  /** Names of the counties the rules use, by FIPS code. */
  countyNames: Record<string, string>;
  limits: { zipsPerSide: number; countiesPerSide: number; rulesPerCompany: number };
}

const emptySet = (): LocationSetValue => ({ states: [], counties: [], zips: [] });
const emptyRule = (): RuleValue => ({ kind: "include", label: "", origin: emptySet(), destination: emptySet(), moveTypes: [], moveSizes: [], services: [], paused: false });
const isEmpty = (s: LocationSetValue) => !s.states.length && !s.counties.length && !s.zips.length;

function labelsOf(values: string[], options: Labeled[]) {
  return values.map((v) => options.find((o) => o.value === v)?.label ?? v);
}

function describeSet(set: LocationSetValue, countyNames: Record<string, string>): string {
  const parts: string[] = [];
  if (set.states.length) parts.push(set.states.length > 8 ? `${set.states.length} states` : set.states.join(", "));
  if (set.counties.length) parts.push(set.counties.length > 3 ? `${set.counties.length} counties` : set.counties.map((c) => countyNames[c] ?? c).join(", "));
  if (set.zips.length) parts.push(set.zips.length > 5 ? `${set.zips.length} ZIP codes` : `ZIP ${set.zips.join(", ")}`);
  return parts.join("; ");
}

/** Cleans a pasted ZIP list: 5-digit codes kept (02108-1234 → 02108), anything else reported. */
function parseZips(text: string): { zips: string[]; invalid: string[] } {
  const zips: string[] = [];
  const invalid: string[] = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    const m = /^(\d{5})(-\d{4})?$/.exec(token);
    if (m) zips.push(m[1]!);
    else invalid.push(token);
  }
  return { zips: [...new Set(zips)], invalid };
}

// ------------------------------------------------------------------ capability ceiling

function CapabilitiesCard({ capabilities, options }: Pick<CoverageEditorProps, "capabilities" | "options">) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const save = (formData: FormData) => {
    const input = {
      moveTypes: formData.getAll("cap-moveTypes").map(String),
      moveSizes: formData.getAll("cap-moveSizes").map(String),
      services: formData.getAll("cap-services").map(String),
    };
    start(async () => {
      const result = await saveCapabilitiesAction(input);
      if (result.ok) {
        setErrors({});
        setMessage({ tone: "success", text: "Saved what you offer. Coverage changes apply to future requests only." });
      } else {
        setErrors(result.fieldErrors);
        setMessage({ tone: "error", text: result.errors?.[0] ?? "Check the highlighted choices." });
      }
      messageRef.current?.focus();
    });
  };

  return (
    <Card title="What you offer" titleAs="h2" description="The ceiling for every rule: you only receive requests for these move types, sizes and services, whatever your rules say.">
      <form ref={formRef} action={save} className="grid gap-5" noValidate>
        <div ref={messageRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
          {message ? (
            <Alert tone={message.tone} role="none">
              {message.text}
            </Alert>
          ) : null}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <ChoiceGroup name="cap-moveTypes" idPrefix="cap-moveTypes" legend="Move types" options={options.moveTypes} selected={capabilities.moveTypes} error={errors.moveTypes} />
          <ChoiceGroup name="cap-moveSizes" idPrefix="cap-moveSizes" legend="Move sizes" options={options.moveSizes} selected={capabilities.moveSizes} error={errors.moveSizes} />
          <ChoiceGroup name="cap-services" idPrefix="cap-services" legend="Services" options={options.services} selected={capabilities.services} error={errors.services} />
        </div>
        <div>
          <Button type="submit" variant="secondary" loading={pending}>
            Save what you offer
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------------ location set

function LocationSetEditor({
  side,
  value,
  onChange,
  options,
  countyNames,
  onCountyNames,
  limits,
}: {
  side: "origin" | "destination";
  value: LocationSetValue;
  onChange: (next: LocationSetValue) => void;
  options: Labeled[];
  countyNames: Record<string, string>;
  onCountyNames: (names: Record<string, string>) => void;
  limits: CoverageEditorProps["limits"];
}) {
  const id = useId();
  const title = side === "origin" ? "Pickup area" : "Destination area";
  const [countyState, setCountyState] = useState("");
  const [counties, setCounties] = useState<{ fips: string; name: string }[]>([]);
  const [countyFilter, setCountyFilter] = useState("");
  const [loading, start] = useTransition();
  const [zipText, setZipText] = useState(value.zips.join(", "));
  const zipParse = parseZips(zipText);

  useEffect(() => {
    if (!countyState) {
      setCounties([]);
      return;
    }
    start(async () => {
      const list = await countiesAction(countyState);
      setCounties(list);
      onCountyNames(Object.fromEntries(list.map((c) => [c.fips, `${c.name}, ${countyState}`])));
    });
    // onCountyNames is stable enough for this purpose; only the state choice triggers a load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countyState]);

  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((v) => v !== item) : [...list, item]);
  const filtered = counties.filter((c) => c.name.toLowerCase().includes(countyFilter.trim().toLowerCase()));

  return (
    <fieldset className="grid gap-4 rounded-control border border-border p-4">
      <legend className="px-1 font-semibold text-text">{title}</legend>
      <p className="type-small text-text-2">
        {side === "origin" ? "Where moves start." : "Where moves end."} Any one listed state, county or ZIP code matches. Leave all empty for anywhere.
      </p>

      <details className="rounded-control border border-border">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 font-semibold text-text">
          States ({value.states.length} chosen)
        </summary>
        <div className="grid gap-x-4 p-3 sm:grid-cols-3 lg:grid-cols-4">
          {options.map((s) => {
            const inputId = `${id}-state-${s.value}`;
            return (
              <label key={s.value} htmlFor={inputId} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={value.states.includes(s.value)}
                  onChange={() => onChange({ ...value, states: toggle(value.states, s.value).sort() })}
                />
                <span>{s.label}</span>
              </label>
            );
          })}
        </div>
      </details>

      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${id}-county-state`} label="Add counties from" help="Choose a state to list its counties.">
            <Select value={countyState} onChange={(e) => setCountyState(e.target.value)}>
              <option value="">Choose a state</option>
              {options.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {counties.length ? (
            <Field id={`${id}-county-filter`} label="Filter counties">
              <Input value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} autoComplete="off" />
            </Field>
          ) : null}
        </div>
        {loading ? <p className="type-small text-text-2" role="status">Loading counties…</p> : null}
        {counties.length ? (
          <div className="max-h-64 overflow-y-auto rounded-control border border-border p-3" role="group" aria-label={`Counties in ${countyState}`}>
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const inputId = `${id}-county-${c.fips}`;
                return (
                  <label key={c.fips} htmlFor={inputId} className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      id={inputId}
                      type="checkbox"
                      className="size-5 accent-primary"
                      checked={value.counties.includes(c.fips)}
                      onChange={() => onChange({ ...value, counties: toggle(value.counties, c.fips).sort() })}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
              {filtered.length === 0 ? <p className="type-small text-text-2">No county matches that filter.</p> : null}
            </div>
          </div>
        ) : null}
        {value.counties.length ? (
          <div>
            <p className="type-small font-semibold text-text-2">
              Counties chosen ({value.counties.length} of up to {limits.countiesPerSide})
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {value.counties.map((fips) => (
                <li key={fips}>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-1 rounded-pill border border-border-strong bg-surface px-3 text-text hover:bg-surface-2"
                    onClick={() => onChange({ ...value, counties: value.counties.filter((v) => v !== fips) })}
                  >
                    {countyNames[fips] ?? fips}
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">, remove</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Field
        id={`${id}-zips`}
        label="ZIP codes"
        optional
        help={`Separate with commas, spaces or new lines. Up to ${limits.zipsPerSide}.${zipParse.zips.length ? ` ${zipParse.zips.length} ZIP code${zipParse.zips.length === 1 ? "" : "s"} entered.` : ""}`}
        error={zipParse.invalid.length ? `Not 5-digit ZIP codes: ${zipParse.invalid.slice(0, 5).join(", ")}${zipParse.invalid.length > 5 ? "…" : ""}` : undefined}
      >
        <Textarea
          rows={2}
          inputMode="numeric"
          value={zipText}
          onChange={(e) => {
            setZipText(e.target.value);
            onChange({ ...value, zips: parseZips(e.target.value).zips });
          }}
        />
      </Field>
    </fieldset>
  );
}

// ------------------------------------------------------------------ rule editor

function CheckList({ legend, name, options, selected, allowed, onChange }: { legend: string; name: string; options: Labeled[]; selected: string[]; allowed: string[]; onChange: (next: string[]) => void }) {
  const id = useId();
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 text-[0.9375rem] font-semibold text-text">{legend}</legend>
      <p className="type-small text-text-3">None ticked means all you offer. Choices you don&apos;t offer are unavailable.</p>
      {options.map((o) => {
        const disabled = !allowed.includes(o.value) && !selected.includes(o.value);
        const inputId = `${id}-${name}-${o.value}`;
        return (
          <label key={o.value} htmlFor={inputId} className={cx("flex min-h-11 items-center gap-3", disabled ? "cursor-not-allowed text-text-3" : "cursor-pointer")}>
            <input
              id={inputId}
              type="checkbox"
              className="size-5 accent-primary"
              disabled={disabled}
              checked={selected.includes(o.value)}
              onChange={() => onChange(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
            />
            <span>
              {o.label}
              {disabled ? <span className="sr-only"> (not offered)</span> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function RuleEditor({
  ruleId,
  initial,
  props,
  countyNames,
  onCountyNames,
  onDone,
}: {
  ruleId: string | null;
  initial: RuleValue;
  props: CoverageEditorProps;
  countyNames: Record<string, string>;
  onCountyNames: (names: Record<string, string>) => void;
  onDone: (message: string | null) => void;
}) {
  const [rule, setRule] = useState<RuleValue>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const save = () => {
    start(async () => {
      const result = await saveRuleAction(ruleId, { ...rule, label: rule.label?.trim() || null });
      if (result.ok) onDone(ruleId ? "Rule saved. The change applies to future requests only." : "Rule added. It applies to future requests only.");
      else {
        setErrors(result.errors);
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    });
  };

  return (
    <section aria-labelledby={headingId} className="grid gap-5 rounded-card border-[1.5px] border-primary bg-surface p-5 sm:p-6">
      <h3 id={headingId} ref={headingRef} tabIndex={-1} className="type-h4 text-text focus:outline-none">
        {ruleId ? "Edit rule" : "New rule"}
      </h3>
      <div ref={errorRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
        {errors.length ? (
          <Alert tone="error" role="none" title="The rule wasn't saved">
            <ul className="grid list-disc gap-1 pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </div>
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-[0.9375rem] font-semibold text-text">This rule</legend>
        {(
          [
            ["include", "Adds coverage (include)", "Requests that match this rule can reach you."],
            ["exclude", "Removes coverage (exclude)", "Requests that match this rule never reach you, even if an include rule matches."],
          ] as const
        ).map(([value, label, description]) => (
          <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
            <input type="radio" name={`${headingId}-kind`} className="mt-0.5 size-5 accent-primary" checked={rule.kind === value} onChange={() => setRule({ ...rule, kind: value })} />
            <span>
              <span className="text-text">{label}</span>
              <span className="block type-small text-text-2">{description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Field id={`${headingId}-label`} label="Name" optional help="So your team knows what the rule is for.">
        <Input value={rule.label ?? ""} maxLength={80} onChange={(e) => setRule({ ...rule, label: e.target.value })} />
      </Field>
      <div className="grid gap-4 xl:grid-cols-2">
        <LocationSetEditor
          side="origin"
          value={rule.origin}
          onChange={(origin) => setRule({ ...rule, origin })}
          options={props.options.states}
          countyNames={countyNames}
          onCountyNames={onCountyNames}
          limits={props.limits}
        />
        <LocationSetEditor
          side="destination"
          value={rule.destination}
          onChange={(destination) => setRule({ ...rule, destination })}
          options={props.options.states}
          countyNames={countyNames}
          onCountyNames={onCountyNames}
          limits={props.limits}
        />
      </div>
      <p className="type-small text-text-2">
        {isEmpty(rule.origin) && isEmpty(rule.destination)
          ? "No areas chosen: this rule applies nationwide."
          : !isEmpty(rule.origin) && !isEmpty(rule.destination)
            ? "A route: moves must start in the pickup area and end in the destination area. The reverse direction needs its own rule."
            : !isEmpty(rule.origin)
              ? "Pickup only: moves that start here, going anywhere."
              : "Destination only: moves that end here, from anywhere."}
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <CheckList legend="Move types" name="types" options={props.options.moveTypes} selected={rule.moveTypes} allowed={props.capabilities.moveTypes} onChange={(moveTypes) => setRule({ ...rule, moveTypes })} />
        <CheckList legend="Move sizes" name="sizes" options={props.options.moveSizes} selected={rule.moveSizes} allowed={props.capabilities.moveSizes} onChange={(moveSizes) => setRule({ ...rule, moveSizes })} />
        <CheckList legend="Services" name="services" options={props.options.services} selected={rule.services} allowed={props.capabilities.services} onChange={(services) => setRule({ ...rule, services })} />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-5 accent-primary" checked={rule.paused} onChange={(e) => setRule({ ...rule, paused: e.target.checked })} />
        <span>Paused (keep the rule but ignore it for now)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} loading={pending}>
          {ruleId ? "Save rule" : "Add rule"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => onDone(null)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ test a move

function TestMove({ options }: { options: CoverageEditorProps["options"] }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof testMoveAction>> | null>(null);
  const run = (formData: FormData) => {
    start(async () => {
      setResult(
        await testMoveAction({
          fromZip: String(formData.get("fromZip") ?? ""),
          toZip: String(formData.get("toZip") ?? ""),
          moveSize: String(formData.get("moveSize") ?? ""),
          services: formData.getAll("testServices").map(String),
        }),
      );
    });
  };
  const moveTypeLabel = (v: string) => options.moveTypes.find((o) => o.value === v)?.label ?? v;
  return (
    <Card title="Test a move" titleAs="h2" description="Check whether a move between two ZIP codes would reach you with your current rules and services.">
      <form action={run} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="test-from" label="Pickup ZIP code" required>
            <Input name="fromZip" inputMode="numeric" autoComplete="off" />
          </Field>
          <Field id="test-to" label="Destination ZIP code" required>
            <Input name="toZip" inputMode="numeric" autoComplete="off" />
          </Field>
          <Field id="test-size" label="Move size" required>
            <Select name="moveSize" defaultValue="2br">
              {options.moveSizes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <ChoiceGroup name="testServices" idPrefix="test-services" legend="Services requested" options={options.services} selected={[]} columns={3} />
        <div>
          <Button type="submit" variant="secondary" loading={pending}>
            Test this move
          </Button>
        </div>
      </form>
      <div aria-live="polite" className="mt-4 empty:hidden">
        {result ? (
          result.ok ? (
            <Alert tone={result.matches ? "success" : "warning"} role="none" title={result.matches ? "This move would reach you" : "This move wouldn't reach you"}>
              <p>
                {result.origin.city}, {result.origin.state} <span className="tabular">{result.origin.zip}</span>
                {result.origin.countyName ? ` (${result.origin.countyName})` : ""} to {result.destination.city}, {result.destination.state}{" "}
                <span className="tabular">{result.destination.zip}</span>
                {result.destination.countyName ? ` (${result.destination.countyName})` : ""}: <span className="tabular">{result.distanceMiles}</span> miles,{" "}
                {moveTypeLabel(result.moveType).toLowerCase()}.
              </p>
              <p className="mt-1">{result.matches ? `Matched by ${result.matchedRule?.label ? `"${result.matchedRule.label}"` : "an unnamed include rule"}.` : result.reason}</p>
              {!result.canPurchase ? (
                <p className="mt-1">Your company can&apos;t buy requests yet, so for now this only shows what your coverage would match once it can.</p>
              ) : null}
            </Alert>
          ) : (
            <Alert tone="error" role="none">
              {result.error}
            </Alert>
          )
        ) : null}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ editor

export function CoverageEditor(props: CoverageEditorProps) {
  const [editing, setEditing] = useState<{ id: string | null; initial: RuleValue } | null>(null);
  const [countyNames, setCountyNames] = useState<Record<string, string>>(props.countyNames);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StoredRuleValue | null>(null);
  const [pending, start] = useTransition();
  const noticeRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const addNames = useMemo(() => (names: Record<string, string>) => setCountyNames((current) => ({ ...current, ...names })), []);
  const announce = (tone: "success" | "error", text: string) => {
    setNotice({ tone, text });
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  const run = (task: () => Promise<{ ok: true } | { ok: false; errors: string[] }>, success: string) => {
    start(async () => {
      const result = await task();
      if (result.ok) announce("success", success);
      else announce("error", result.errors[0] ?? "That didn't work. Try again.");
    });
  };

  const activeCount = props.rules.filter((r) => !r.paused).length;
  const includes = props.rules.filter((r) => r.kind === "include" && !r.paused).length;

  return (
    <div className="grid gap-6">
      <Alert tone="info" role="none" title="Changes apply to future requests only">
        Requests you already bought stay in your purchased requests and CRM, and their invoices don&apos;t change. Coverage version{" "}
        <span className="tabular">{props.coverageVersion}</span>.
      </Alert>

      <div ref={noticeRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
        {notice ? (
          <Alert tone={notice.tone} role="none">
            {notice.text}
          </Alert>
        ) : null}
      </div>

      <CapabilitiesCard capabilities={props.capabilities} options={props.options} />

      <Card
        title="Coverage rules"
        titleAs="h2"
        description="A request reaches you when at least one active include rule matches and no active exclude rule does."
        actions={
          props.rules.length ? (
            <>
              <Button type="button" variant="secondary" size="sm" disabled={pending || activeCount === 0} onClick={() => run(() => setPausedAction(null, true), "All rules paused. You won't receive new requests until you resume.")}>
                Pause all
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={pending || activeCount === props.rules.length} onClick={() => run(() => setPausedAction(null, false), "All rules resumed.")}>
                Resume all
              </Button>
            </>
          ) : null
        }
      >
        {includes === 0 ? (
          <Alert tone="warning" role="none" className="mb-4">
            You have no active include rule, so no new requests can reach you.
          </Alert>
        ) : null}
        {props.rules.length ? (
          <ul className="grid gap-3">
            {props.rules.map((rule) =>
              editing?.id === rule.id ? (
                <li key={rule.id}>
                  <RuleEditor
                    ruleId={rule.id}
                    initial={editing.initial}
                    props={props}
                    countyNames={countyNames}
                    onCountyNames={addNames}
                    onDone={(message) => {
                      setEditing(null);
                      if (message) announce("success", message);
                    }}
                  />
                </li>
              ) : (
                <li key={rule.id} className={cx("rounded-control border border-border p-4", rule.paused && "bg-surface-2")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid min-w-0 gap-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <Badge variant={rule.kind === "include" ? "outline" : "neutral"}>{rule.kind === "include" ? "Include" : "Exclude"}</Badge>
                        <span className="font-semibold text-text">{rule.label || (rule.kind === "include" ? "Unnamed include rule" : "Unnamed exclusion")}</span>
                        {rule.paused ? <StatusPill tone="neutral">Paused</StatusPill> : null}
                      </p>
                      <dl className="grid gap-0.5 type-small text-text-2">
                        <div className="flex flex-wrap gap-1">
                          <dt className="font-semibold">From:</dt>
                          <dd>{isEmpty(rule.origin) ? "Anywhere" : describeSet(rule.origin, countyNames)}</dd>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <dt className="font-semibold">To:</dt>
                          <dd>{isEmpty(rule.destination) ? "Anywhere" : describeSet(rule.destination, countyNames)}</dd>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <dt className="font-semibold">Moves:</dt>
                          <dd>
                            {[
                              rule.moveTypes.length ? labelsOf(rule.moveTypes, props.options.moveTypes).join(", ") : "All move types you offer",
                              rule.moveSizes.length ? labelsOf(rule.moveSizes, props.options.moveSizes).join(", ") : null,
                              rule.services.length ? `Services: ${labelsOf(rule.services, props.options.services).join(", ")}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending || editing !== null}
                        onClick={() => setEditing({ id: rule.id, initial: { ...rule } })}
                      >
                        Edit<span className="sr-only"> {rule.label ?? "rule"}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => run(() => setPausedAction(rule.id, !rule.paused), rule.paused ? "Rule resumed." : "Rule paused.")}
                      >
                        {rule.paused ? "Resume" : "Pause"}
                        <span className="sr-only"> {rule.label ?? "rule"}</span>
                      </Button>
                      <Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => setConfirmDelete(rule)}>
                        Delete<span className="sr-only"> {rule.label ?? "rule"}</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-text-2">No rules yet. Add one to start receiving requests.</p>
        )}

        <div className="mt-4">
          {editing?.id === null ? (
            <RuleEditor
              ruleId={null}
              initial={editing.initial}
              props={props}
              countyNames={countyNames}
              onCountyNames={addNames}
              onDone={(message) => {
                setEditing(null);
                if (message) announce("success", message);
                else requestAnimationFrame(() => addButtonRef.current?.focus());
              }}
            />
          ) : (
            <Button
              ref={addButtonRef}
              type="button"
              disabled={editing !== null || props.rules.length >= props.limits.rulesPerCompany}
              onClick={() => setEditing({ id: null, initial: emptyRule() })}
            >
              Add a rule
            </Button>
          )}
          {props.rules.length >= props.limits.rulesPerCompany ? (
            <p className="mt-2 type-small text-text-2">You&apos;ve reached the limit of {props.limits.rulesPerCompany} rules.</p>
          ) : null}
        </div>
      </Card>

      <TestMove options={props.options} />

      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this rule?"
        description={confirmDelete ? `"${confirmDelete.label || "Unnamed rule"}" will stop applying to new requests. Requests you already bought aren't affected.` : undefined}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)}>
              Keep the rule
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending}
              onClick={() => {
                const target = confirmDelete;
                if (!target) return;
                setConfirmDelete(null);
                run(() => deleteRuleAction(target.id), "Rule deleted.");
              }}
            >
              Delete rule
            </Button>
          </>
        }
      />
    </div>
  );
}
