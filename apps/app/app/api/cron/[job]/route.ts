/**
 * Cron endpoint (build plan §9): Vercel Cron calls GET /api/cron/<job> once a day with
 * `Authorization: Bearer $CRON_SECRET` (apps/app/vercel.json). /api/cron/all runs every job in
 * order. Without CRON_SECRET configured every call is refused; a missing or wrong secret gets 401
 * and an unknown job 404, with no detail. Responses carry counts only, never personal data.
 */
import { safeEqual } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { JOBS, jobBySlug, runJob, type JobRunOutcome } from "@amc/server/jobs";

export const dynamic = "force-dynamic";
/** Hobby functions may run up to 60 seconds; the jobs work in small batches well inside that. */
export const maxDuration = 60;

const headers = { "Cache-Control": "no-store" };

function authorized(request: Request): boolean {
  let secret: string | undefined;
  try {
    secret = env().CRON_SECRET;
  } catch {
    return false;
  }
  const header = request.headers.get("authorization");
  return Boolean(secret && header?.startsWith("Bearer ") && safeEqual(header.slice(7), secret));
}

const summarize = (outcome: JobRunOutcome) =>
  outcome.status === "succeeded"
    ? { status: outcome.status, runId: outcome.runId, items: outcome.items }
    : outcome.status === "failed"
      ? { status: outcome.status, runId: outcome.runId }
      : { status: outcome.status, reason: outcome.reason };

export async function GET(request: Request, ctx: RouteContext<"/api/cron/[job]">): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401, headers });
  const { job: slug } = await ctx.params;
  if (slug === "all") {
    const results: Record<string, ReturnType<typeof summarize>> = {};
    for (const job of JOBS) results[job.slug] = summarize(await runJob(job, { trigger: "cron:all" }));
    const failed = Object.values(results).some((r) => r.status === "failed");
    return Response.json({ ok: !failed, results }, { status: failed ? 500 : 200, headers });
  }
  const job = jobBySlug(slug);
  if (!job) return Response.json({ error: "unknown job" }, { status: 404, headers });
  const outcome = await runJob(job, { trigger: "cron" });
  return Response.json({ ok: outcome.status !== "failed", job: job.slug, ...summarize(outcome) }, { status: outcome.status === "failed" ? 500 : 200, headers });
}
