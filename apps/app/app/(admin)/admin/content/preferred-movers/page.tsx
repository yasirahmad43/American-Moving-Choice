import { PREFERRED_CRITERIA, preferredMoverEvidence } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { CHECK_LABELS, type CheckType } from "@amc/server/verification";
import { Alert, Card, CompanyStatusPill, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle, StatTile, Status, When } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/content/preferred-movers");

export const metadata: Metadata = { title: `${item.label} · Admin` };

const EVIDENCE_CHECKS: CheckType[] = ["usdot_active", "authority_type", "authority_status", "insurance_filings"];

export default async function PreferredMoversPage() {
  await requireAdmin({ roles: item.roles });
  const { companies, requireMc } = await preferredMoverEvidence();
  const meeting = companies.filter((c) => c.meets);
  return (
    <div className="grid gap-8">
      <PageHeader size="portal" title={item.label} description={item.description} />
      <Alert tone="info" title="Published definition (mover verification §4)" role="none">
        “Preferred Mover — American Moving Choice” means the company has joined our network of moving carriers and passed our published screening standards on the date shown: active USDOT registration and household-goods carrier authority, no broker authority, required insurance on file, and agreement to our movers-only terms. It is not a government endorsement, a guarantee of performance, or a statement about customer satisfaction. Customer reviews are shown separately. Preferred status is conditional and is removed automatically with suspension. There is no ranking: a company meets every criterion or it is not preferred.
      </Alert>
      <section aria-labelledby="criteria">
        <SectionTitle id="criteria" description="Each criterion is read from the verification records the admin already keeps; this page adds no rule of its own (docs/business-rules/mover-verification-and-reviews.md).">
          The criteria
        </SectionTitle>
        <Table sortable
          caption="Preferred-mover criteria"
          hideCaption
          compact
          rowKey={(c) => c.id}
          rows={[...PREFERRED_CRITERIA]}
          columns={[
            { key: "label", header: "Criterion", cell: (c) => <span className="font-semibold">{c.label}</span> },
            { key: "rule", header: "How it is checked", cell: (c) => c.rule },
            { key: "source", header: "Written in", cell: (c) => <span className="type-small text-text-2">{c.source}</span> },
            { key: "meeting", header: "Companies meeting it", numeric: true, cell: (c) => `${companies.filter((x) => x.criteria[c.id]).length} of ${companies.length}` },
          ]}
        />
        <p className="mt-2 type-small text-text-2">The MC-number criterion follows the require_mc_number setting, currently {requireMc ? "on" : "off"}.</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Approved or suspended companies" value={companies.length} href="/admin/companies" />
        <StatTile label="Meet every criterion" value={meeting.length} note="Shown with the badge and listed in the directory" />
        <StatTile label="Do not" value={companies.length - meeting.length} note="Suspended, or evidence missing or failed" />
      </div>
      <section aria-labelledby="companies">
        <SectionTitle id="companies" description="Evidence per company: the latest result of each automated check, the insurance certificate on file, the terms acceptance and the purchase eligibility function.">
          Companies and their evidence
        </SectionTitle>
        <Table sortable
          caption="Companies against the criteria"
          hideCaption
          compact
          rowKey={(c) => c.company_id}
          rows={companies}
          empty={<p className="text-text-2">No approved or suspended company yet.</p>}
          columns={[
            {
              key: "company",
              header: "Company",
              cell: (c) => (
                <span className="grid gap-1">
                  <Link href={`/admin/companies/${c.company_id}`} className="font-semibold text-link underline">
                    {c.legal_name}
                  </Link>
                  <CompanyStatusPill status={c.status as "approved" | "suspended"} />
                </span>
              ),
            },
            { key: "meets", header: "Preferred", cell: (c) => (c.meets ? <Status value="pass" label="Meets all" /> : <span className="grid gap-0.5"><Status value="fail" label="Does not" /><span className="type-small text-text-2">{c.missing.join("; ")}</span></span>) },
            { key: "usdot", header: "USDOT / MC", cell: (c) => <span className="grid gap-0.5"><span>USDOT {c.usdot_number ?? "none"}</span><span className="type-small text-text-2">MC {c.mc_number ?? "none"}{c.has_broker_authority ? " · broker authority on record" : ""}</span></span> },
            {
              key: "checks",
              header: "Latest FMCSA checks",
              cell: (c) => (
                <ul className="grid gap-0.5 type-small">
                  {EVIDENCE_CHECKS.map((t) => {
                    const ch = c.checks[t];
                    return (
                      <li key={t} className="flex flex-wrap items-center gap-1.5">
                        <Status value={ch?.result ?? "pending"} label={ch ? undefined : "No check"} />
                        <span>{CHECK_LABELS[t]}</span>
                        {ch ? <span className="text-text-3">({ch.source}, <When value={ch.retrieved_at} date />)</span> : null}
                      </li>
                    );
                  })}
                </ul>
              ),
            },
            { key: "insurance", header: "Insurance certificate", cell: (c) => (c.insurance ? <span className="grid gap-0.5"><Status value={c.insurance.status} /><span className="type-small text-text-2">expires <When value={c.insurance.expires_on} date /></span></span> : <span className="text-text-3">None on file</span>) },
            { key: "terms", header: "Movers-only terms", cell: (c) => (c.terms ? <span className="grid gap-0.5"><span>v{c.terms.terms_version}</span><span className="type-small text-text-2"><When value={c.terms.accepted_at} date /></span></span> : <span className="text-text-3">Not recorded</span>) },
            { key: "purchase", header: "Can buy requests", cell: (c) => <Status value={c.can_purchase ? "pass" : "fail"} label={c.can_purchase ? "Yes" : "No"} /> },
          ]}
        />
      </section>
      <Card title="What this page does not do" titleAs="h2">
        <p className="text-text-2">It introduces no score, order or weighting. Verification decisions are made on the company pages; suspension removes Preferred status automatically; badges on the public site show the verification date and link to the FMCSA record.</p>
      </Card>
    </div>
  );
}
