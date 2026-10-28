/**
 * Marketplace preview card (VD §9.6). Shows only the allow-listed preview (lead lifecycle §5):
 * first name, cities and states (ZIP only when allowed), move date, size, type, source, time,
 * exclusive or shared, buyer count, this company's price and the credit policy.
 */
import type { MarketplaceListing } from "@amc/server/marketplace";
import { AbsoluteDate, Card, Chip, LineIcon, Money } from "@amc/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { MOVE_SIZE_LABELS, MOVE_TYPE_LABELS, SERVICE_LABELS, SOURCE_LABELS, creditPolicySentence, label, ordinal, percent } from "./labels";

function BuyerMeter({ count, max }: { count: number; max: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-2 w-4 rounded-pill ${i < count ? "bg-primary" : "bg-surface-3 shadow-[inset_0_0_0_1px_var(--border-strong)]"}`} />
        ))}
      </span>
      <span className="type-small tabular text-text-2">
        {count} of {max} {max === 1 ? "buyer" : "buyers"}
      </span>
    </span>
  );
}

const place = (p: { city: string; state: string; zip: string | null }) => `${p.city}, ${p.state}${p.zip ? ` ${p.zip}` : ""}`;

export function priceExplanation(listing: MarketplaceListing): string {
  const { price } = listing;
  if (price.leadType === "exclusive") return "Your exclusive price.";
  if (price.position === 1) return "Your shared price as the first buyer (100%).";
  return `Your shared price ${formatCents(price.listCents)} × ${percent(price.factorBp)} as the ${ordinal(price.position)} buyer.`;
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function LeadFacts({ listing }: { listing: MarketplaceListing }) {
  const p = listing.preview;
  return (
    <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-3 rounded-control bg-surface-2/70 p-3 sm:grid-cols-4 sm:p-4">
      <div>
        <dt className="type-small text-text-3">Move date</dt>
        <dd className="tabular">
          {p.moveDate ? <AbsoluteDate value={p.moveDate} /> : "Not given"}
          {p.moveDateFlexible ? " (flexible)" : ""}
        </dd>
      </div>
      <div>
        <dt className="type-small text-text-3">Size</dt>
        <dd>{label(MOVE_SIZE_LABELS, p.moveSize)}</dd>
      </div>
      <div>
        <dt className="type-small text-text-3">Move type</dt>
        <dd>{label(MOVE_TYPE_LABELS, listing.moveType)}</dd>
      </div>
      <div>
        <dt className="type-small text-text-3">Source</dt>
        <dd>{label(SOURCE_LABELS, p.sourceCategory)}</dd>
      </div>
      {listing.services.length ? (
        <div className="col-span-2 sm:col-span-4">
          <dt className="type-small text-text-3">Services</dt>
          <dd>{listing.services.map((s) => label(SERVICE_LABELS, s)).join(", ")}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function LeadCard({ listing, action, detailHref }: { listing: MarketplaceListing; action: ReactNode; detailHref?: string }) {
  const p = listing.preview;
  return (
    <Card as="article" aria-labelledby={`lead-${listing.groupId}`} className="overflow-hidden transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-e2">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:gap-8">
        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Chip tone={p.leadType === "exclusive" ? "exclusive" : "shared"}>{p.leadType === "exclusive" ? "Exclusive" : "Shared"}</Chip>
            <BuyerMeter count={p.buyerCount} max={p.maxBuyers} />
            <span className="type-small text-text-3">
              Received <AbsoluteDate value={p.createdAt} withTime />
            </span>
          </div>
          <h2 id={`lead-${listing.groupId}`} className="font-display text-[1.375rem] font-bold leading-snug tracking-[-0.02em]">
            {detailHref ? (
              <Link href={detailHref} className="link">
                {p.firstName}: {place(p.origin)} to {place(p.destination)}
              </Link>
            ) : (
              <>
                {p.firstName}: {place(p.origin)} to {place(p.destination)}
              </>
            )}
          </h2>
          <LeadFacts listing={listing} />
          <p className="flex items-center gap-2 type-small text-text-3"><LineIcon name="lock" size={15} className="shrink-0" />Phone, email and last name unlock after purchase.</p>
        </div>
        <div className="grid content-start gap-2 border-t border-border pt-5 lg:w-60 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-3">Your price</p>
          <p className="font-display text-[2rem] font-bold leading-none tracking-[-0.04em] tabular">
            <Money cents={listing.price.chargeCents} />
          </p>
          <p className="type-small text-text-2">{priceExplanation(listing)}</p>
          {p.leadType === "shared" ? (
            <p className="type-small text-text-3">
              Proposed policy, pending approval: {creditPolicySentence(listing.policyFactorsBp.slice(0, p.maxBuyers))}
            </p>
          ) : (
            <p className="type-small text-text-3">Only one mover can buy an exclusive request.</p>
          )}
          <p className="type-small text-text-3">
            Available until <AbsoluteDate value={listing.expiresAt} withTime />
          </p>
          {action}
        </div>
      </div>
    </Card>
  );
}
