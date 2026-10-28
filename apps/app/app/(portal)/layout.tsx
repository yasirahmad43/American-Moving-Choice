import { COMPANY_ROLE_LABELS, requireMembership } from "@amc/server/auth";
import { CompanyStatusPill } from "@amc/ui";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { portalNavFor } from "@/lib/nav/portal";

/**
 * Company portal layout. The guard here keeps signed-out users and users without a company out of
 * the whole area; pages and actions still check membership and role themselves, because layouts
 * do not re-run on every navigation.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { user, membership } = await requireMembership();
  const sections = portalNavFor(membership.role).map((section) => ({
    title: section.title,
    items: section.items.map(({ href, label }) => ({ href, label })),
  }));
  return (
    <AppShell
      areaLabel="Company portal"
      rootHref="/portal"
      sections={sections}
      userLabel={user.fullName ? `${user.fullName} (${user.email})` : user.email}
      context={
        <>
          <span className="max-w-[18rem] truncate font-semibold text-text" title={membership.companyName}>
            {membership.companyName}
          </span>
          <CompanyStatusPill status={membership.companyStatus} />
          <span className="text-text-3">{COMPANY_ROLE_LABELS[membership.role]}</span>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
