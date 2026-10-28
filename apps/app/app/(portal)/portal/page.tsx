import { requireMembership } from "@amc/server/auth";
import { Alert, Card, CompanyStatusPill, LinkButton, PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavFor } from "@/lib/nav/portal";

export const metadata: Metadata = { title: "Dashboard" };

/** Portal dashboard placeholder. The onboarding slice (S5) replaces it. */
export default async function PortalDashboard() {
  const { user, membership } = await requireMembership();
  const sections = portalNavFor(membership.role).flatMap((section) => section.items).filter((item) => item.href !== "/portal");
  const applying = membership.companyStatus !== "approved";
  return (
    <div className="grid gap-6">
      <PageHeader
        size="portal"
        title={`Welcome${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {membership.companyName} <CompanyStatusPill status={membership.companyStatus} />
          </span>
        }
      />
      {applying ? (
        <Alert tone="info" title="Your application is in progress">
          We check your USDOT and MC numbers against FMCSA records, then a reviewer looks at the results. You can buy move requests once
          your company is approved.
        </Alert>
      ) : null}
      <Card title="Portal sections" titleAs="h2" description="Sections arrive as the preview build fills in.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {sections.map((item) => (
            <li key={item.href} className="rounded-control border border-border p-4">
              <p className="font-semibold text-text">{item.label}</p>
              <p className="mt-1 type-small text-text-2">{item.description}</p>
              <LinkButton href={item.href} variant="ghost" size="sm" className="-ml-3 mt-1">
                Open {item.label.toLowerCase()}
              </LinkButton>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
