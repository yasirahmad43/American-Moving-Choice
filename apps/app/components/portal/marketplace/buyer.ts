import "server-only";

import type { Membership } from "@amc/server/auth";
import { getPool } from "@amc/server/db";
import { buyerContext, dialogSplit, type BuyerContext, type MarketplaceListing } from "@amc/server/marketplace";
import { paymentsProvider } from "@amc/server/payments";
import type { PurchaseDialogProps } from "./purchase-dialog";
import { route } from "./labels";

/** What the header and purchase dialogs need about the buyer (display only; purchase re-checks). */
export function loadBuyer(membership: Membership): Promise<BuyerContext> {
  return buyerContext(getPool(), membership, paymentsProvider().name);
}

export function blockedReason(buyer: BuyerContext): string | null {
  if (!buyer.canPurchase) return "Buying is turned off for your account. Ask your company owner to turn on purchasing for you.";
  if (!buyer.companyCanPurchase) return "Your company can't buy requests right now. Check your verification status and billing standing.";
  if (!buyer.hasPrice) return "Your company doesn't have request prices set yet. Contact support to set them.";
  return null;
}

export function dialogProps(listing: MarketplaceListing, buyer: BuyerContext): PurchaseDialogProps {
  const split = dialogSplit(listing, buyer);
  const p = listing.preview;
  return {
    groupId: listing.groupId,
    leadType: listing.price.leadType,
    route: `${p.firstName}: ${route(p.origin, p.destination)}`,
    chargeCents: listing.price.chargeCents,
    creditCents: split.creditCents,
    cardCents: split.cardCents,
    sharingLimit: p.maxBuyers,
    paymentMethod: buyer.paymentMethod,
    blockedReason: blockedReason(buyer),
    purchaseInProgress: listing.purchaseInProgress,
  };
}
