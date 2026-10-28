import { AbsoluteDate, Badge, Chip, CalendarIcon } from "@amc/ui";
import { fmcsaSnapshotUrl } from "@amc/server/verification";
import { StoredText, badgeName } from "./content";

/**
 * The screening badge with its ST-5 explainer in an adjacent <details> (VD §9.4; implications
 * §4.3). Renders nothing unless the badge is active and the latest federal checks passed.
 */
export function BadgeWithExplainer({ verifiedDate, usdot, idSuffix, compact = false }: { verifiedDate: Date; usdot: string | null; idSuffix: string; compact?: boolean }) {
  const name = badgeName();
  return (
    <div className="grid gap-2">
      <div>
        <Badge variant="preferred">
          {name}
          <span className="font-semibold text-on-primary/75"> · American Moving Choice</span>
        </Badge>
      </div>
      <details className={compact ? "group type-small" : "group rounded-control border border-border bg-surface-2 px-3 py-1 type-small"} id={`badge-explainer-${idSuffix}`}>
        <summary className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-[0.2em]">What this badge means</summary>
        <p className="pb-2 text-text">
          <StoredText
            id="ST-5"
            values={{ "badge.name": <strong>{name}</strong>, "company.verified_date": <AbsoluteDate value={verifiedDate} month="long" /> }}
            links={{
              ...(usdot ? { "This mover's FMCSA record": { href: fmcsaSnapshotUrl(usdot), external: true } } : {}),
              "How we verify movers": { href: "/how-we-verify-movers/#badge" },
            }}
          />
        </p>
      </details>
    </div>
  );
}

/**
 * "New to our network" chip (VD §9.4). Demo companies carry no public chip: the site-wide preview
 * notice in the footer covers the demo data; admin screens keep their own DemoChip.
 */
export function StatusChips({ isNew, joinedAt }: { isDemo?: boolean; isNew: boolean; joinedAt: Date | null }) {
  if (!isNew) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Chip tone="info" icon={<CalendarIcon size={14} />}>
        New to our network
        {joinedAt ? (
          <span className="font-semibold">
            {" "}
            · Joined {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "America/New_York" }).format(joinedAt)}
          </span>
        ) : null}
      </Chip>
    </div>
  );
}
