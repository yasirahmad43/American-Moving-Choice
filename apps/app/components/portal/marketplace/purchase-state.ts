/** Result of the purchase server action, shown inline in the purchase dialog (VD §9.6). */
export interface PurchaseState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Error code from the purchase service (sold_out, payment_failed, ...). */
  code?: string;
  purchaseId?: string;
  attempt?: number;
}

export const initialPurchaseState: PurchaseState = { status: "idle", attempt: 0 };
