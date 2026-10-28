import { requireMembership } from "@amc/server/auth";
import { getListing } from "@amc/server/marketplace";
import { Alert, EmptyState, LinkButton, PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { blockedReason, dialogProps, loadBuyer } from "@/components/portal/marketplace/buyer";
import { LeadCard } from "@/components/portal/marketplace/lead-card";
import { LiveAvailability } from "@/components/portal/marketplace/live-availability";
import { PurchaseDialog } from "@/components/portal/marketplace/purchase-dialog";
import { portalNavItem } from "@/lib/nav/portal";

const item = portalNavItem("/portal/marketplace");

export const metadata: Metadata = { title: "Request preview" };

export default async function MarketplaceRequestPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const { groupId } = await params;
  const [lookup, buyer] = await Promise.all([getListing({ userId: user.id, companyId: membership.companyId }, groupId), loadBuyer(membership)]);
  const breadcrumbs = [{ label: "Marketplace", href: "/portal/marketplace" }, { label: "Request preview" }];

  if (lookup.state === "purchased") {
    return (
      <div className="grid gap-6">
        <PageHeader title="Request preview" breadcrumbs={breadcrumbs} size="portal" />
        <Alert tone="success" title="Your company bought this request" action={<LinkButton href={`/portal/leads/${lookup.purchaseId}`}>Open contact details</LinkButton>}>
          Its contact details and CRM record are in Purchased requests.
        </Alert>
      </div>
    );
  }

  if (lookup.state === "unavailable") {
    return (
      <div className="grid gap-6">
        <PageHeader title="Request preview" breadcrumbs={breadcrumbs} size="portal" />
        <EmptyState
          title="This request is no longer available"
          description="It may have reached the number of movers the customer chose, its sale window may have ended, or the customer withdrew it. No charge was made."
          action={
            <LinkButton href="/portal/marketplace" variant="secondary">
              Back to the marketplace
            </LinkButton>
          }
        />
      </div>
    );
  }

  const blocked = blockedReason(buyer);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Request preview"
        description="What you can see before buying. Contact details appear immediately after payment succeeds."
        breadcrumbs={breadcrumbs}
        size="portal"
      />
      {blocked ? <Alert tone="warning">{blocked}</Alert> : null}
      <LeadCard listing={lookup.listing} action={<PurchaseDialog {...dialogProps(lookup.listing, buyer)} />} />
      <p>
        <LiveAvailability groupIds={[lookup.listing.groupId]} />
      </p>
    </div>
  );
}
