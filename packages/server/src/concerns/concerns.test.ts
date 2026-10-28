// Database test for public concern reports. It lives beside the module because slice S1 owns
// src/concerns only; it uses the package's test setup (test/setup.ts points at the test database).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetDatabase } from "../../test/helpers";
import { closePool, getPool } from "../db/pool";
import { CONCERN_RATE_LIMIT, concernRateLimit, createConcernCase } from "./concerns";
import { concernFieldErrors, concernInputSchema, parseCarrierNumber } from "./schema";

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

const valid = {
  caseType: "broker_activity",
  company: "",
  description: "The company said another carrier would do my move on the day.",
  name: "",
  email: "",
  phone: "",
};

describe("concern form validation", () => {
  it("accepts a minimal anonymous report and turns blanks into null", () => {
    const parsed = concernInputSchema.parse(valid);
    expect(parsed).toEqual({ ...valid, company: null, name: null, email: null, phone: null });
  });

  it("rejects unknown types, short descriptions, bad email and phone, and extra fields", () => {
    const result = concernInputSchema.safeParse({ ...valid, caseType: "billing", description: "short", email: "nope", phone: "12" });
    expect(result.success).toBe(false);
    const errors = concernFieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(["caseType", "description", "email", "phone"]);
    expect(concernInputSchema.safeParse({ ...valid, status: "resolved" }).success).toBe(false);
  });

  it("reads USDOT and MC numbers only when the text is just the number", () => {
    expect(parseCarrierNumber("USDOT 9000001")).toEqual({ kind: "usdot", number: "9000001" });
    expect(parseCarrierNumber("MC-123456")).toEqual({ kind: "mc", number: "123456" });
    expect(parseCarrierNumber("1234567")).toEqual({ kind: "usdot", number: "1234567" });
    expect(parseCarrierNumber("Acme Moving 1234567")).toBeNull();
    expect(parseCarrierNumber(null)).toBeNull();
  });
});

describe("createConcernCase", () => {
  it("creates an open public case with a reference and an audit entry without contact details", async () => {
    const input = concernInputSchema.parse({ ...valid, name: "Pat Example", email: "Pat@Example.com", phone: "555-123-4567", company: "Fast Lane Movers" });
    const result = await createConcernCase(input, { ip: "203.0.113.9" });
    expect(result.reference).toMatch(/^CASE-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);

    const row = (await getPool().query("select * from cases where id = $1", [result.caseId])).rows[0];
    expect(row).toMatchObject({
      case_type: "broker_activity",
      status: "open",
      source: "public_form",
      reference_code: result.reference,
      reported_company: "Fast Lane Movers",
      company_id: null,
      reporter_name: "Pat Example",
      reporter_email: "pat@example.com",
      reporter_phone: "555-123-4567",
    });

    const entry = (await getPool().query("select * from audit_log where entity = 'case' and entity_id = $1", [result.caseId])).rows[0];
    expect(entry).toMatchObject({ actor_type: "consumer", action: "case.report" });
    const serialized = JSON.stringify(entry.after);
    for (const secret of ["Pat", "example.com", "555", "another carrier"]) expect(serialized).not.toContain(secret);
  });

  it("links the case to a company only on an exact USDOT match", async () => {
    const company = (
      await getPool().query<{ id: string }>("insert into companies (legal_name, usdot_number, mc_number) values ('Example Carrier LLC', '9000042', 'MC-424242') returning id")
    ).rows[0]!;
    const byDot = await createConcernCase(concernInputSchema.parse({ ...valid, caseType: "credential", company: "USDOT 9000042" }));
    const byMc = await createConcernCase(concernInputSchema.parse({ ...valid, caseType: "credential", company: "MC 424242" }));
    const byName = await createConcernCase(concernInputSchema.parse({ ...valid, caseType: "credential", company: "Example Carrier" }));
    const ids = await getPool().query<{ id: string; company_id: string | null }>("select id, company_id from cases where id = any($1)", [
      [byDot.caseId, byMc.caseId, byName.caseId],
    ]);
    const companyOf = (id: string) => ids.rows.find((row) => row.id === id)?.company_id;
    expect(companyOf(byDot.caseId)).toBe(company.id);
    expect(companyOf(byMc.caseId)).toBe(company.id);
    expect(companyOf(byName.caseId)).toBeNull();
  });

  it("gives every case a distinct reference", async () => {
    const refs = await getPool().query<{ n: number; d: number }>("select count(*)::int as n, count(distinct reference_code)::int as d from cases");
    expect(refs.rows[0]!.n).toBe(refs.rows[0]!.d);
  });

  it("rate-limits reports per IP", async () => {
    const results = [];
    for (let i = 0; i <= CONCERN_RATE_LIMIT.limit; i += 1) results.push((await concernRateLimit("198.51.100.7")).allowed);
    expect(results.slice(0, CONCERN_RATE_LIMIT.limit).every(Boolean)).toBe(true);
    expect(results.at(-1)).toBe(false);
    expect((await concernRateLimit("198.51.100.8")).allowed).toBe(true);
    const keys = await getPool().query<{ key: string }>("select key from rate_limits where key like 'concern:ip:%'");
    for (const { key } of keys.rows) expect(key).not.toContain("198.51");
  });
});
