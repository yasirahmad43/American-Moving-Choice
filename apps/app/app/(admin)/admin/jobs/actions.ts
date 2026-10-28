"use server";

/** Runs a job by hand (audited). */
import { AdminError } from "@amc/server/admin";
import { audit } from "@amc/server/audit";
import { jobBySlug, runJob } from "@amc/server/jobs";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../_lib/action";
import { ROLES } from "../_lib/roles";

export async function runJobAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.jobs, async ({ actor }) => {
    const job = jobBySlug(field(formData, "job", 60));
    if (!job) throw new AdminError("Unknown job.");
    const outcome = await runJob(job, { trigger: "admin" });
    await audit({ actorType: "admin", actorId: actor.userId, action: "job.run", entity: "job", entityId: job.name, after: { status: outcome.status }, ip: actor.ip ?? null });
    if (outcome.status === "skipped") return `${job.label} is already running.`;
    if (outcome.status === "failed") throw new AdminError(`${job.label} failed: ${outcome.error}`);
    return `${job.label} finished: ${outcome.items} item${outcome.items === 1 ? "" : "s"} processed.`;
  }, ["/admin/jobs", "/admin"]);
}
