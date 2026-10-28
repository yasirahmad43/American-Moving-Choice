import { requireMembership } from "@amc/server/auth";
import { RECHECK_SCHEDULE, RESULT_LABELS, getVerificationOverview, type CheckView, type CredentialView } from "@amc/server/companies";
import { AbsoluteDate, Card, CompanyStatusPill, ExternalLinkIcon, PageHeader, StatusPill, Table, type StatusTone } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { portalNavItem } from "@/lib/nav/portal";

const item = portalNavItem("/portal/verification");

export const metadata: Metadata = { title: item.label };

const RESULT_TONES: Record<CheckView["result"], StatusTone> = { pass: "success", fail: "error", needs_review: "info", not_run: "neutral" };
const CREDENTIAL_STATUS: Record<CredentialView["status"], { label: string; tone: StatusTone }> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Not yet verified", tone: "neutral" },
  rejected: { label: "Not accepted", tone: "error" },
  expired: { label: "Expired", tone: "warning" },
};

/** Each check with its result, source, date and plain-language meaning; the recheck schedule; how to report a change. */
export default async function VerificationPage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const data = await getVerificationOverview({ userId: user.id, companyId: membership.companyId });

  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        title="Verification"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            What we checked about {membership.companyName}, where and when. <CompanyStatusPill status={data.status} />
          </span>
        }
      />

      <Card
        title="Your federal numbers"
        titleAs="h2"
        description={
          data.lastAutomatedRun ? (
            <>
              FMCSA records last checked <AbsoluteDate value={data.lastAutomatedRun} withTime />.
            </>
          ) : (
            "We check FMCSA records when you submit your application."
          )
        }
      >
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="type-small font-semibold text-text-2">USDOT number</dt>
            <dd className="tabular text-text">{data.usdot ?? "Not given"}</dd>
          </div>
          <div>
            <dt className="type-small font-semibold text-text-2">MC number</dt>
            <dd className="tabular text-text">{data.mc ?? "Not given"}</dd>
          </div>
          {data.snapshotUrl ? (
            <div>
              <dt className="type-small font-semibold text-text-2">Official record</dt>
              <dd>
                <a href={data.snapshotUrl} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
                  FMCSA company snapshot
                  <ExternalLinkIcon size={16} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <section aria-labelledby="checks-heading" className="grid gap-3">
        <h2 id="checks-heading" className="type-h3 text-text">
          Checks
        </h2>
        <ul className="grid gap-3">
          {data.checks.map((check) => (
            <li key={check.checkType}>
              <Card as="article" aria-labelledby={`check-${check.checkType}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 id={`check-${check.checkType}`} className="type-h4 text-text">
                    {check.label}
                  </h3>
                  <StatusPill tone={RESULT_TONES[check.result]}>{RESULT_LABELS[check.result]}</StatusPill>
                </div>
                <p className="mt-1 type-small text-text-2">{check.what}</p>
                <p className="mt-3 text-text">{check.meaning}</p>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 type-small text-text-2">
                  <div className="flex gap-1">
                    <dt className="font-semibold">Source:</dt>
                    <dd>{check.source ?? "Not checked yet"}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="font-semibold">Checked:</dt>
                    <dd>{check.checkedAt ? <AbsoluteDate value={check.checkedAt} withTime /> : "Not yet"}</dd>
                  </div>
                  {check.officialUrl ? (
                    <div>
                      <dt className="sr-only">Official record</dt>
                      <dd>
                        <a href={check.officialUrl} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
                          Official FMCSA record<span className="sr-only"> for {check.label.toLowerCase()} (opens in a new tab)</span>
                          <ExternalLinkIcon size={14} aria-hidden="true" />
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card title="Credentials on file" titleAs="h2" description="Numbers you gave us and what we found. We never show documents here.">
        <Table
          caption="Credentials on file"
          hideCaption
          rowKey={(c) => c.id}
          rows={data.credentials}
          empty={<p className="text-text-2">No credentials on file yet. They appear once you submit your application.</p>}
          columns={[
            { key: "type", header: "Credential", cell: (c) => (c.state ? `${c.label} (${c.state})` : c.label) },
            { key: "number", header: "Number", cell: (c) => <span className="tabular">{c.number ?? "—"}</span> },
            { key: "issuer", header: "Issued by", cell: (c) => c.issuer ?? "—" },
            { key: "expires", header: "Expires", cell: (c) => (c.expiresOn ? <AbsoluteDate value={c.expiresOn} /> : "—") },
            { key: "status", header: "Status", cell: (c) => <StatusPill tone={CREDENTIAL_STATUS[c.status].tone}>{CREDENTIAL_STATUS[c.status].label}</StatusPill> },
          ]}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="When we check again" titleAs="h2">
          <ul className="grid list-disc gap-2 pl-5 text-text-2">
            {RECHECK_SCHEDULE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
        <Card title="Report a change" titleAs="h2">
          <div className="grid gap-3 text-text-2">
            <p>
              Our mover terms ask you to tell us promptly about any change to your operating authority, USDOT or MC numbers, insurance, state credentials,
              ownership or address.
            </p>
            <p>
              Update the official record first (FMCSA, your state agency or your insurer), then email{" "}
              <a href="mailto:verification@americanmovingchoice.invalid" className="link">
                verification@americanmovingchoice.invalid
              </a>{" "}
              with your USDOT number and what changed. A reviewer reruns the checks. In this preview the address is a placeholder and nothing is sent.
            </p>
            {data.status === "applied" || data.status === "rejected" ? (
              <p>
                Your application isn&apos;t submitted yet, so you can still change your answers on the{" "}
                <Link href="/portal/application" className="link">
                  application
                </Link>
                .
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
