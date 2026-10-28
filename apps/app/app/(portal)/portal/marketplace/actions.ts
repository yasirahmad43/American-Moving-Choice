"use server";

/**
 * Marketplace server action: buy a request. The purchase service re-reads the member's role and
 * purchase toggle, and the database functions decide price, credit, capacity and disclosure.
 */
import { purchase } from "@amc/server/marketplace";
import { deliverPending } from "@amc/server/outbox";
import { after } from "next/server";
import { actionActor, formText, knownErrorMessage } from "@/components/portal/marketplace/action-support";
import type { PurchaseState } from "@/components/portal/marketplace/purchase-state";

export async function purchaseAction(previous: PurchaseState, formData: FormData): Promise<PurchaseState> {
  const actor = await actionActor(["owner", "manager", "agent"]);
  const attempt = (previous.attempt ?? 0) + 1;
  try {
    const result = await purchase({
      ...actor,
      groupId: formText(formData, "groupId"),
      idempotencyKey: formText(formData, "idempotencyKey"),
    });
    if (result.ok) {
      after(async () => {
        try {
          await deliverPending({ limit: 20 });
        } catch {
          console.error("[outbox] delivery after purchase failed");
        }
      });
      return { status: "success", purchaseId: result.purchaseId, message: "Purchased. The customer's contact details are now in Purchased requests.", attempt };
    }
    return { status: "error", code: result.code, message: result.message, purchaseId: result.purchaseId, attempt };
  } catch (error) {
    const known = knownErrorMessage(error);
    if (!known) console.error(`[purchase] failed${error instanceof Error ? `: ${error.name}` : ""}`);
    return {
      status: "error",
      code: "unknown",
      message: known ?? "Something went wrong and the purchase didn't complete. No contact details were shared. Try again.",
      attempt,
    };
  }
}
