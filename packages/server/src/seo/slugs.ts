/**
 * Slug rules for the programmatic pages (site architecture §2.2): lowercase ASCII, hyphens,
 * apostrophes removed, abbreviations kept as written ("st-petersburg", "ofallon").
 */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Words that can never be city slugs under /movers/{state}/ (site architecture §2.2). */
export const RESERVED_CITY_SLUGS = new Set(["long-distance", "local", "cost", "costs", "reviews", "page", "routes", "zip", "zips"]);

export const SEO_FAMILIES = ["state", "city", "zip", "route", "service", "cost", "question", "planning", "mover-profile"] as const;
export type SeoFamily = (typeof SEO_FAMILIES)[number];

export function isSeoFamily(value: string): value is SeoFamily {
  return (SEO_FAMILIES as readonly string[]).includes(value);
}

export const SEO_STATUSES = ["draft", "review", "ready", "published"] as const;
export type SeoStatus = (typeof SEO_STATUSES)[number];

/** A normalized keyword for the duplicate-intent check: lowercase, single spaces, no punctuation. */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A route slug "{origin}-to-{destination}" split on the first "-to-" that yields two known parts. */
export function splitRouteSlug(slug: string, known: (part: string) => boolean): { origin: string; destination: string } | null {
  const parts = slug.split("-to-");
  if (parts.length < 2) return null;
  for (let i = 1; i < parts.length; i++) {
    const origin = parts.slice(0, i).join("-to-");
    const destination = parts.slice(i).join("-to-");
    if (known(origin) && known(destination)) return { origin, destination };
  }
  return null;
}

export const URL_PREFIX: Record<SeoFamily, string> = {
  state: "/movers/",
  city: "/movers/",
  zip: "/movers/",
  route: "/routes/",
  service: "/services/",
  cost: "/moving-costs/",
  question: "/questions/",
  planning: "/planning/",
  "mover-profile": "/companies/",
};
