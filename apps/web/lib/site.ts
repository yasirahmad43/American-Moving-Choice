/**
 * Public-site navigation and footer links (build plan §8; site architecture §2.1). Paths end with
 * a slash because the site uses trailingSlash. Some targets are built by later slices; until
 * then they return the site's 404 page.
 */

export interface NavLink {
  href: string;
  label: string;
}

/** Header navigation, in order. "Get quotes" renders as the header CTA. */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/moving-costs/", label: "Moving costs" },
  { href: "/directory/", label: "Mover directory" },
  { href: "/how-we-verify-movers/", label: "How we verify movers" },
  { href: "/for-movers/", label: "For movers" },
];

export const GET_QUOTES: NavLink = { href: "/get-quotes/", label: "Get quotes" };

/** Header link to the role-and-money page; it can't be dismissed (implications §3.4). */
export const MONEY_LINK: NavLink = { href: "/advertising-disclosure/", label: "How AMC makes money" };

export const TRUST_LINKS: NavLink[] = [
  { href: "/how-we-verify-movers/", label: "How we verify movers" },
  { href: "/movers-vs-brokers/", label: "Movers vs brokers" },
  { href: "/which-companies-receive-my-request/", label: "Which companies receive my request" },
  { href: "/review-methodology/", label: "Review methodology" },
  { href: "/advertising-disclosure/", label: "How AMC makes money" },
  { href: "/editorial-policy/", label: "Editorial policy" },
];

/** Hubs of the generated page families (site architecture §3.3: every page within 3 clicks of home). */
export const EXPLORE_LINKS: NavLink[] = [
  { href: "/movers/", label: "Movers by state" },
  { href: "/routes/", label: "Moving routes" },
  { href: "/services/", label: "Moving services" },
  { href: "/moving-costs/", label: "Moving costs" },
  { href: "/questions/", label: "Moving questions" },
  { href: "/planning/", label: "Planning checklists" },
];

export const HELP_LINKS: NavLink[] = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/complaints/", label: "Complaints" },
  { href: "/report-a-concern/", label: "Report a concern or a broker" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms of use" },
];

export const PREVIEW_BANNER_TEXT =
  "Preview build. Not launched; drafts await owner and counsel review. Companies shown are fictional demo data.";

/** Attribution the GeoNames licence (CC BY 4.0) requires for the ZIP data (build plan §7.1). */
export const GEONAMES_CREDIT = {
  sourceUrl: "https://www.geonames.org/",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;
