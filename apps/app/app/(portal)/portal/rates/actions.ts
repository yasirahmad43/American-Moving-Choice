"use server";

/**
 * Saving a rate card (build plan §7.3). Owners and managers only (data-model §2); the role is
 * checked here on the server, not trusted from the page. The card supersedes the company's active
 * card and the change is audited (@amc/server/rates saveRateCard).
 */
import { requestMeta, requireMembership } from "@amc/server/auth";
import { RateCardValidationError, parseRateCardForm, rateCardToFormValues, saveRateCard, type RateCardFormValues } from "@amc/server/rates";
import { revalidatePath } from "next/cache";
import { RATE_CARD_ROLES, type RateCardFormState } from "./shared";

function formValues(formData: FormData): RateCardFormValues {
  const values: RateCardFormValues = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$")) continue;
    if (key === "states") values.states = [...((values.states as string[] | undefined) ?? []), value];
    else values[key] = value.slice(0, 32);
  }
  values.states ??= [];
  return values;
}

export async function saveRateCardAction(previous: RateCardFormState, formData: FormData): Promise<RateCardFormState> {
  const { user, membership } = await requireMembership({ roles: RATE_CARD_ROLES });
  const attempt = (previous.attempt ?? 0) + 1;
  const values = formValues(formData);
  const parsed = parseRateCardForm(values);
  if (!parsed.ok) {
    const count = Object.keys(parsed.fieldErrors).length;
    return {
      status: "error",
      message: count === 1 ? "1 answer needs attention. Nothing was saved." : `${count} answers need attention. Nothing was saved.`,
      fieldErrors: parsed.fieldErrors,
      values,
      attempt,
    };
  }
  try {
    const { ip } = await requestMeta();
    await saveRateCard(membership.companyId, parsed.data, { userId: user.id, ip });
  } catch (error) {
    if (error instanceof RateCardValidationError) {
      return { status: "error", message: "Some values need attention. Nothing was saved.", values, attempt };
    }
    console.error("[rates] saving a rate card failed");
    return { status: "error", message: "We couldn't save your rate card just now. Nothing was changed; try again in a moment.", values, attempt };
  }
  revalidatePath("/portal/rates");
  return {
    status: "success",
    message: "Rate card saved. It replaces your previous card, which stays in your history, and the cost calculator uses it from now on.",
    values: rateCardToFormValues(parsed.data),
    attempt,
  };
}
