/**
 * Admin navigation (build plan §11, slice S7; MVP scope M10). Every admin route is listed here so
 * the admin slice adds pages without touching the shared layout. super_admin sees everything;
 * other roles see the sections their work needs. Each page should still call
 * requireAdmin({ roles }) with the same roles.
 */
import type { AdminRole } from "@amc/server/auth";

export interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  roles: readonly AdminRole[];
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

const EVERY_ADMIN: readonly AdminRole[] = ["super_admin", "ops", "verification", "finance", "content_editor", "moderator", "support"];

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", description: "Queues, open cases and today's activity.", roles: EVERY_ADMIN }],
  },
  {
    title: "Network",
    items: [
      { href: "/admin/verification", label: "Verification queue", description: "Applications and rechecks waiting for a reviewer, with the evidence for each check.", roles: ["super_admin", "ops", "verification"] },
      { href: "/admin/companies", label: "Companies", description: "Every company, its status history, credentials, coverage and team.", roles: ["super_admin", "ops", "verification", "support"] },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/leads", label: "Requests", description: "Consumer requests with validation results, consent records, duplicates and expiry.", roles: ["super_admin", "ops", "support"] },
      { href: "/admin/purchases", label: "Purchases", description: "Purchases, disclosures and the ledger entries behind each one.", roles: ["super_admin", "ops", "finance"] },
      { href: "/admin/billing", label: "Billing", description: "Refunds, credits, adjustments, lead-quality claims and disputes.", roles: ["super_admin", "finance"] },
      { href: "/admin/pricing", label: "Pricing and policies", description: "Company prices, sharing policy versions and the maximum sharing limit.", roles: ["super_admin", "finance"] },
    ],
  },
  {
    title: "Trust and safety",
    items: [
      { href: "/admin/reviews", label: "Reviews", description: "Review moderation, evidence checks, reports and appeals.", roles: ["super_admin", "moderator", "ops"] },
      { href: "/admin/cases", label: "Cases", description: "Reports of broker activity, credential problems, misconduct and privacy requests.", roles: ["super_admin", "ops", "support", "moderator", "verification"] },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/mailbox", label: "Mailbox", description: "Every email and text the platform queued; in demo mode nothing leaves the system.", roles: ["super_admin", "ops", "support"] },
      { href: "/admin/jobs", label: "Jobs", description: "Scheduled job runs: rechecks, expiries, invitations and outbox delivery.", roles: ["super_admin", "ops"] },
      { href: "/admin/settings", label: "Settings", description: "Platform settings such as the sale window and local move radius.", roles: ["super_admin"] },
      { href: "/admin/audit-log", label: "Audit log", description: "Every admin decision, settings change and security event.", roles: ["super_admin", "ops"] },
      { href: "/admin/users", label: "Admin users", description: "Admin accounts and their roles.", roles: ["super_admin"] },
    ],
  },
];

const allows = (roles: readonly AdminRole[], role: AdminRole) => role === "super_admin" || roles.includes(role);

export function adminNavFor(role: AdminRole): AdminNavSection[] {
  return ADMIN_NAV.map((section) => ({ ...section, items: section.items.filter((item) => allows(item.roles, role)) })).filter(
    (section) => section.items.length > 0,
  );
}

export function adminNavItem(href: string): AdminNavItem {
  const item = ADMIN_NAV.flatMap((section) => section.items).find((entry) => entry.href === href);
  if (!item) throw new Error(`No admin navigation entry for ${href}`);
  return item;
}
