import { describe, expect, it } from "vitest";
import { anonymousCoverage, type CoverageResult } from "./coverage";
import { requestReceivedEmail } from "./messages";
import { purchaseNoticeText } from "../marketplace/purchase";

describe("consumer company identity boundary", () => {
  it("removes identities from matching and stale-match responses without losing match IDs", () => {
    const coverage: CoverageResult = {
      ok: true,
      move: { origin: { zip: "75201", city: "Dallas", state: "TX", countyFips: "48113" }, destination: { zip: "77002", city: "Houston", state: "TX", countyFips: "48201" }, distanceMiles: 225, moveType: "intrastate" },
      movers: [{ companyId: "opaque-id", displayName: "Private Carrier", usdotNumber: "1234567", checkedAt: "2026-01-01", profileSlug: "private-carrier", isDemo: true }],
      profileCompany: { companyId: "opaque-id", displayName: "Private Carrier", eligible: true },
    };
    const result = anonymousCoverage(coverage);
    expect(result.ok && result.movers.map((m) => m.companyId)).toEqual(["opaque-id"]);
    expect(result.ok && result.profileCompany).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/Private Carrier|1234567|private-carrier|2026-01-01/);
    expect(coverage.ok && coverage.movers[0]?.displayName).toBe("Private Carrier");
  });

  it("does not disclose a company in request confirmations or purchase updates", () => {
    const confirmation = requestReceivedEmail({ referenceCode: "AMC-TEST-1234", route: { originCity: "Dallas", originState: "TX", destCity: "Houston", destState: "TX" }, limit: 1,
      movers: [{ displayName: "Private Carrier", usdotNumber: "1234567" }], manageUrl: "https://example.test/my-request/private/", webUrl: "https://example.test", joinedReferenceCode: null });
    const purchase = purchaseNoticeText({ firstName: "Alex", moverName: "Private Carrier", usdot: "1234567", referenceCode: "AMC-TEST-1234", profileUrl: "https://example.test/companies/private-carrier/" });
    expect(JSON.stringify({ confirmation, purchase })).not.toMatch(/Private Carrier|1234567|private-carrier/);
    expect(purchase.body).toContain("identify itself when it contacts you");
  });

  it("does not disclose an earlier request through a legacy confirmation field", () => {
    const confirmation = requestReceivedEmail({ referenceCode: "AMC-CURRENT", route: { originCity: "Dallas", originState: "TX", destCity: "Houston", destState: "TX" }, limit: 1,
      movers: [], manageUrl: "https://example.test/my-request/private/", webUrl: "https://example.test", joinedReferenceCode: "AMC-PRIOR-PRIVATE" });
    expect(JSON.stringify(confirmation)).not.toMatch(/AMC-PRIOR-PRIVATE|joins it|lowest number/u);
    expect(confirmation.bodyText).toContain("AMC-CURRENT");
  });
});
