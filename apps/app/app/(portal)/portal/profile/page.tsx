import { requireMembership } from "@amc/server/auth";
import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";
import { portalNavItem } from "@/lib/nav/portal";

const item = portalNavItem("/portal/profile");

export const metadata: Metadata = { title: item.label };

/** Placeholder: the company onboarding slice (S5) builds this page. */
export default async function ProfilePage() {
  await requireMembership({ roles: item.roles });
  return <SectionPlaceholder title={item.label} description={item.description} />;
}
