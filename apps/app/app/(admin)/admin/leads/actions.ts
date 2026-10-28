"use server";

/** Request decisions: approve (needs review → qualified), reject, withdraw, expire. */
import { AdminError, decideLead, rematchLeadGroup, type LeadDecision } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const DECISIONS: Record<LeadDecision, string> = {
  approve: "Request approved and qualified.",
  reject: "Request rejected.",
  withdraw: "Request withdrawn: no further sales or disclosures. Buyers were told to stop contact.",
  expire: "Request expired: it is no longer on sale.",
};

export async function leadDecisionAction(previous: FormState, formData: FormData): Promise<FormState> {
  const leadId = field(formData, "leadId", 64);
  return adminAction(previous, ROLES.leads, async ({ actor }) => {
    const decision = field(formData, "decision", 20) as LeadDecision;
    if (!(decision in DECISIONS)) throw new AdminError("Unknown decision.");
    await decideLead(actor, idField(formData, "leadId"), decision, field(formData, "reason", 1000));
    return DECISIONS[decision];
  }, [`/admin/leads/${leadId}`, "/admin/leads", "/admin"]);
}

/** Re-runs the matcher for the request's group: only companies named in the consent are refreshed (admin fix F4). */
export async function rematchAction(previous: FormState, formData: FormData): Promise<FormState> {
  const leadId = field(formData, "leadId", 64);
  return adminAction(previous, ROLES.leads, async ({ actor }) => {
    const outcome = await rematchLeadGroup(actor, idField(formData, "groupId"));
    const parts = [`${outcome.refreshed.length} snapshot${outcome.refreshed.length === 1 ? "" : "s"} refreshed`];
    if (outcome.notMatching.length) parts.push(`${outcome.notMatching.length} named mover${outcome.notMatching.length === 1 ? " no longer matches" : "s no longer match"} (left stale)`);
    if (outcome.removed) parts.push(`${outcome.removed} removed by the consumer, untouched`);
    return `Matching re-run: ${parts.join("; ")}. No company was added.`;
  }, [`/admin/leads/${leadId}`, "/admin/leads", "/admin"]);
}
