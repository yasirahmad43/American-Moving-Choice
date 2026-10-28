/**
 * One mover as the survey and the request pages name it: display name, USDOT number and, when
 * the profile is live, a link to it (opens in a new tab so the survey keeps its place). No prices
 * and no phone numbers (implications §2.2). Demo companies carry no public chip: the site-wide
 * preview notice in the footer covers the demo data.
 */
import { ExternalLinkIcon, formatAbsoluteDate } from "@amc/ui";

export interface MoverNameProps {
  displayName: string;
  usdotNumber: string | null;
  profileSlug: string | null;
  isDemo: boolean;
  /** Latest federal-record check, shown on What we found. */
  checkedAt?: string | null;
  showCheckDate?: boolean;
}

export function MoverName({ displayName, usdotNumber, profileSlug, checkedAt, showCheckDate }: MoverNameProps) {
  return (
    <div className="grid min-w-0 gap-1">
      <p className="font-semibold text-text">{displayName}</p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 type-small text-text-2">
        {usdotNumber ? <span className="tabular">USDOT {usdotNumber}</span> : null}
        {showCheckDate ? (
          <span className="tabular">
            {checkedAt ? `Federal record checked ${formatAbsoluteDate(checkedAt, { month: "long" })}` : "Check date not recorded"}
          </span>
        ) : null}
      </p>
      {profileSlug ? (
        <p className="type-small">
          <a href={`/companies/${profileSlug}/`} target="_blank" rel="noopener" className="link inline-flex items-center gap-1">
            View profile<span className="sr-only">: {displayName} (opens in a new tab)</span>
            <ExternalLinkIcon size={14} aria-hidden="true" />
          </a>
        </p>
      ) : null}
    </div>
  );
}
