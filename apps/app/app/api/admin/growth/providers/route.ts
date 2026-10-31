import { reportingSnapshot } from "@amc/server/reporting";
import { growthAccess, growthHeaders } from "@/lib/admin/growth-access";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request): Promise<Response> {
  try {
    const denied = await growthAccess(request, "providers");
    if (denied) return denied;
    return Response.json(await reportingSnapshot(), { headers: growthHeaders });
  } catch {
    console.error("[growth] provider report unavailable");
    return Response.json({ error: "unavailable" }, { status: 503, headers: growthHeaders });
  }
}
