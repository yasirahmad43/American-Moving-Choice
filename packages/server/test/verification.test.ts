import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signupCompany } from "../src/auth/signup";
import { closePool, getPool } from "../src/db/pool";
import { assessCarrier, normalizeCompanyName, similarity } from "../src/verification/assess";
import { evaluateEligibility } from "../src/verification/eligibility";
import { fixtureAdapter, fixtureRecord } from "../src/verification/fixtures";
import { mapQcMobile, qcMobileAdapter } from "../src/verification/qcmobile";
import { fmcsaSnapshotUrl, getCompanyEligibility, latestChecks, runAutomatedChecks } from "../src/verification/run";
import type { ApplicationFacts, CheckOutcome, FmcsaLookup } from "../src/verification/types";
import { resetDatabase } from "./helpers";

const pool = () => getPool();
const company = (n: number) => `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const results = (outcomes: CheckOutcome[]) => Object.fromEntries(outcomes.map((o) => [o.checkType, o.result]));

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
});

afterAll(async () => {
  await closePool();
});

describe("FMCSA fixture adapter", () => {
  it("returns the seed companies' records for USDOT 9000001-9000015", async () => {
    const lookup = await fixtureAdapter.lookupCarrier("9000001");
    expect(lookup.status).toBe("found");
    if (lookup.status !== "found") throw new Error("unreachable");
    expect(lookup.source).toBe("fixture");
    expect(lookup.sourceUrl).toBe("fixture://fmcsa/carriers/9000001");
    expect(lookup.record).toMatchObject({
      legalName: "Demo Lone Star Relocation Co.",
      usdotStatus: "active",
      outOfService: false,
      physicalAddress: { line1: "1201 Demo Parkway", city: "Austin", state: "TX", zip: "78704" },
      phone: "+15125550101",
      authorities: [{ docket: "MC-9000001", type: "common", scope: "household_goods", status: "active" }],
      insurance: { bipdOnFile: true, cargoOnFile: true },
      recentChanges: [],
    });
    for (let n = 1; n <= 15; n++) {
      const record = fixtureRecord(String(9_000_000 + n));
      expect(record?.authorities.some((a) => a.type === "broker")).toBe(false);
    }
  });

  it("matches the seeded companies' names and addresses", async () => {
    const rows = await pool().query<{ usdot_number: string; legal_name: string; address_line1: string; address_zip: string; phone: string }>(
      "select usdot_number, legal_name, address_line1, address_zip, phone from companies where usdot_number between '9000001' and '9000017'",
    );
    expect(rows.rowCount).toBe(17);
    for (const row of rows.rows) {
      const record = fixtureRecord(row.usdot_number)!;
      if (row.usdot_number !== "9000016") expect(record.legalName).toBe(row.legal_name);
      expect(record.physicalAddress).toMatchObject({ line1: row.address_line1, zip: row.address_zip });
      expect(record.phone).toBe(row.phone);
    }
  });

  it("covers the documented special numbers", () => {
    expect(fixtureRecord("9000016")).toMatchObject({ legalName: "Demo Prairie Wind Moving & Storage", recentChanges: ["mailing_address"] });
    expect(fixtureRecord("9000017")!.authorities.map((a) => a.type)).toEqual(["common", "broker"]);
    expect(fixtureRecord("9000090")).toMatchObject({ authorities: [{ type: "broker" }], insurance: { bipdOnFile: false, bondOnFile: true } });
    expect(fixtureRecord("9000091")!.authorities.map((a) => `${a.type}:${a.docket}`)).toEqual(["common:MC-9000091", "broker:MC-9100091"]);
    expect(fixtureRecord("9000095")?.outOfService).toBe(true);
    expect(fixtureRecord("9000096")?.usdotStatus).toBe("inactive");
    expect(fixtureRecord("9000097")?.authorities[0]?.status).toBe("revoked");
    expect(fixtureRecord("9000098")?.insurance.cargoOnFile).toBe(false);
    expect(fixtureRecord("9000099")?.authorities[0]?.status).toBe("pending");
    expect(fixtureRecord("9000042")).toMatchObject({ legalName: "Demo Fixture Carrier 9000042", authorities: [{ type: "common", status: "active" }] });
  });

  it("answers 'needs manual review' outside the fixture range", async () => {
    for (const usdot of ["1234567", "9000000", "9000100", "abc"]) {
      const lookup = await fixtureAdapter.lookupCarrier(usdot);
      expect(lookup.status).toBe("unavailable");
    }
  });
});

describe("assessing a record", () => {
  const app = (overrides: Partial<ApplicationFacts> = {}): ApplicationFacts => ({
    legalName: "Demo Fixture Carrier 9000042",
    dbaName: null,
    usdot: "9000042",
    mcNumber: "MC-9000042",
    address: { line1: "100 Demo Fixture Rd.", city: "Austin", state: "TX", zip: "78701" },
    phone: null,
    ...overrides,
  });
  const assess = async (usdot: string, facts = app({ usdot, mcNumber: `MC-${usdot}` })) =>
    results(assessCarrier(await fixtureAdapter.lookupCarrier(usdot), facts, { requireMcNumber: true }));

  it("passes a clean carrier on every automated check", async () => {
    expect(await assess("9000042")).toEqual({
      usdot_active: "pass",
      identity_match: "pass",
      authority_type: "pass",
      authority_status: "pass",
      insurance_filings: "pass",
      recent_record_changes: "pass",
    });
  });

  it("fails brokers and dual registrations, and flags mismatches for review", async () => {
    expect(await assess("9000090")).toMatchObject({ authority_type: "fail", authority_status: "fail", insurance_filings: "fail" });
    expect(await assess("9000091")).toMatchObject({ authority_type: "fail" });
    expect(await assess("9000095")).toMatchObject({ usdot_active: "fail" });
    expect(await assess("9000096")).toMatchObject({ usdot_active: "fail" });
    expect(await assess("9000097")).toMatchObject({ authority_status: "fail", authority_type: "pass" });
    expect(await assess("9000098")).toMatchObject({ insurance_filings: "fail" });
    expect(await assess("9000099")).toMatchObject({ authority_status: "fail" });
    expect(await assess("9000042", app({ legalName: "Totally Different Movers" }))).toMatchObject({ identity_match: "needs_review" });
    expect(await assess("9000042", app({ address: null }))).toMatchObject({ identity_match: "needs_review" });
    expect(await assess("9000042", app({ mcNumber: "MC-1234" }))).toMatchObject({ identity_match: "needs_review" });
  });

  it("records every check as needing review when the lookup is unavailable", async () => {
    const outcomes = assessCarrier(await fixtureAdapter.lookupCarrier("1234567"), app({ usdot: "1234567" }), { requireMcNumber: true });
    expect(new Set(outcomes.map((o) => o.result))).toEqual(new Set(["needs_review"]));
    expect(outcomes).toHaveLength(6);
  });

  it("normalizes company names before comparing", () => {
    expect(normalizeCompanyName("Demo Lone Star Relocation Co.")).toBe("demo lone star relocation");
    expect(normalizeCompanyName("A & B Movers, L.L.C.")).toBe("a and b movers");
    expect(similarity("demo prairie wind movers", "demo prairie wind moving and storage")).toBeLessThan(0.92);
  });
});

describe("live QCMobile adapter (mapped defensively)", () => {
  const carrierBody = {
    content: {
      carrier: {
        dotNumber: 1234567,
        legalName: "EXAMPLE VAN LINES LLC",
        dbaName: null,
        allowedToOperate: "Y",
        statusCode: "A",
        phyStreet: "1 MAIN ST",
        phyCity: "AUSTIN",
        phyState: "TX",
        phyZipcode: "78701-1234",
        bipdInsuranceOnFile: "750",
        cargoInsuranceOnFile: "5",
        bondInsuranceOnFile: "0",
      },
    },
  };
  const authorityBody = {
    content: [
      { carrierAuthority: { docketNumber: 123456, prefix: "MC", authorizedForHouseholdGoods: "Y", commonAuthorityStatus: "A", contractAuthorityStatus: "N", brokerAuthorityStatus: "N" } },
    ],
  };

  it("maps the reported field names", () => {
    const record = mapQcMobile("1234567", carrierBody, authorityBody, { content: [{ docketNumber: 123456, prefix: "MC" }] });
    expect(record).toMatchObject({
      legalName: "EXAMPLE VAN LINES LLC",
      usdotStatus: "active",
      outOfService: false,
      physicalAddress: { zip: "78701" },
      authorities: [{ docket: "MC-123456", type: "common", scope: "household_goods", status: "active" }],
      insurance: { bipdOnFile: true, cargoOnFile: true, bondOnFile: false },
      recentChanges: null,
    });
  });

  it("turns unknown fields into review items, never passes", () => {
    const record = mapQcMobile("1234567", { content: { carrier: { dotNumber: 1234567, legalName: "X" } } }, null, null)!;
    expect(record).toMatchObject({ usdotStatus: "unknown", outOfService: null, authorities: [], insurance: { bipdOnFile: null } });
    const lookup: FmcsaLookup = { status: "found", record, source: "fmcsa_qcmobile", sourceUrl: "x", retrievedAt: new Date(), raw: null };
    const outcome = results(assessCarrier(lookup, { legalName: "X", dbaName: null, usdot: "1234567", mcNumber: null, address: null, phone: null }, { requireMcNumber: false }));
    expect(outcome).toMatchObject({ usdot_active: "needs_review", authority_type: "needs_review", insurance_filings: "needs_review", recent_record_changes: "needs_review" });
    expect(Object.values(outcome)).not.toContain("pass");
  });

  it("never puts the WebKey in the source URL or the snapshot", async () => {
    const calls: string[] = [];
    const fakeFetch = (async (url: string | URL | Request) => {
      calls.push(String(url));
      const path = String(url);
      const body = path.includes("/authority") ? authorityBody : path.includes("/docket-numbers") ? { content: [] } : carrierBody;
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    const lookup = await qcMobileAdapter("SECRET-WEBKEY", fakeFetch).lookupCarrier("1234567");
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.includes("webKey=SECRET-WEBKEY"))).toBe(true);
    expect(lookup.status).toBe("found");
    expect(lookup.sourceUrl).toBe("https://mobile.fmcsa.dot.gov/qc/services/carriers/1234567");
    expect(JSON.stringify(lookup)).not.toContain("SECRET-WEBKEY");

    const missing = await qcMobileAdapter("K", (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch).lookupCarrier("7654321");
    expect(missing.status).toBe("not_found");
    const down = await qcMobileAdapter("K", (async () => { throw new TypeError("fetch failed"); }) as typeof fetch).lookupCarrier("7654321");
    expect(down.status).toBe("unavailable");
  });
});

describe("runAutomatedChecks", () => {
  const countChecks = async (companyId: string) =>
    Number((await pool().query<{ n: string }>("select count(*) as n from verification_checks where company_id = $1", [companyId])).rows[0]!.n);

  it("appends passing checks for a clean seeded carrier and refreshes its credentials", async () => {
    const before = await countChecks(company(1));
    const summary = await runAutomatedChecks(company(1));
    expect(summary).toMatchObject({ usdot: "9000001", source: "fixture", lookup: "found", outcome: "pass", hasBrokerAuthority: false });
    expect(summary.checks).toHaveLength(6);
    expect(await countChecks(company(1))).toBe(before + 6);

    const row = await pool().query<{ source: string; source_url: string; payload_sha256: string; result: string; reviewer_id: string | null }>(
      "select source, source_url, payload_sha256, result, reviewer_id from verification_checks where id = $1",
      [summary.checks[0]!.id],
    );
    expect(row.rows[0]).toMatchObject({ source: "fixture", source_url: "fixture://fmcsa/carriers/9000001", result: "pass", reviewer_id: null });
    expect(row.rows[0]!.payload_sha256).toMatch(/^[0-9a-f]{64}$/);

    const credentials = await pool().query<{ credential_type: string; status: string; verified_at: Date }>(
      "select credential_type, status, verified_at from credentials where company_id = $1 and credential_type in ('usdot', 'docket', 'insurance_filing')",
      [company(1)],
    );
    expect(credentials.rows.map((c) => c.status)).toEqual(["verified", "verified", "verified"]);
    for (const c of credentials.rows) expect(Date.now() - c.verified_at.getTime()).toBeLessThan(60_000);

    const authority = await pool().query("select docket_number, authority_type, status from authority_records where company_id = $1 order by created_at desc limit 1", [company(1)]);
    expect(authority.rows[0]).toEqual({ docket_number: "MC-9000001", authority_type: "common", status: "active" });
    const audited = await pool().query("select 1 from audit_log where action = 'verification.automated_checks' and company_id = $1", [company(1)]);
    expect(audited.rowCount).toBe(1);
  });

  it("flags the applicant in review and fails the dual-registration company", async () => {
    const inReview = await runAutomatedChecks(company(16));
    expect(Object.fromEntries(inReview.checks.map((c) => [c.checkType, c.result]))).toMatchObject({
      identity_match: "needs_review",
      recent_record_changes: "needs_review",
      authority_type: "pass",
    });
    expect(inReview.outcome).toBe("needs_review");

    const dual = await runAutomatedChecks(company(17));
    expect(dual.outcome).toBe("fail");
    expect(dual.checks.find((c) => c.checkType === "authority_type")?.result).toBe("fail");
    const row = await pool().query<{ has_broker_authority: boolean }>("select has_broker_authority from companies where id = $1", [company(17)]);
    expect(row.rows[0]!.has_broker_authority).toBe(true);
    const docket = await pool().query<{ status: string }>("select status from credentials where company_id = $1 and credential_type = 'docket'", [company(17)]);
    expect(docket.rows[0]!.status).toBe("rejected");
  });

  it("keeps verification evidence append-only", async () => {
    await expect(pool().query("update verification_checks set result = 'pass' where company_id = $1", [company(17)])).rejects.toThrow(/append_only/);
    await expect(pool().query("delete from verification_checks where company_id = $1", [company(17)])).rejects.toThrow(/append_only/);
  });

  it("marks a broker-only applicant as a broker and a number outside the fixtures for review", async () => {
    const broker = await signupCompany({
      fullName: "Bea Broker", email: "broker@example.com", password: "broker-password-1", legalName: "Demo Broker Only 9000090",
      usdot: "9000090", mc: "MC-9000090", phone: "512-555-0190",
    });
    const brokerRun = await runAutomatedChecks(broker.companyId, { actor: { userId: broker.userId } });
    expect(brokerRun.hasBrokerAuthority).toBe(true);
    const brokerEligibility = await getCompanyEligibility(broker.companyId);
    expect(brokerEligibility.approvable).toBe(false);
    expect(brokerEligibility.blockers.join(" ")).toMatch(/Broker authority/);

    const unknown = await signupCompany({
      fullName: "Una Known", email: "unknown@example.com", password: "unknown-password-1", legalName: "Real World Movers",
      usdot: "1234567", mc: "MC-1234567", phone: "512-555-0191",
    });
    const unknownRun = await runAutomatedChecks(unknown.companyId);
    expect(unknownRun.lookup).toBe("unavailable");
    expect(unknownRun.outcome).toBe("needs_review");
    expect(unknownRun.hasBrokerAuthority).toBeNull();
    const latest = await latestChecks(unknown.companyId);
    expect(latest.get("usdot_active")?.decisionNote).toMatch(/9000001–9000099/);
  });

  it("evaluates eligibility from the latest checks", async () => {
    const approved = await getCompanyEligibility(company(1));
    expect(approved).toEqual({ approvable: true, canPurchase: true, blockers: [], failed: [], pending: [] });
    const inReview = await getCompanyEligibility(company(16));
    expect(inReview.approvable).toBe(false);
    expect(inReview.pending).toEqual(expect.arrayContaining(["identity_match", "recent_record_changes", "callback_verification"]));

    const pure = evaluateEligibility({
      company: { status: "approved", usdotNumber: "1", mcNumber: null, hasBrokerAuthority: false, billingStatus: "good", credentialsValidUntil: "2020-01-01" },
      checks: { usdot_active: "fail" },
      requireMcNumber: true,
      today: new Date("2026-10-28T00:00:00Z"),
    });
    expect(pure.canPurchase).toBe(false);
    expect(pure.failed).toEqual(["usdot_active"]);
    expect(pure.blockers[0]).toMatch(/MC number/);
    expect(fmcsaSnapshotUrl("9000001")).toContain("query_string=9000001");
  });
});
