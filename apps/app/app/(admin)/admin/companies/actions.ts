"use server";

/** Company decisions (verification, approval, suspension, prices, profile description). */
import {
  AdminError,
  approveCompany,
  parseDollarsToCents,
  recordCallback,
  recordCheckDecision,
  reinstateCompany,
  rejectCompany,
  rerunChecks,
  reviewProfileDescription,
  setCompanyPrice,
  suspendCompany,
} from "@amc/server/admin";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const paths = (companyId: string) => [`/admin/companies/${companyId}`, "/admin/companies", "/admin/verification", "/admin"];

/** After a status change the decision panel disappears, so the result is shown on the page itself. */
function afterStatusChange(state: FormState, companyId: string, done: string): FormState {
  if (state.status === "success" && /^[0-9a-f-]{36}$/i.test(companyId)) redirect(`/admin/companies/${companyId}?tab=verification&done=${done}`);
  return state;
}

function dollars(formData: FormData, name: string, label: string): number {
  const cents = parseDollarsToCents(field(formData, name, 20));
  if (cents === null) throw new AdminError(`Enter the ${label} in dollars, such as 95 or 95.50.`);
  return cents;
}

export async function rerunChecksAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.verification, async ({ actor }) => {
    const summary = await rerunChecks(actor, idField(formData, "companyId"));
    return `Automated checks ran (${summary.source === "fixture" ? "demo fixture data" : "FMCSA QCMobile"}). Overall result: ${summary.outcome.replace("_", " ")}.`;
  }, paths(companyId));
}

export async function checkDecisionAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.verification, async ({ actor }) => {
    await recordCheckDecision(actor, idField(formData, "companyId"), { checkType: field(formData, "checkType", 60), result: field(formData, "result", 20), note: field(formData, "note", 2000) });
    return "Decision recorded as a new evidence row.";
  }, paths(companyId));
}

export async function callbackAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.verification, async ({ actor }) => {
    const outcome = field(formData, "outcome", 20);
    if (outcome !== "confirmed" && outcome !== "not_confirmed") throw new AdminError("Choose what the call confirmed.");
    await recordCallback(actor, idField(formData, "companyId"), { confirmed: outcome === "confirmed", note: field(formData, "note", 2000) });
    return "Callback recorded.";
  }, paths(companyId));
}

export async function approveAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  const state = await adminAction(previous, ROLES.verification, async ({ actor }) => {
    const result = await approveCompany(actor, idField(formData, "companyId"), {
      exclusiveCents: dollars(formData, "exclusive", "exclusive price"),
      sharedCents: dollars(formData, "shared", "shared price"),
      approveDescription: formData.get("approveDescription") === "on",
      note: field(formData, "note", 1000),
    });
    return `Approved. The badge is issued and the profile is ${result.publicStatus === "live" ? "live" : "hidden until its description is approved"}.`;
  }, paths(companyId));
  return afterStatusChange(state, companyId, "approved");
}

export async function rejectAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  const state = await adminAction(previous, ROLES.verification, async ({ actor }) => {
    await rejectCompany(actor, idField(formData, "companyId"), field(formData, "reason", 1000));
    return "Application rejected. The owner was emailed the reason.";
  }, paths(companyId));
  return afterStatusChange(state, companyId, "rejected");
}

export async function suspendAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  const state = await adminAction(previous, ROLES.verification, async ({ actor }) => {
    await suspendCompany(actor, idField(formData, "companyId"), field(formData, "reason", 1000));
    return "Company suspended. The badge is revoked and purchases are blocked.";
  }, paths(companyId));
  return afterStatusChange(state, companyId, "suspended");
}

export async function reinstateAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  const state = await adminAction(previous, ROLES.verification, async ({ actor }) => {
    await reinstateCompany(actor, idField(formData, "companyId"), field(formData, "reason", 1000));
    return "Company reinstated and the badge reissued.";
  }, paths(companyId));
  return afterStatusChange(state, companyId, "reinstated");
}

export async function setPriceAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.pricing, async ({ actor }) => {
    await setCompanyPrice(actor, idField(formData, "companyId"), {
      exclusiveCents: dollars(formData, "exclusive", "exclusive price"),
      sharedCents: dollars(formData, "shared", "shared price"),
      note: field(formData, "note", 500),
    });
    return "New prices added. Earlier purchases keep the price they used.";
  }, paths(companyId));
}

export async function descriptionAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.profiles, async ({ actor }) => {
    const decision = field(formData, "decision", 20);
    if (decision !== "approve" && decision !== "reject") throw new AdminError("Choose approve or reject.");
    const status = await reviewProfileDescription(actor, idField(formData, "companyId"), { approve: decision === "approve", reason: field(formData, "reason", 1000) });
    return decision === "approve" ? `Description approved. The profile is ${status}.` : "Description rejected. The owner was emailed the reason.";
  }, [...paths(companyId), "/admin/reviews"]);
}
