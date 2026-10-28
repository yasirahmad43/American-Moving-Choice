/**
 * The price a company would pay to buy a request next, for display only (lead lifecycle §5:
 * "their price"). The charge itself is always computed by reserve_purchase in the database from
 * the same inputs: the company's current price row, the request's policy version and the number of
 * buyers so far.
 */
import { applyBasisPoints } from "@amc/core";

export interface NextPriceInput {
  sharingLimit: number;
  buyerCount: number;
  exclusiveCents: number;
  sharedCents: number;
  /** The request's sharing policy factors (basis points), first 10000. */
  factorsBp: number[];
}

export interface NextPrice {
  leadType: "exclusive" | "shared";
  /** The company's list price: exclusive or shared. */
  listCents: number;
  /** What the next purchase would charge (credit first, then card). */
  chargeCents: number;
  /** 1-based position of the next buyer. */
  position: number;
  /** Factor applied, in basis points (10000 for exclusive or the first shared buyer). */
  factorBp: number;
}

/** Null when the request can't be sold again (cap reached or no factor for the position). */
export function nextPrice(input: NextPriceInput): NextPrice | null {
  const position = input.buyerCount + 1;
  if (position > input.sharingLimit) return null;
  if (input.sharingLimit === 1) {
    return { leadType: "exclusive", listCents: input.exclusiveCents, chargeCents: input.exclusiveCents, position, factorBp: 10000 };
  }
  const factor = input.factorsBp[position - 1];
  if (factor === undefined) return null;
  return {
    leadType: "shared",
    listCents: input.sharedCents,
    chargeCents: applyBasisPoints(input.sharedCents, factor),
    position,
    factorBp: factor,
  };
}

/** Credit applied before the card, as reserve_purchase does: the smaller of available credit and the charge. */
export function splitCharge(chargeCents: number, availableCreditCents: number): { creditCents: number; cardCents: number } {
  const creditCents = Math.max(0, Math.min(availableCreditCents, chargeCents));
  return { creditCents, cardCents: chargeCents - creditCents };
}

/** "80%" from 8000 basis points. */
export function formatFactor(bp: number): string {
  const pct = bp / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}
