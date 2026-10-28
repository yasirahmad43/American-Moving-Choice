"use server";

/** Case handling: open, update (status, assignee, outcome, company), re-verify or suspend the company. */
import { caseReverify, caseSuspend, createCase, updateCase } from "@amc/server/cases";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const optionalId = (formData: FormData, name: string) => field(formData, name, 64) || null;

export async function createCaseAction(previous: FormState, formData: FormData): Promise<FormState> {
  let created: string | null = null;
  const state = await adminAction(previous, ROLES.cases, async ({ actor }) => {
    created = await createCase(actor, {
      caseType: field(formData, "caseType", 40),
      description: field(formData, "description", 5000),
      companyId: optionalId(formData, "companyId"),
      leadId: optionalId(formData, "leadId"),
      reporterName: field(formData, "reporterName", 120),
      reporterEmail: field(formData, "reporterEmail", 254),
      reporterPhone: field(formData, "reporterPhone", 40),
    });
    return "Case opened.";
  }, ["/admin/cases", "/admin"]);
  if (created) redirect(`/admin/cases/${created}`);
  return state;
}

export async function updateCaseAction(previous: FormState, formData: FormData): Promise<FormState> {
  const caseId = field(formData, "caseId", 64);
  return adminAction(previous, ROLES.cases, async ({ actor }) => {
    await updateCase(actor, idField(formData, "caseId"), {
      status: field(formData, "status", 30),
      assignee: field(formData, "assignee", 64) || null,
      outcome: field(formData, "outcome", 5000),
      companyId: optionalId(formData, "companyId"),
    });
    return "Case updated.";
  }, [`/admin/cases/${caseId}`, "/admin/cases", "/admin"]);
}

export async function caseReverifyAction(previous: FormState, formData: FormData): Promise<FormState> {
  const caseId = field(formData, "caseId", 64);
  return adminAction(previous, ROLES.caseEnforcement, async ({ actor }) => {
    const outcome = await caseReverify(actor, idField(formData, "caseId"));
    return `Automated checks re-ran for the linked company. Overall result: ${outcome.replace("_", " ")}. Review them on the company's verification tab.`;
  }, [`/admin/cases/${caseId}`]);
}

export async function caseSuspendAction(previous: FormState, formData: FormData): Promise<FormState> {
  const caseId = field(formData, "caseId", 64);
  return adminAction(previous, ROLES.caseEnforcement, async ({ actor }) => {
    await caseSuspend(actor, idField(formData, "caseId"), field(formData, "reason", 1000));
    return "The linked company is suspended.";
  }, [`/admin/cases/${caseId}`, "/admin/companies", "/admin"]);
}
