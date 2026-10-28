import { InfoIcon } from "@amc/ui";

/** The one discreet preview notice (build plan §8), shown as a quiet line at the foot of the portals and auth pages. A labeled section, so it is a landmark region. */
export function PreviewStrip() {
  return (
    <section className="border-t border-border bg-surface-2 text-text-3" aria-label="Preview notice">
      <p className="mx-auto flex max-w-portal items-center gap-2 py-2.5 gutter type-legal">
        <InfoIcon size={14} className="shrink-0" />
        <span>Preview build. Not launched; drafts await owner and counsel review. Companies shown are fictional demo data.</span>
      </p>
    </section>
  );
}
