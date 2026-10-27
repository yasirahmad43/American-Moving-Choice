import { applyBasisPoints, assertNonNegInt, type BasisPoints, type Cents } from "./money";

/**
 * Shared-lead "equalizing step-down" policy.
 *
 * Each buyer's effective cost for a shared lead is its own shared price multiplied by the
 * share factor for the number of distinct buyers the lead currently has:
 *
 *   effective_i(n) = round(sharedPrice_i * factor[n])
 *
 * The k-th buyer is charged effective_k(k). When the k-th purchase succeeds, every earlier
 * buyer i receives an account credit of effective_i(k-1) - effective_i(k). Credits telescope,
 * so after N buyers each buyer has paid exactly effective_i(N) net, with no rounding drift.
 */
export interface SharingPolicy {
  version: string;
  /** factorsBp[n-1] is the factor once the lead has n buyers. factorsBp[0] must be 10000. */
  factorsBp: BasisPoints[];
}

export const LAUNCH_POLICY_PROPOSAL: SharingPolicy = {
  version: "share-stepdown-v1-proposal",
  factorsBp: [10000, 8000, 6500, 5500, 5000],
};

export function validatePolicy(p: SharingPolicy): void {
  if (p.factorsBp.length === 0 || p.factorsBp[0] !== 10000) throw new Error("first factor must be 10000 bp");
  for (let i = 0; i < p.factorsBp.length; i++) {
    const f = p.factorsBp[i]!;
    assertNonNegInt(f, "factor");
    if (f > 10000) throw new Error("factors cannot exceed 10000 bp");
    if (i > 0 && f > p.factorsBp[i - 1]!) throw new Error("factors must be non-increasing");
  }
}

export function maxBuyers(p: SharingPolicy): number {
  return p.factorsBp.length;
}

export function effectiveCost(sharedPrice: Cents, buyerCount: number, p: SharingPolicy): Cents {
  const f = p.factorsBp[buyerCount - 1];
  if (f === undefined) throw new RangeError(`policy ${p.version} has no factor for ${buyerCount} buyers`);
  return applyBasisPoints(sharedPrice, f);
}

export interface PriorBuyer {
  companyId: string;
  /** Shared price snapshotted at that buyer's purchase time. Later admin price changes never affect it. */
  sharedPrice: Cents;
}

export interface PurchaseQuote {
  /** Amount charged to the new buyer (cash or account credit). */
  charge: Cents;
  /** 1-based position of the new buyer. */
  position: number;
  credits: { companyId: string; amount: Cents }[];
}

/** Price the next purchase of a shared lead given buyers who already purchased (in order). */
export function quoteNextSharedPurchase(
  prior: PriorBuyer[],
  newBuyerSharedPrice: Cents,
  cap: number,
  p: SharingPolicy,
): PurchaseQuote {
  validatePolicy(p);
  const position = prior.length + 1;
  if (position > cap) throw new Error("sharing cap reached");
  if (position > maxBuyers(p)) throw new Error("policy does not support this many buyers");
  const credits = prior.map((b) => ({
    companyId: b.companyId,
    amount: effectiveCost(b.sharedPrice, position - 1, p) - effectiveCost(b.sharedPrice, position, p),
  }));
  return { charge: effectiveCost(newBuyerSharedPrice, position, p), position, credits };
}

export interface SimulationRow {
  companyId: string;
  sharedPrice: Cents;
  charged: Cents;
  creditsReceived: Cents;
  netCost: Cents;
}

export interface SimulationResult {
  rows: SimulationRow[];
  grossCharges: Cents;
  creditsIssued: Cents;
  netRevenue: Cents;
}

/** Run a full sequence of purchases; used for worked examples, admin previews and tests. */
export function simulateShared(buyers: PriorBuyer[], cap: number, p: SharingPolicy): SimulationResult {
  const rows: SimulationRow[] = [];
  for (const b of buyers) {
    const q = quoteNextSharedPurchase(rows, b.sharedPrice, cap, p);
    for (const c of q.credits) rows.find((r) => r.companyId === c.companyId)!.creditsReceived += c.amount;
    rows.push({ companyId: b.companyId, sharedPrice: b.sharedPrice, charged: q.charge, creditsReceived: 0, netCost: 0 });
  }
  for (const r of rows) r.netCost = r.charged - r.creditsReceived;
  const grossCharges = rows.reduce((s, r) => s + r.charged, 0);
  const creditsIssued = rows.reduce((s, r) => s + r.creditsReceived, 0);
  return { rows, grossCharges, creditsIssued, netRevenue: grossCharges - creditsIssued };
}

/** Card processing estimate: pct in bp plus fixed cents per charge. Values are inputs, not facts. */
export function cardFee(amount: Cents, pctBp: BasisPoints, fixed: Cents): Cents {
  return amount === 0 ? 0 : applyBasisPoints(amount, pctBp) + fixed;
}
