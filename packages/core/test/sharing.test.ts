import { describe, expect, it } from "vitest";
import { LAUNCH_POLICY_PROPOSAL as P, effectiveCost, quoteNextSharedPurchase, simulateShared, validatePolicy } from "../src/sharing";
import { applyBasisPoints } from "../src/money";

const buyers = [
  { companyId: "A", sharedPrice: 4000 },
  { companyId: "B", sharedPrice: 3500 },
  { companyId: "C", sharedPrice: 4500 },
  { companyId: "D", sharedPrice: 3000 },
  { companyId: "E", sharedPrice: 5000 },
];

describe("rounding", () => {
  it("rounds half up in integer cents", () => {
    expect(applyBasisPoints(3333, 6500)).toBe(2166); // 2166.45
    expect(applyBasisPoints(1, 5000)).toBe(1); // 0.5 -> 1
    expect(applyBasisPoints(3, 5000)).toBe(2); // 1.5 -> 2
  });
});

describe("equalizing step-down", () => {
  it("single buyer pays full shared price, no credits", () => {
    const r = simulateShared(buyers.slice(0, 1), 5, P);
    expect(r.rows[0]).toMatchObject({ charged: 4000, creditsReceived: 0, netCost: 4000 });
    expect(r.netRevenue).toBe(4000);
  });

  it("every buyer's net cost equals own price x final factor (different prices)", () => {
    for (let n = 1; n <= 5; n++) {
      const r = simulateShared(buyers.slice(0, n), 5, P);
      for (const row of r.rows) expect(row.netCost).toBe(effectiveCost(row.sharedPrice, n, P));
      expect(r.netRevenue).toBe(r.rows.reduce((s, x) => s + effectiveCost(x.sharedPrice, n, P), 0));
    }
  });

  it("matches the worked examples in the policy doc", () => {
    expect(simulateShared(buyers.slice(0, 2), 5, P).netRevenue).toBe(6000);
    expect(simulateShared(buyers.slice(0, 3), 5, P).netRevenue).toBe(7800);
    expect(simulateShared(buyers.slice(0, 5), 5, P).netRevenue).toBe(10000);
  });

  it("credits never exceed what a buyer paid and never go negative", () => {
    const odd = [{ companyId: "X", sharedPrice: 3333 }, { companyId: "Y", sharedPrice: 1 }, { companyId: "Z", sharedPrice: 9999 }];
    const r = simulateShared(odd, 3, P);
    for (const row of r.rows) {
      expect(row.creditsReceived).toBeGreaterThanOrEqual(0);
      expect(row.creditsReceived).toBeLessThanOrEqual(row.charged);
    }
  });

  it("never sells beyond the consumer cap", () => {
    expect(() => quoteNextSharedPurchase(buyers.slice(0, 3), 4000, 3, P)).toThrow(/cap/);
  });

  it("uses snapshotted prior prices, so admin price changes don't rewrite history", () => {
    const q = quoteNextSharedPurchase([{ companyId: "A", sharedPrice: 4000 }], 9999, 5, P);
    expect(q.credits).toEqual([{ companyId: "A", amount: 800 }]);
  });

  it("rejects malformed policies", () => {
    expect(() => validatePolicy({ version: "x", factorsBp: [9000] })).toThrow();
    expect(() => validatePolicy({ version: "x", factorsBp: [10000, 6000, 7000] })).toThrow();
  });
});
