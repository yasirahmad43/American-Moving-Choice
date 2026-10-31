import { headers } from "next/headers";
import { publicClientIp } from "./guards";

/** Scoped to anonymous forms; auth/session metadata and middleware are intentionally separate. */
export async function publicRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const agent = h.get("user-agent")?.replace(/[\u0000-\u001f\u007f]/gu, "").slice(0, 512) ?? null;
  return { ip: publicClientIp(h, process.env.VERCEL === "1"), userAgent: agent || null };
}
