import { requireAdmin } from "@amc/server/auth";
import { PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { GrowthDashboard } from "@/components/admin/growth/growth-dashboard";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/growth");
export const metadata: Metadata = { title: "Growth & analytics · Admin" };

export default async function GrowthPage() {
  await requireAdmin({ roles: item.roles });
  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader size="portal" overline="Your website, in focus" title={item.label} description={item.description} />
      <GrowthDashboard />
    </div>
  );
}
