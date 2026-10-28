import { AbsoluteDate, Chip, IdCardIcon } from "@amc/ui";
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

/** Directory card (VD §9.5): name, chips, badge and explainer, verification line, ratings, services, coverage. */
export function CompanyCard({ listing, headingLevel = "h3" }: { listing: Listing; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const services = listing.services.slice(0, 3);
  const extra = listing.services.length - services.length;
  const headingId = `company-${listing.slug}`;
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-e1" aria-labelledby={headingId}>
      <div className="grid gap-2">
        <Heading id={headingId} className="type-h4 text-text">
          <Link href={`/companies/${listing.slug}/`} className="link text-text">
            {listing.displayName}
          </Link>
        </Heading>
        <StatusChips isDemo={listing.isDemo} isNew={listing.isNew} joinedAt={listing.joinedAt} />
      </div>
      {listing.badge ? <BadgeWithExplainer verifiedDate={listing.badge.verifiedDate} usdot={listing.usdot} idSuffix={listing.slug} /> : null}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 type-small text-text-2">
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
      <CoverageSummary listing={listing} limit={2} />
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        <RequestQuoteButton companyId={listing.companyId} slug={listing.slug} displayName={listing.displayName} size="sm" />
        <Link href={`/companies/${listing.slug}/`} className="link inline-flex min-h-11 items-center type-small">
          View profile<span className="sr-only">: {listing.displayName}</span>
        </Link>
      </div>
    </li>
  );
}
