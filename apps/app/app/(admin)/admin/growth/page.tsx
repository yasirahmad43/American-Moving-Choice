import { requireAdmin } from "@amc/server/auth";
import { PageHeader } from "@amc/ui";
import { bingConnectionAvailable } from "@amc/server/reporting";
import type { Metadata } from "next";
import { GrowthDashboard, type BingConnectionNotice } from "@/components/admin/growth/growth-dashboard";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/growth");
export const metadata: Metadata = { title: "Growth & analytics · Admin" };

export default async function GrowthPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const connection = (await searchParams).connection;
  const connectionNotice: BingConnectionNotice | undefined = connection === "bing_connected" || connection === "bing_cancelled" || connection === "bing_failed" ? connection : undefined;
  const canConnectBing = adminRole === "super_admin" && bingConnectionAvailable();
  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader size="portal" overline="Your website, in focus" title={item.label} description={item.description} />
      <GrowthDashboard canConnectBing={canConnectBing} connectionNotice={connectionNotice} />
    </div>
  );
}
