"use server";

/** Sharing policy versions: create (validated with @amc/core validatePolicy) and activate. */
import { activateSharingPolicy, createSharingPolicy } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const PATHS = ["/admin/pricing", "/admin/settings"];

export async function createPolicyAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.policies, async ({ actor }) => {
    await createSharingPolicy(actor, { version: field(formData, "version", 60), factors: field(formData, "factors", 200) });
    return "Policy version created. Activate it to use it for new requests.";
  }, PATHS);
}

export async function activatePolicyAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.policies, async ({ actor }) => {
    const version = field(formData, "version", 60);
    await activateSharingPolicy(actor, version);
    return `New requests now use ${version}. Existing requests keep the policy they were created with.`;
  }, PATHS);
}
