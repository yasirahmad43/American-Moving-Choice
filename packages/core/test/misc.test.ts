import { describe, expect, it } from "vitest";
import { parseZip5, classifyMove } from "../src/geo";
import { normalizeUsPhone, effectiveGroupLimit } from "../src/dedupe";
import { toPreview, type LeadRecord } from "../src/preview";

describe("geo", () => {
  it("keeps leading zeros", () => {
    expect(parseZip5("02108")).toBe("02108");
    expect(parseZip5("00501-1234")).toBe("00501");
    expect(parseZip5("2108")).toBeNull();
  });
  it("classifies moves", () => {
    const a = { zip: parseZip5("30303")!, state: "GA" as const, countyFips: "13121", city: "Atlanta" };
    const b = { ...a, zip: parseZip5("31401")!, countyFips: "13051", city: "Savannah" };
    expect(classifyMove(a, b, 248)).toBe("intrastate");
    expect(classifyMove(a, a, 5)).toBe("local");
    expect(classifyMove(a, { ...a, state: "FL" }, 20)).toBe("interstate");
  });
});

describe("dedupe", () => {
  it("normalizes phones", () => {
    expect(normalizeUsPhone("(404) 555-0134")).toBe("+14045550134");
    expect(normalizeUsPhone("1-404-555-0134")).toBe("+14045550134");
    expect(normalizeUsPhone("011-555-0134")).toBeNull();
  });
  it("duplicate submissions can never widen the sharing limit", () => {
    expect(effectiveGroupLimit([3, 5])).toBe(3);
    expect(effectiveGroupLimit([4, 1])).toBe(1);
  });
});

describe("preview redaction", () => {
  const lead: LeadRecord = {
    id: "L1", firstName: "Dana", lastName: "Secret", email: "dana@example.com", phone: "+14045550134",
    streetAddress: "1 Main St", notes: "gate code 1234", originCity: "Atlanta", originState: "GA", originZip: "30303",
    destCity: "Miami", destState: "FL", destZip: "33101", moveDate: "2026-12-01", moveDateFlexible: false, moveSize: "2br",
    sourceCategory: "organic_search", createdAt: "2026-10-27T12:00:00Z", sharingLimit: 3,
  };
  it("never contains contact details, surname, address or notes", () => {
    const json = JSON.stringify(toPreview(lead, { buyerCount: 1, price: 3200, showZip: true }));
    for (const secret of ["Secret", "dana@example.com", "5550134", "1 Main St", "gate code"]) expect(json).not.toContain(secret);
    expect(json).toContain("Dana");
  });
  it("labels exclusive vs shared from the consumer's limit", () => {
    expect(toPreview({ ...lead, sharingLimit: 1 }, { buyerCount: 0, price: 9000, showZip: false }).leadType).toBe("exclusive");
  });
});
