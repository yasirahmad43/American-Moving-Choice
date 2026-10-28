"use server";

/** Platform settings and consent text versions (super admin). */
import { AdminError, approveConsentVersion, createConsentDraft, retireConsentVersion, updateSettings } from "@amc/server/admin";
import { SETTING_KEYS } from "@amc/server/settings";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const PATHS = ["/admin/settings", "/admin/pricing"];

export async function updateSettingsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    const form: Record<string, string> = {};
    for (const key of SETTING_KEYS) if (formData.has(key)) form[key] = field(formData, key, 200);
    const { changed } = await updateSettings(actor, form);
    return changed.length ? `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}. Each is in the audit log.` : "Nothing changed.";
  }, PATHS);
}

export async function createConsentAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    await createConsentDraft(actor, { id: field(formData, "id", 60), kind: field(formData, "kind", 30), body: field(formData, "body", 6000) });
    return "Draft saved.";
  }, PATHS);
}

export async function consentDecisionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.platform, async ({ actor }) => {
    const id = field(formData, "id", 60);
    const decision = field(formData, "decision", 20);
    if (decision === "approve") {
      await approveConsentVersion(actor, id, field(formData, "approver", 200));
      return `${id} is approved and frozen.`;
    }
    if (decision === "retire") {
      await retireConsentVersion(actor, id);
      return `${id} is retired.`;
    }
    throw new AdminError("Unknown decision.");
  }, PATHS);
}
