import { requireMembership } from "@amc/server/auth";
import { ZIP_RADIUS_OPTIONS, listAvailable, parseMarketplaceFilters, type MarketplaceFilters } from "@amc/server/marketplace";
import { AbsoluteDate, Alert, Button, Card, ChevronDownIcon, Chip, EmptyState, Field, Input, LineIcon, LinkButton, Money, PageHeader, Select, Table, cx } from "@amc/ui";
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

function Filters({ filters, view }: { filters: MarketplaceFilters; view: "cards" | "list" }) {
  return (
    <form method="get" action="/portal/marketplace" className="grid gap-4" aria-label="Filter requests">
      {view === "list" ? <input type="hidden" name="view" value="list" /> : null}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-text-3">Route and coverage</legend>
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field id="scope" label="Area">
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
        </div>
        <p className="mt-3 type-small text-text-3">Nationwide shows every request that names your company. State and ZIP filters narrow those routes.</p>
      </fieldset>
      <fieldset className="min-w-0 border-0 border-t border-border pt-4">
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-text-3">Move details</legend>
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </fieldset>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button type="submit">
          <LineIcon name="filter" size={16} />Apply filters
        </Button>
        <LinkButton href={view === "list" ? "/portal/marketplace?view=list" : "/portal/marketplace"} variant="ghost">
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
  const sp = await searchParams;
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "list" ? "list" : "cards";
  const query = filterQuery(filters);
  const viewHref = (v: "cards" | "list") => `/portal/marketplace${query}${v === "list" ? (query ? "&" : "?") + "view=list" : ""}`;
  const appliedCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={item.label}
        overline="New opportunities"
        description="Move requests matched to your company, with the price you would pay to buy each one. Contact details unlock after purchase."
        size="portal"
        actions={
          <>
            <nav aria-label="View" className="inline-flex rounded-pill border border-border bg-surface p-0.5 shadow-[var(--edge-light)]">
              {(["cards", "list"] as const).map((v) => (
                <Link
                  key={v}
                  href={viewHref(v)}
                  aria-current={view === v ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3.5 text-[0.875rem] font-semibold no-underline transition-colors duration-[var(--d1)]",
                    view === v ? "bg-primary text-on-primary" : "text-text-2 hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <LineIcon name={v === "cards" ? "grid" : "list"} size={16} />
                  {v === "cards" ? "Cards" : "List"}
                </Link>
              ))}
            </nav>
            <LinkButton href={viewHref(view)} variant="secondary">
              <LineIcon name="clock" size={16} />Refresh
            </LinkButton>
          </>
        }
      />

      <Card padding="md" className="border-t-[3px] border-t-brand-navy">
        <dl className="grid gap-5 sm:grid-cols-3">
          <div className="grid content-start gap-2">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-text-3"><LineIcon name="money" size={15} />Available credit</dt>
            <dd className="font-display text-2xl font-bold tracking-tight tabular">
              <Money cents={buyer.availableCreditCents} />
            </dd>
          </div>
          <div className="grid content-start gap-2 sm:border-l sm:border-border sm:pl-5">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-text-3"><LineIcon name="lock" size={15} />Payment method</dt>
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
          <div className="grid content-start gap-2 sm:border-l sm:border-border sm:pl-5">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-text-3"><LineIcon name="clock" size={15} />Availability</dt>
            <dd>
              <LiveAvailability groupIds={listings.map((l) => l.groupId)} />
            </dd>
          </div>
        </dl>
      </Card>

      {blocked ? <Alert tone="warning">{blocked}</Alert> : null}

      <details className="expandable group rounded-card border border-border bg-surface p-5 shadow-e1" open={hasFilters}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
          <span className="flex flex-wrap items-center gap-2"><LineIcon name="filter" size={18} />Filter requests{hasFilters ? <span className="rounded-pill bg-info-bg px-2 py-0.5 text-xs font-bold tabular text-info-text">{appliedCount} active</span> : null}</span>
          <span aria-hidden="true" className="expandable-chevron inline-grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-border-strong text-text-2 group-hover:bg-surface-2">
            <ChevronDownIcon size={18} />
          </span>
        </summary>
        <div className="mt-4">
          <Filters filters={filters} view={view} />
        </div>
      </details>

      <p className="flex items-start gap-2 type-small text-text-3"><LineIcon name="info" size={16} className="mt-0.5 shrink-0" /><span>
        Only companies recorded as eligible for a request can buy it, within the customer's contact limit and preferences. For shared requests the credit policy is a proposal awaiting
        owner approval.</span>
      </p>

      {listings.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No requests match these filters" : "No requests are available right now"}
          description={
            hasFilters
              ? "Clear the filters to see every request that names your company."
              : "New requests appear here when customers moving in your coverage area choose your company. Check your coverage to reach more moves."
          }
          icon="megaphone"
          action={
            hasFilters ? (
              <LinkButton href={view === "list" ? "/portal/marketplace?view=list" : "/portal/marketplace"} variant="secondary">
                Clear filters
              </LinkButton>
            ) : (
              <LinkButton href="/portal/coverage" variant="secondary">
                Edit coverage
              </LinkButton>
            )
          }
        />
      ) : view === "list" ? (
        <Table
          id="marketplace-requests"
          caption="Available requests"
          rows={listings}
          rowKey={(l) => l.groupId}
          sortable
          defaultSort={{ key: "received", dir: "descending" }}
          columns={[
            {
              key: "customer",
              header: "Customer",
              cell: (l) => (
                <Link href={`/portal/marketplace/${l.groupId}`} className="link font-semibold">
                  {l.preview.firstName}
                </Link>
              ),
            },
            { key: "route", header: "Route", cell: (l) => <span className="grid gap-1"><span>{l.preview.origin.city}, {l.preview.origin.state}</span><span className="flex items-center gap-1 text-text-3"><LineIcon name="arrow-right" size={13} />{l.preview.destination.city}, {l.preview.destination.state}</span></span> },
            { key: "date", header: "Move", mobileLabel: "Move date & size", cell: (l) => <span className="grid gap-1"><span>{l.preview.moveDate ? <AbsoluteDate value={l.preview.moveDate} /> : "Date not given"}</span><span className="type-small text-text-3">{l.preview.moveSize ? MOVE_SIZE_LABELS[l.preview.moveSize] ?? l.preview.moveSize : "Size not given"}</span></span> },
            { key: "type", header: "Type & source", cell: (l) => <span className="grid justify-items-start gap-1.5"><Chip tone={l.preview.leadType === "exclusive" ? "exclusive" : "shared"}>{l.preview.leadType === "exclusive" ? "Exclusive" : "Shared"}</Chip><span className="type-small text-text-3">{SOURCE_LABELS[l.preview.sourceCategory] ?? l.preview.sourceCategory}</span></span> },
            { key: "buyers", header: "Buyers", numeric: true, sortValue: (l) => l.preview.buyerCount, bar: (l) => l.preview.buyerCount / Math.max(1, l.preview.maxBuyers), cell: (l) => `${l.preview.buyerCount} of ${l.preview.maxBuyers}` },
            { key: "price", header: "Your price", numeric: true, sortValue: (l) => l.price.chargeCents, cell: (l) => <Money cents={l.price.chargeCents} /> },
            { key: "received", header: "Received", sortValue: (l) => String(l.preview.createdAt), cell: (l) => <span className="grid gap-1"><AbsoluteDate value={l.preview.createdAt} withTime /><span className="type-small text-text-3">Until <AbsoluteDate value={l.expiresAt} withTime /></span></span> },
          ]}
          actions={(l) => (
            <LinkButton href={`/portal/marketplace/${l.groupId}`} variant="secondary" size="sm">
              Preview and buy
            </LinkButton>
          )}
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
