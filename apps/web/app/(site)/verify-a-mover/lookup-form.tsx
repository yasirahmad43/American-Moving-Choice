"use client";

import { Alert, Button, Chip, Field, Input, RadioCardGroup, formatAbsoluteDate } from "@amc/ui";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { idleState } from "@/components/directory/form-state";
import { lookupMoverAction, type LookupState, type LookupView } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} loadingLabel="Looking up…">
      Look up
    </Button>
  );
}

const yesNo = (value: boolean | null, yes: string, no: string) => (value === null ? "Not shown on the record" : value ? yes : no);

const CLASS_TEXT = {
  carrier: {
    title: "Moving carrier: carrier authority and no broker authority on this record",
    body: "A carrier performs moves itself.",
  },
  broker: {
    title: "Broker: this record shows broker authority and no active carrier authority",
    body: "A broker arranges moves that other companies carry out; it doesn't move your belongings itself. American Moving Choice doesn't accept brokers.",
  },
  carrier_and_broker: {
    title: "Carrier and broker: this record shows both carrier and broker authority",
    body: "A company registered as both can arrange moves that other companies carry out. American Moving Choice doesn't accept companies with any broker authority.",
  },
  none_active: {
    title: "No active operating authority on this record",
    body: "Interstate household-goods moves need active carrier authority. Some movers that work only within one state hold state credentials instead.",
  },
} as const;

const STATUS_WORDS = { active: "Active", pending: "Pending", revoked: "Revoked", inactive: "Inactive" } as const;

function Links({ result }: { result: LookupView }) {
  return (
    <ul className="grid gap-1">
      {result.links.snapshot ? (
        <li>
          <a href={result.links.snapshot} className="link inline-flex min-h-11 items-center" target="_blank" rel="noopener noreferrer">
            FMCSA company snapshot (SAFER) for USDOT {"record" in result ? result.record.usdot : result.query.number}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ) : null}
      <li>
        <a href={result.links.licensing} className="link inline-flex min-h-11 items-center" target="_blank" rel="noopener noreferrer">
          FMCSA Licensing and Insurance (authority and insurance filings)<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </li>
      <li>
        <a href={result.links.protectYourMove} className="link inline-flex min-h-11 items-center" target="_blank" rel="noopener noreferrer">
          FMCSA Protect Your Move (complaint history and guidance)<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </li>
    </ul>
  );
}

function Result({ result }: { result: LookupView }) {
  const when = formatAbsoluteDate(result.retrievedAt, { withTime: true, month: "long" });
  const source = result.demo ? "recorded demo data (fictional companies only), not live FMCSA data" : "FMCSA's QCMobile service";
  const asked = `${result.query.kind === "usdot" ? "USDOT" : "MC"} ${result.query.number}`;
  return (
    <section aria-labelledby="lookup-result" className="grid gap-4 rounded-card border border-border bg-surface p-5 shadow-e1">
      <h2 id="lookup-result" className="type-h3 text-text">
        Result for {asked}
      </h2>
      <p className="type-small text-text-2">
        Data retrieved {when} from {source}. This is what the federal record showed at that moment; it isn't an endorsement or a rating of the
        company by American Moving Choice.
      </p>
      {result.demo ? <Chip tone="demo">Demo data: fictional records</Chip> : null}

      {result.status === "found" ? (
        <>
          <Alert tone={result.record.classification === "carrier" ? "info" : "warning"} role="none" title={CLASS_TEXT[result.record.classification].title}>
            {CLASS_TEXT[result.record.classification].body}{" "}
            <Link href="/movers-vs-brokers/" className="link">
              Movers vs brokers
            </Link>
          </Alert>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(10rem,14rem)_1fr]">
            <dt className="type-small text-text-3">Legal name</dt>
            <dd className="m-0 font-semibold text-text">{result.record.legalName ?? "Not shown on the record"}</dd>
            {result.record.dbaName ? (
              <>
                <dt className="type-small text-text-3">Doing business as</dt>
                <dd className="m-0 text-text">{result.record.dbaName}</dd>
              </>
            ) : null}
            <dt className="type-small text-text-3">USDOT number</dt>
            <dd className="m-0 tabular text-text">{result.record.usdot}</dd>
            <dt className="type-small text-text-3">USDOT status</dt>
            <dd className="m-0 text-text">
              {result.record.usdotStatus === "active" ? "Active" : result.record.usdotStatus === "inactive" ? "Inactive" : "Not shown on the record"}
              {result.record.outOfService ? " · Marked out of service" : result.record.outOfService === false ? " · Not out of service" : ""}
            </dd>
            {result.record.basedIn ? (
              <>
                <dt className="type-small text-text-3">Physical address city</dt>
                <dd className="m-0 text-text">{result.record.basedIn}</dd>
              </>
            ) : null}
            <dt className="type-small text-text-3">Operating authority</dt>
            <dd className="m-0 text-text">
              {result.record.authorities.length ? (
                <ul className="grid gap-1">
                  {result.record.authorities.map((a) => (
                    <li key={`${a.docket}-${a.label}`}>
                      <span className="tabular">{a.docket}</span>: {a.label} · {STATUS_WORDS[a.status]}
                    </li>
                  ))}
                </ul>
              ) : (
                "None on the record"
              )}
            </dd>
            <dt className="type-small text-text-3">Insurance filings</dt>
            <dd className="m-0 text-text">
              Liability: {yesNo(result.record.insurance.bipdOnFile, "on file", "not on file")} · Cargo:{" "}
              {yesNo(result.record.insurance.cargoOnFile, "on file", "not on file")} · Broker bond:{" "}
              {yesNo(result.record.insurance.bondOnFile, "on file", "not on file")}
            </dd>
          </dl>
          {result.inNetwork ? (
            <p className="text-text">
              This USDOT number belongs to a company in our network:{" "}
              <Link href={`/companies/${result.inNetwork.slug}/`} className="link">
                {result.inNetwork.displayName}
              </Link>
              . Its profile shows the dates of our own checks.
            </p>
          ) : (
            <p className="text-text-2">No company with this USDOT number is listed in our network.</p>
          )}
        </>
      ) : result.status === "not_found" ? (
        <Alert tone="warning" role="none" title="No record found">
          {result.demo
            ? "The demo data has no record for that number. In this preview, try a fictional USDOT number from 9000001 to 9000099."
            : "FMCSA has no carrier record for that number. Check the number with the company, and search FMCSA's pages below."}
        </Alert>
      ) : (
        <Alert tone="info" role="none" title="We couldn't answer this lookup">
          {result.reason}
        </Alert>
      )}
      <div className="grid gap-1">
        <h3 className="type-h4 text-text">Check the official records yourself</h3>
        <Links result={result} />
      </div>
    </section>
  );
}

/** Lookup by USDOT or MC number; the result renders here and is never a URL. */
export function LookupForm() {
  const [state, action] = useActionState(lookupMoverAction, idleState as LookupState);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.attempt > 0) resultRef.current?.focus();
  }, [state.attempt]);
  const kind = typeof state.values?.kind === "string" ? state.values.kind : undefined;
  const number = typeof state.values?.number === "string" ? state.values.number : "";
  return (
    <div className="grid gap-6">
      <form action={action} noValidate className="grid gap-5" key={state.attempt}>
        <RadioCardGroup
          id="lookup-kind"
          name="kind"
          legend="Look up by"
          options={[
            { value: "usdot", label: "USDOT number" },
            { value: "mc", label: "MC number" },
          ]}
          defaultValue={kind || "usdot"}
          error={state.fieldErrors?.kind}
          columns={2}
        />
        <Field id="lookup-number" label="USDOT or MC number" help="Digits only. You can include the letters MC or USDOT." error={state.fieldErrors?.number} className="max-w-[20rem]">
          <Input name="number" inputMode="numeric" autoComplete="off" maxLength={14} defaultValue={number} />
        </Field>
        <div>
          <Submit />
        </div>
      </form>
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
        {state.status === "error" && state.message ? <Alert tone="error" role="none">{state.message}</Alert> : null}
        {state.status === "success" && state.result ? <Result result={state.result} /> : null}
      </div>
    </div>
  );
}
