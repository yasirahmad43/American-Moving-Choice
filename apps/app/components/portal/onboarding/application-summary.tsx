import { AREA_REACH_LABELS, INSURANCE_COVERAGE_LABELS, STEP_TITLES, type ApplicationData, type ApplicationStep } from "@amc/server/companies";
import { MOVE_SIZE_LABELS, MOVE_TYPE_SHORT_LABELS, SERVICE_SHORT_LABELS } from "@amc/server/coverage";
import { AbsoluteDate } from "@amc/ui";
import Link from "next/link";
import type { ReactNode } from "react";

const phoneText = (e164: string) => {
  const d = e164.replace(/^\+1/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="type-small font-semibold text-text-2">{label}</dt>
      <dd className="min-w-0 break-words text-text">{children}</dd>
    </div>
  );
}

const missing = <span className="text-text-3">Not answered yet</span>;

/** The saved answers, grouped by step, with an edit link per step when editable. */
export function ApplicationSummary({ data, editable }: { data: ApplicationData; editable: boolean }) {
  const section = (step: ApplicationStep, body: ReactNode) => (
    <section key={step} aria-labelledby={`summary-${step}`} className="border-b border-border py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`summary-${step}`} className="type-h4 text-text">
          {STEP_TITLES[step]}
        </h3>
        {editable ? (
          <Link href={`/portal/application?step=${step}`} className="link inline-flex min-h-11 items-center">
            Edit<span className="sr-only"> {STEP_TITLES[step].toLowerCase()}</span>
          </Link>
        ) : null}
      </div>
      <dl className="mt-1">{body}</dl>
    </section>
  );
  const c = data.company;
  const i = data.identifiers;
  const sv = data.services;
  const a = data.areas;
  const cr = data.credentials;
  const ins = data.insurance;
  const r = data.representative;
  return (
    <div>
      {section(
        "company",
        c ? (
          <>
            <Row label="Legal name">{c.legalName}</Row>
            {c.dbaName ? <Row label="DBA">{c.dbaName}</Row> : null}
            <Row label="Address">
              {c.addressLine1}
              {c.addressLine2 ? `, ${c.addressLine2}` : ""}, {c.city}, {c.state} <span className="tabular">{c.zip}</span>
            </Row>
            <Row label="Phone">
              <span className="tabular">{phoneText(c.phone)}</span>
            </Row>
            {c.website ? <Row label="Website">{c.website}</Row> : null}
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "identifiers",
        i ? (
          <>
            <Row label="USDOT number">
              <span className="tabular">{i.usdot}</span>
            </Row>
            <Row label="MC number">{i.mc ? <span className="tabular">{i.mc}</span> : "None given"}</Row>
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "services",
        sv ? (
          <>
            <Row label="Move types">{sv.moveTypes.map((v) => MOVE_TYPE_SHORT_LABELS[v]).join(", ")}</Row>
            <Row label="Move sizes">{sv.moveSizes.map((v) => MOVE_SIZE_LABELS[v]).join(", ")}</Row>
            <Row label="Services">{sv.services.map((v) => SERVICE_SHORT_LABELS[v]).join(", ")}</Row>
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "areas",
        a ? (
          <>
            <Row label="States">{a.states.join(", ")}</Row>
            <Row label="Moves">{AREA_REACH_LABELS[a.reach]}</Row>
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "credentials",
        cr ? (
          cr.noneRequired ? (
            <Row label="State credentials">None apply</Row>
          ) : (
            cr.rows.map((row, n) => (
              <Row key={n} label={`${row.state} credential`}>
                <span className="tabular">{row.number}</span>
                {row.issuer ? `, ${row.issuer}` : ""}
                {row.expiresOn ? (
                  <>
                    , expires <AbsoluteDate value={row.expiresOn} />
                  </>
                ) : null}
              </Row>
            ))
          )
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "insurance",
        ins ? (
          <>
            <Row label="Insurer">{ins.insurer}</Row>
            <Row label="Policy number">
              <span className="tabular">{ins.policyNumber}</span>
            </Row>
            <Row label="Expires">
              <AbsoluteDate value={ins.expiresOn} />
            </Row>
            <Row label="Covers">{ins.coverages.map((v) => INSURANCE_COVERAGE_LABELS[v]).join(", ")}</Row>
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
      {section(
        "representative",
        r ? (
          <>
            <Row label="Name">
              {r.name}, {r.title}
            </Row>
            <Row label="Contact">
              {r.email} · <span className="tabular">{phoneText(r.phone)}</span>
            </Row>
            <Row label="Authority">Confirmed</Row>
          </>
        ) : (
          <Row label="Answers">{missing}</Row>
        ),
      )}
    </div>
  );
}
