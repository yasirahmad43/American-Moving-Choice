import { requireMembership } from "@amc/server/auth";
import { ZIP_RADIUS_OPTIONS, listAvailable, parseMarketplaceFilters, type MarketplaceFilters } from "@amc/server/marketplace";
import { Alert, Button, Card, ChevronDownIcon, EmptyState, Field, Input, LinkButton, Money, PageHeader, Select } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { blockedReason, dialogProps, loadBuyer } from "@/components/portal/marketplace/buyer";
import { MOVE_SIZE_LABELS, SOURCE_LABELS, STATE_CODES } from "@/components/portal/marketplace/labels";
import { LeadCard } from "@/components/portal/marketplace/lead-card";
import { LiveAvailability } from "@/components/portal/marketplace/live-availability";
import { PurchaseDialog } from "@/components/portal/marketplace/purchase-dialog";
import { portalNavItem } from "@/lib/nav/portal";

const item = portalNavItem("/portal/marketplace");

export const metadata: Metadata = { title: item.label };

function filterQuery(filters: MarketplaceFilters): string {
  const params = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const text = params.toString();
  return text ? `?${text}` : "";
}

function Filters({ filters }: { filters: MarketplaceFilters }) {
  return (
    <form method="get" action="/portal/marketplace" className="grid gap-4" aria-label="Filter requests">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="scope" label="Area" help="Nationwide lists every request that names your company; state and ZIP filters narrow the route.">
          <Select name="scope" defaultValue={filters.scope ?? ""}>
            <option value="">Use the filters below</option>
            <option value="nationwide">Nationwide (any route)</option>
            <option value="state">By state</option>
            <option value="zip">By ZIP code</option>
          </Select>
        </Field>
        <Field id="originZip" label="Moving from (ZIP)">
          <Input name="originZip" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="78704" defaultValue={filters.originZip ?? ""} />
        </Field>
        <Field id="destZip" label="Moving to (ZIP)">
          <Input name="destZip" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="77006" defaultValue={filters.destZip ?? ""} />
        </Field>
        <Field id="radiusMiles" label="ZIP radius">
          <Select name="radiusMiles" defaultValue={filters.radiusMiles ?? ""}>
            <option value="">Exact ZIP</option>
            {ZIP_RADIUS_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                Within {miles} miles
              </option>
            ))}
          </Select>
        </Field>
        <Field id="originState" label="Moving from (state)">
          <Select name="originState" defaultValue={filters.originState ?? ""}>
            <option value="">Any state</option>
            {STATE_CODES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="destState" label="Moving to (state)">
          <Select name="destState" defaultValue={filters.destState ?? ""}>
            <option value="">Any state</option>
            {STATE_CODES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="moveDateFrom" label="Move date from">
          <Input type="date" name="moveDateFrom" defaultValue={filters.moveDateFrom ?? ""} />
        </Field>
        <Field id="moveDateTo" label="Move date to">
          <Input type="date" name="moveDateTo" defaultValue={filters.moveDateTo ?? ""} />
        </Field>
        <Field id="moveSize" label="Size">
          <Select name="moveSize" defaultValue={filters.moveSize ?? ""}>
            <option value="">Any size</option>
            {Object.entries(MOVE_SIZE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="leadType" label="Exclusive or shared">
          <Select name="leadType" defaultValue={filters.leadType ?? ""}>
            <option value="">Both</option>
            <option value="exclusive">Exclusive</option>
            <option value="shared">Shared</option>
          </Select>
        </Field>
        <Field id="source" label="Source">
          <Select name="source" defaultValue={filters.source ?? ""}>
            <option value="">Any source</option>
            {Object.entries(SOURCE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
        <LinkButton href="/portal/marketplace" variant="ghost">
          Clear filters
        </LinkButton>
      </div>
    </form>
  );
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const filters = parseMarketplaceFilters(await searchParams);
  const [listings, buyer] = await Promise.all([listAvailable({ userId: user.id, companyId: membership.companyId }, filters), loadBuyer(membership)]);
  const blocked = blockedReason(buyer);
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={item.label}
        description="Move requests that name your company, with the price you would pay to buy each one. Contact details unlock after purchase."
        size="portal"
        actions={
          <LinkButton href={`/portal/marketplace${filterQuery(filters)}`} variant="secondary">
            Refresh
          </LinkButton>
        }
      />

      <Card padding="md">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="type-small text-text-3">Account credit available</dt>
            <dd className="type-h4 tabular">
              <Money cents={buyer.availableCreditCents} />
            </dd>
          </div>
          <div>
            <dt className="type-small text-text-3">Payment method</dt>
            <dd>
              {buyer.paymentMethod ? (
                <span className="tabular">
                  {buyer.paymentMethod.brand ?? "Card"} •••• {buyer.paymentMethod.last4 ?? "----"}
                </span>
              ) : (
                <Link href="/portal/billing" className="link">
                  Add a payment method
                </Link>
              )}
            </dd>
          </div>
          <div>
            <dt className="type-small text-text-3">Updates</dt>
            <dd>
              <LiveAvailability groupIds={listings.map((l) => l.groupId)} />
            </dd>
          </div>
        </dl>
      </Card>

      {blocked ? <Alert tone="warning">{blocked}</Alert> : null}

      <details className="expandable group rounded-card border border-border bg-surface p-5 shadow-e1" open={hasFilters}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
          <span>Filters{hasFilters ? " (on)" : ""}</span>
          <span aria-hidden="true" className="expandable-chevron inline-grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-border-strong text-text-2 group-hover:bg-surface-2">
            <ChevronDownIcon size={18} />
          </span>
        </summary>
        <div className="mt-4">
          <Filters filters={filters} />
        </div>
      </details>

      <p className="type-small text-text-3">
        Only movers the customer saw named and agreed to can buy a request. For shared requests the credit policy is a proposal awaiting
        owner approval.
      </p>

      {listings.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No requests match these filters" : "No requests are available right now"}
          description={
            hasFilters
              ? "Clear the filters to see every request that names your company."
              : "New requests appear here when customers moving in your coverage area choose your company. Check your coverage to reach more moves."
          }
          action={
            hasFilters ? (
              <LinkButton href="/portal/marketplace" variant="secondary">
                Clear filters
              </LinkButton>
            ) : (
              <LinkButton href="/portal/coverage" variant="secondary">
                Edit coverage
              </LinkButton>
            )
          }
        />
      ) : (
        <ul className="grid gap-4" aria-label="Available requests">
          {listings.map((listing) => (
            <li key={listing.groupId}>
              <LeadCard listing={listing} detailHref={`/portal/marketplace/${listing.groupId}`} action={<PurchaseDialog {...dialogProps(listing, buyer)} />} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
