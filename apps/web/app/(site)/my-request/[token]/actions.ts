"use server";

import { requestMeta } from "@amc/server/auth";
import { withdrawRequest } from "@amc/server/leads";
import { refresh } from "next/cache";
import type { WithdrawState } from "@/components/survey/withdraw-form";

/** Withdraws the request behind the manage token in the page URL (bound by the page). */
export async function withdrawAction(token: string, _previous: WithdrawState, formData: FormData): Promise<WithdrawState> {
  if (formData.get("confirm") !== "yes") return { status: "error", message: "Confirm that you want to withdraw your request." };
  const { ip } = await requestMeta();
  const result = await withdrawRequest(typeof token === "string" ? token : "", { ip });
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "rate_limited" ? "Too many attempts from your connection. Wait 15 minutes, then try again." : "We couldn't find this request. Check the link in your email.",
    };
  }
  refresh();
  return { status: "withdrawn" };
}
