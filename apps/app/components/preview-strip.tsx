import { WarningIcon } from "@amc/ui";

/** The preview notice (build plan §8), also shown in the portals and on auth pages. A labeled section, so it is a landmark region. */
export function PreviewStrip() {
  return (
    <section className="border-b border-border bg-warning-bg text-text" aria-label="Preview notice">
      <p className="mx-auto flex max-w-portal items-start gap-2 py-2 gutter type-small">
        <WarningIcon size={18} className="mt-px shrink-0 text-warning" />
        <span>
          <strong className="font-semibold">Preview build.</strong> Not launched; drafts await owner and counsel review. Companies shown are
          fictional demo data.
        </span>
      </p>
    </section>
  );
}
