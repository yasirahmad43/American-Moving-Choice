import { WarningIcon } from "@amc/ui";
import { PREVIEW_BANNER_TEXT } from "@/lib/site";

/** Shown on every page of the preview (build plan §8). It can't be dismissed. A labeled section, so it is a landmark region and no page content sits outside landmarks. */
export function PreviewBanner() {
  return (
    <section className="border-b border-border bg-warning-bg text-text" aria-label="Preview notice">
      <p className="mx-auto flex max-w-content items-start gap-2 py-2 gutter type-small">
        <WarningIcon size={18} className="mt-px shrink-0 text-warning" />
        <span>
          <strong className="font-semibold">Preview build.</strong> {PREVIEW_BANNER_TEXT.replace(/^Preview build\.\s*/, "")}
        </span>
      </p>
    </section>
  );
}
