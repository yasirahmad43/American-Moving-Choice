/**
 * Public-site navigation and footer links (build plan §8; site architecture §2.1). Paths end with
 * a slash because the site uses trailingSlash. The same public route registry drives the
 * menus, footer, HTML catalog and core XML sitemap, so new pages cannot disappear between them.
 */

export interface NavLink {
  href: string;
  label: string;
}

export interface PublicNavGroup {
  id: string;
  label: string;
  description: string;
  links: NavLink[];
}

/** Public destinations only. Never add private request links, profiles or retired redirects. */
export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  { id: "move", label: "Plan your move", description: "From your first box to your next front door.", links: [
    { href: "/get-quotes/", label: "Get moving quotes" },
    { href: "/movers/", label: "Moving by state & city" },
    { href: "/routes/", label: "Moving routes" },
    { href: "/services/", label: "Moving services" },
    { href: "/planning/", label: "Moving checklists" },
    { href: "/questions/", label: "Moving questions" },
  ] },
  { id: "cost", label: "Costs & tools", description: "Make room in your plan for the real costs.", links: [
    { href: "/moving-costs/", label: "Moving cost guides" },
    { href: "/moving-cost-calculator/", label: "Moving cost calculator" },
    { href: "/moving-costs/how-movers-charge/", label: "How movers charge" },
    { href: "/moving-cost-calculator/method/", label: "How the calculator works" },
  ] },
  { id: "trust", label: "How we work", description: "Know the process before you share your details.", links: [
    { href: "/how-we-verify-movers/", label: "How we verify movers" },
    { href: "/verify-a-mover/", label: "Verify a mover" },
    { href: "/movers-vs-brokers/", label: "Movers vs brokers" },
    { href: "/which-companies-receive-my-request/", label: "Who receives your request" },
    { href: "/review-methodology/", label: "How reviews work" },
    { href: "/editorial-policy/", label: "Editorial policy" },
  ] },
  { id: "help", label: "About & support", description: "A real answer when you need a little direction.", links: [
    { href: "/about/", label: "About American Moving Choice" },
    { href: "/contact/", label: "Contact us" },
    { href: "/complaints/", label: "Complaints & help" },
    { href: "/report-a-concern/", label: "Report a concern" },
  ] },
  { id: "legal", label: "Policies", description: "Your information. Your choices.", links: [
    { href: "/privacy/", label: "Privacy policy" },
    { href: "/terms/", label: "Terms of use" },
  ] },
];

export const PUBLIC_STATIC_LINKS: NavLink[] = [
  { href: "/", label: "American Moving Choice home" },
  { href: "/explore/", label: "All moving guides & pages" },
  ...PUBLIC_NAV_GROUPS.flatMap((group) => group.links),
];

export const GUIDE_FAMILIES = [
  { id: "state", label: "State guides", short: "States", href: "/movers/", description: "Start with the place you call home." },
  { id: "city", label: "City guides", short: "Cities", href: "/explore/?type=city", description: "Local details for your next chapter." },
  { id: "route", label: "Moving routes", short: "Routes", href: "/routes/", description: "A little perspective on the miles ahead." },
  { id: "service", label: "Moving services", short: "Services", href: "/services/", description: "Find the right help for your move." },
  { id: "cost", label: "Moving costs", short: "Costs", href: "/moving-costs/", description: "Know what goes into the price." },
  { id: "question", label: "Moving questions", short: "Questions", href: "/questions/", description: "Clear answers before moving day." },
  { id: "planning", label: "Moving checklists", short: "Checklists", href: "/planning/", description: "A calmer move starts with a plan." },
  { id: "zip", label: "ZIP code guides", short: "ZIP codes", href: "/explore/?type=zip", description: "A closer look at your neighborhood." },
] as const;

/** Header navigation, in order. "Get quotes" renders as the header CTA. */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/moving-costs/", label: "Moving costs" },
  { href: "/planning/", label: "Moving guides" },
  { href: "/#how-it-works", label: "How it works" },
];

export const GET_QUOTES: NavLink = { href: "/get-quotes/", label: "Get quotes" };

export const TRUST_LINKS: NavLink[] = [
  { href: "/how-we-verify-movers/", label: "How we verify movers" },
  { href: "/movers-vs-brokers/", label: "Movers vs brokers" },
  { href: "/which-companies-receive-my-request/", label: "Which companies receive my request" },
  { href: "/review-methodology/", label: "Review methodology" },
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
  "Preview build. Not launched; drafts await owner and counsel review. Requests and transactions use fictional demo data.";

/** Attribution the GeoNames licence (CC BY 4.0) requires for the ZIP data (build plan §7.1). */
export const GEONAMES_CREDIT = {
  sourceUrl: "https://www.geonames.org/",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;
