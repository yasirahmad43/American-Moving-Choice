import { describe, expect, it } from "vitest";
import { eligibleCompanies, matchCompany, type CompanyMatchProfile, type LeadFacts } from "../src/matching";
import { parseZip5, type ResolvedLocation } from "../src/geo";

const loc = (zip: string, state: any, countyFips: string, city = "X"): ResolvedLocation => ({ zip: parseZip5(zip)!, state, countyFips, city });
const MIAMI = loc("33101", "FL", "12086", "Miami");
const ATL = loc("30303", "GA", "13121", "Atlanta");
const BOSTON = loc("02108", "MA", "25025", "Boston");

const lead = (o: ResolvedLocation, d: ResolvedLocation): LeadFacts => ({
  origin: o, destination: d, moveType: o.state === d.state ? "local" : "interstate", moveSize: "2br", services: ["full_service"],
});

const company = (rules: CompanyMatchProfile["rules"], over: Partial<CompanyMatchProfile> = {}): CompanyMatchProfile => ({
  companyId: "c1",
  eligibleToPurchase: true,
  capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: ["studio", "1br", "2br", "3br", "4br_plus"], services: ["full_service", "packing"] },
  rules,
  ...over,
});

describe("matching", () => {
  it("nationwide rule matches anything within capabilities", () => {
    expect(matchCompany(company([{ id: "n", kind: "include" }]), lead(MIAMI, BOSTON)).eligible).toBe(true);
  });

  it("directional routes are distinct: FL->GA does not match GA->FL", () => {
    const c = company([{ id: "r", kind: "include", origin: { states: ["FL"] }, destination: { states: ["GA"] } }]);
    expect(matchCompany(c, lead(MIAMI, ATL)).eligible).toBe(true);
    expect(matchCompany(c, lead(ATL, MIAMI)).eligible).toBe(false);
  });

  it("origin-only preference ignores destination", () => {
    const c = company([{ id: "o", kind: "include", origin: { countyFips: ["13121"] } }]);
    expect(matchCompany(c, lead(ATL, BOSTON)).eligible).toBe(true);
    expect(matchCompany(c, lead(ATL, MIAMI)).eligible).toBe(true);
    expect(matchCompany(c, lead(MIAMI, ATL)).eligible).toBe(false);
  });

  it("destination-only preference works independently", () => {
    const c = company([{ id: "d", kind: "include", destination: { states: ["GA"] } }]);
    expect(matchCompany(c, lead(BOSTON, ATL)).eligible).toBe(true);
    expect(matchCompany(c, lead(ATL, BOSTON)).eligible).toBe(false);
  });

  it("any location within a group matches (state OR county OR zip)", () => {
    const c = company([{ id: "g", kind: "include", origin: { states: ["TX"], zips: [parseZip5("02108")!] } }]);
    expect(matchCompany(c, lead(BOSTON, MIAMI)).eligible).toBe(true);
  });

  it("exclusions override inclusions", () => {
    const c = company([
      { id: "n", kind: "include" },
      { id: "x", kind: "exclude", destination: { states: ["MA"] } },
    ]);
    const r = matchCompany(c, lead(MIAMI, BOSTON));
    expect(r).toEqual({ eligible: false, reason: "excluded_by:x" });
  });

  it("paused rules are ignored", () => {
    expect(matchCompany(company([{ id: "n", kind: "include", paused: true }]), lead(MIAMI, ATL)).eligible).toBe(false);
  });

  it("capabilities are a hard ceiling and ineligible companies never match", () => {
    const c = company([{ id: "n", kind: "include" }], { capabilities: { moveTypes: ["local"], moveSizes: ["2br"], services: ["full_service"] } });
    expect(matchCompany(c, lead(MIAMI, ATL))).toEqual({ eligible: false, reason: "move_type_not_offered" });
    expect(matchCompany(company([{ id: "n", kind: "include" }], { eligibleToPurchase: false }), lead(MIAMI, ATL)).eligible).toBe(false);
  });

  it("builds the eligibility snapshot from all companies", () => {
    const route = company([{ id: "fl-ga", kind: "include", origin: { states: ["FL"] }, destination: { states: ["GA"] } }], { companyId: "route" });
    const nation = company([{ id: "all", kind: "include" }], { companyId: "nation" });
    const broker = company([{ id: "all", kind: "include" }], { companyId: "broker", eligibleToPurchase: false });
    expect(eligibleCompanies([route, nation, broker], lead(MIAMI, ATL))).toEqual([
      { companyId: "route", ruleId: "fl-ga" },
      { companyId: "nation", ruleId: "all" },
    ]);
    expect(eligibleCompanies([route, nation, broker], lead(ATL, MIAMI))).toEqual([{ companyId: "nation", ruleId: "all" }]);
  });
});
