/** Layout primitives (VD §7, §9.10): containers, sections, page headers, breadcrumbs, skip link. */
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../cx";

export type ContainerSize = "reading" | "content" | "portal" | "full";

const containerSizes: Record<ContainerSize, string> = {
  reading: "max-w-reading",
  content: "max-w-content",
  portal: "max-w-portal",
  full: "max-w-none",
};

/** Centered column with the responsive side gutter (16 / 24 / 32px). */
export function Container({
  size = "content",
  as: Tag = "div",
  className,
  children,
}: {
  size?: ContainerSize;
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cx("mx-auto w-full gutter", containerSizes[size], className)}>{children}</Tag>;
}

export type SectionTone = "default" | "alt" | "band";

/**
 * A page section with the fluid section padding. Separate sections by a background change or a
 * hairline, not both (VD §7). "band" is the navy band: white text and the light focus ring.
 */
export function Section({
  tone = "default",
  hairline = false,
  className,
  containerSize = "content",
  children,
  ...rest
}: {
  tone?: SectionTone;
  hairline?: boolean;
  className?: string;
  containerSize?: ContainerSize;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      {...(tone === "band" ? { "data-band": "" } : {})}
      className={cx(
        "section-pad",
        tone === "alt" && "bg-surface-2",
        tone === "band" && "bg-band text-on-band",
        hairline && tone === "default" && "border-t border-border",
        className,
      )}
      {...rest}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

/** Visible breadcrumb trail; the last item is the current page. */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 type-small text-text-2">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="link">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-text" : undefined}>
                  {item.label}
                </span>
              )}
              {!last ? (
                <span aria-hidden="true" className="text-text-3">
                  ›
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The page's single H1, with optional overline, description, actions and breadcrumbs. */
export function PageHeader({
  title,
  overline,
  description,
  actions,
  breadcrumbs,
  size = "page",
  className,
}: {
  title: ReactNode;
  overline?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** "page" for public inner pages (display-l), "portal" for denser portal headings. */
  size?: "page" | "portal";
  className?: string;
}) {
  return (
    <header className={cx("grid gap-3", size === "portal" && "border-b border-border pb-5", className)}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-[68ch]">
          {overline ? (
            <p className="mb-2 flex items-center gap-3 type-overline text-text-2">
              <span aria-hidden="true" className="h-px w-6 bg-brand-red" />
              {overline}
            </p>
          ) : null}
          <h1 className={cx("text-text", size === "page" ? "type-display-l" : "type-display-l !text-[clamp(1.625rem,1.3rem+1vw,2rem)]")}>{title}</h1>
          {description ? <div className={cx("mt-2 text-text-2", size === "page" && "type-lede")}>{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** First focusable element on every page: jumps to <main id="main">. */
export function SkipLink({ href = "#main", children = "Skip to main content" }: { href?: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      className="absolute left-2 -top-16 z-50 rounded-control bg-primary px-4 py-3 font-semibold text-on-primary no-underline focus:top-2"
    >
      {children}
    </a>
  );
}
