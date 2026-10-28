import { AbsoluteDate, Chip, IdCardIcon, RouteMark } from "@amc/ui";
import { SERVICE_LABELS, type Listing } from "@amc/server/profiles";
import Link from "next/link";
import { BadgeWithExplainer, StatusChips } from "./badge-explainer";
import { CompactRatings } from "./ratings";
import { RequestQuoteButton } from "./request-quote-button";

/** "Based in" kept apart from "Serves" (site architecture §1.2). */
export function CoverageSummary({ listing, limit }: { listing: Listing; limit?: number }) {
  const serves = limit ? listing.coverage.serves.slice(0, limit) : listing.coverage.serves;
  const more = listing.coverage.serves.length - serves.length;
  return (
    <dl className="grid gap-1 type-small">
      {listing.basedIn ? (
        <div className="flex flex-wrap gap-x-1.5">
          <dt className="font-semibold text-text">Based in:</dt>
          <dd className="m-0 text-text-2">
            {listing.basedIn.city}, {listing.basedIn.stateName}
          </dd>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-1.5">
        <dt className="font-semibold text-text">Serves:</dt>
        <dd className="m-0 text-text-2">
          {serves.length ? serves.join("; ") : "No active coverage right now"}
          {more > 0 ? `; and ${more} more` : null}
        </dd>
      </div>
    </dl>
  );
}

/** Initials mark standing in for a company logo until the company uploads one (VD §9.5). */
function Monogram({ name }: { name: string }) {
  const initials = name
    .replace(/^Demo\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
  return (
    <span aria-hidden="true" className="inline-grid size-14 shrink-0 place-items-center rounded-control bg-surface-3 font-display text-[1.25rem] font-extrabold text-brand-navy ring-1 ring-border [font-stretch:85%]">
      {initials}
    </span>
  );
}

/** Directory card (VD §9.5): logo slot, name, chips, badge and explainer, verification line, ratings, services, coverage. */
export function CompanyCard({ listing, headingLevel = "h3" }: { listing: Listing; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const services = listing.services.slice(0, 3);
  const extra = listing.services.length - services.length;
  const headingId = `company-${listing.slug}`;
  return (
    <li className="lift relative flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-e1 sm:p-6" aria-labelledby={headingId}>
      <div className="flex items-start gap-4">
        <Monogram name={listing.displayName} />
        <div className="grid min-w-0 gap-1.5">
          <Heading id={headingId} className="type-h3 text-text">
            <Link href={`/companies/${listing.slug}/`} className="text-text no-underline after:absolute after:inset-0 after:rounded-card hover:underline">
              {listing.displayName}
            </Link>
          </Heading>
          <StatusChips isNew={listing.isNew} joinedAt={listing.joinedAt} />
        </div>
      </div>
      {listing.badge ? (
        <div className="relative z-[1]">
          <BadgeWithExplainer verifiedDate={listing.badge.verifiedDate} usdot={listing.usdot} idSuffix={listing.slug} compact />
        </div>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 type-small text-text-2">
        <IdCardIcon size={16} />
        {listing.usdot ? <span className="tabular">USDOT {listing.usdot}</span> : null}
        {listing.mcNumber ? <span className="tabular">· {listing.mcNumber}</span> : null}
        {listing.badge ? (
          <span>
            · Last checked <AbsoluteDate value={listing.badge.verifiedDate} />
          </span>
        ) : null}
      </p>
      <CompactRatings ratings={listing.ratings} />
      {services.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Services">
          {services.map((s) => (
            <li key={s}>
              <Chip tone="neutral">{SERVICE_LABELS[s]}</Chip>
            </li>
          ))}
          {extra > 0 ? (
            <li>
              <Chip tone="neutral">+{extra} more</Chip>
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="flex items-start gap-2">
        <RouteMark size={12} className="mt-1 shrink-0" />
        <CoverageSummary listing={listing} limit={2} />
      </div>
      <div className="relative z-[1] mt-auto flex flex-wrap items-center gap-3 pt-1">
        <RequestQuoteButton companyId={listing.companyId} slug={listing.slug} displayName={listing.displayName} size="sm" />
        <Link href={`/companies/${listing.slug}/`} className="link inline-flex min-h-11 items-center type-small">
          View profile<span className="sr-only">: {listing.displayName}</span>
        </Link>
      </div>
    </li>
  );
}
