import { growthSnapshot } from "@amc/server/admin";
import { growthAccess, growthHeaders } from "@/lib/admin/growth-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const denied = await growthAccess(request, "requests");
    if (denied) return denied;
    const touch = new URL(request.url).searchParams.get("touch") ?? "last";
    if (touch !== "first" && touch !== "last") return Response.json({ error: "invalid_touch" }, { status: 400, headers: growthHeaders });
    return Response.json(await growthSnapshot({ touch }), { headers: growthHeaders });
  } catch {
    console.error("[growth] request report unavailable");
    return Response.json({ error: "unavailable" }, { status: 503, headers: growthHeaders });
  }
}
