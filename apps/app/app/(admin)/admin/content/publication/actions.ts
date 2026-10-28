"use server";

/**
 * Pipeline steps as background jobs: the action records the request (audited), checks nothing
 * is already running, and hands the run to `after()` so it executes once the response is sent,
 * through the jobs runner (job_runs row and advisory lock). Never inline in the request.
 */
import { PIPELINE_STEPS, PIPELINE_STEP_LABELS, queuePipelineStep, runPipelineStep, type ContentActor, type PipelineStep, type PipelineStepInput } from "@amc/server/admin";
import { AdminError } from "@amc/server/admin";
import { after } from "next/server";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../../_lib/action";
import { ROLES } from "../../_lib/roles";

const actorOf = (ctx: { actor: { userId: string; ip?: string | null }; adminRole: ContentActor["adminRole"] }): ContentActor => ({ ...ctx.actor, adminRole: ctx.adminRole });

export async function runStepAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const step = field(formData, "step", 30);
    if (!(PIPELINE_STEPS as readonly string[]).includes(step)) throw new AdminError("Unknown pipeline step.");
    const limit = Number.parseInt(field(formData, "limit", 10), 10);
    const status = field(formData, "status", 10);
    const input: PipelineStepInput = {
      step: step as PipelineStep,
      family: field(formData, "family", 20) || null,
      limit: Number.isFinite(limit) && limit > 0 ? limit : null,
      files: formData.getAll("files").filter((f): f is string => typeof f === "string" && f.length > 0),
      status: status === "ready" || status === "review" || status === "draft" ? status : null,
    };
    const actor = actorOf(ctx);
    const { jobName } = await queuePipelineStep(actor, input);
    after(async () => {
      try {
        await runPipelineStep(actor, input);
      } catch {
        console.error(`[content] pipeline step ${jobName} failed to start`);
      }
    });
    return `${PIPELINE_STEP_LABELS[input.step]} started in the background as ${jobName}. Reload this page to follow the run.`;
  }, ["/admin/content/publication", "/admin/content", "/admin/jobs"]);
}
