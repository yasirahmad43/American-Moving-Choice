import { requireAdmin } from "@amc/server/auth";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { adminNavFor } from "@/lib/nav/admin";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  ops: "Operations",
  verification: "Verification",
  finance: "Finance",
  content_editor: "Content editor",
  moderator: "Moderator",
  support: "Support",
};

/**
 * Admin layout: admins only, past two-step verification (requireAdmin enforces both). Pages and
 * actions check their own admin roles too.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, adminRole } = await requireAdmin();
  const sections = adminNavFor(adminRole).map((section) => ({
    title: section.title,
    items: section.items.map(({ href, label }) => ({ href, label })),
  }));
  return (
    <AppShell
      areaLabel="Admin"
      rootHref="/admin"
      sections={sections}
      userLabel={user.email}
      context={<span className="font-semibold text-text">{ROLE_LABELS[adminRole] ?? adminRole}</span>}
    >
      {children}
    </AppShell>
  );
}
