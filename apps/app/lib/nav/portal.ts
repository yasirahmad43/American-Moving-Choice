/**
 * Company portal navigation (build plan §11): every portal route the slices build, so they add
 * pages without touching the shared layout. Roles follow the permission matrix in data-model §2.
 * Each page should still call requireMembership({ roles }) with the same roles.
 */
import type { CompanyRole } from "@amc/server/auth";

export interface PortalNavItem {
  href: string;
  label: string;
  /** One sentence for the section's placeholder and page intro. */
  description: string;
  roles: readonly CompanyRole[];
  /** Build-plan slice that owns the route. */
  slice: "F" | "S3" | "S5" | "S6";
}

export interface PortalNavSection {
  title: string;
  items: PortalNavItem[];
}

const ALL: readonly CompanyRole[] = ["owner", "manager", "agent", "billing"];
const SALES: readonly CompanyRole[] = ["owner", "manager", "agent"];
const MANAGERS: readonly CompanyRole[] = ["owner", "manager"];

export const PORTAL_NAV: PortalNavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/portal", label: "Dashboard", description: "Your company's status, recent requests and what needs attention.", roles: ALL, slice: "S5" },
    ],
  },
  {
    title: "Requests",
    items: [
      { href: "/portal/marketplace", label: "Marketplace", description: "Move requests that match your coverage, with the price to buy each one.", roles: SALES, slice: "S6" },
      { href: "/portal/leads", label: "Purchased requests", description: "Requests you bought, with the customer's contact details.", roles: SALES, slice: "S6" },
      { href: "/portal/pipeline", label: "Pipeline", description: "Track each purchased request from first contact to booked move.", roles: SALES, slice: "S6" },
    ],
  },
  {
    title: "Your company",
    items: [
      { href: "/portal/profile", label: "Profile", description: "Your public profile in the mover directory: description, services and photos.", roles: MANAGERS, slice: "S5" },
      { href: "/portal/coverage", label: "Coverage", description: "Where you move people, which move types and sizes, and which services.", roles: MANAGERS, slice: "S5" },
      { href: "/portal/rates", label: "Rate card", description: "The rates that feed the public cost calculator's planning ranges.", roles: MANAGERS, slice: "S3" },
      { href: "/portal/reviews", label: "Reviews", description: "Reviews of your company, your public responses and review requests.", roles: MANAGERS, slice: "S6" },
      { href: "/portal/verification", label: "Verification", description: "Your credentials, what we checked and when, and documents to upload.", roles: MANAGERS, slice: "S5" },
      { href: "/portal/application", label: "Application", description: "Your application to join the network and its progress.", roles: MANAGERS, slice: "S5" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/portal/billing", label: "Billing", description: "Payment methods, charges, credits, receipts and disputes.", roles: ["owner", "manager", "billing"], slice: "S6" },
      { href: "/portal/team", label: "Team", description: "Invite teammates and manage their roles.", roles: MANAGERS, slice: "S5" },
      { href: "/portal/settings", label: "Settings", description: "Your sign-in, two-step verification and notification preferences.", roles: ALL, slice: "S5" },
    ],
  },
];

/** The sections a role can see (empty sections dropped). */
export function portalNavFor(role: CompanyRole): PortalNavSection[] {
  return PORTAL_NAV.map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(role)) })).filter(
    (section) => section.items.length > 0,
  );
}

export function portalNavItem(href: string): PortalNavItem {
  const item = PORTAL_NAV.flatMap((section) => section.items).find((entry) => entry.href === href);
  if (!item) throw new Error(`No portal navigation entry for ${href}`);
  return item;
}
