import { requireAdmin } from "@amc/server/auth";
import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/mailbox");

export const metadata: Metadata = { title: `${item.label} · Admin` };

/** Placeholder: the admin and operations slice (S7) builds this page. */
export default async function MailboxPage() {
  await requireAdmin({ roles: item.roles });
  return <SectionPlaceholder title={item.label} description={item.description} />;
}
