import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUser, resetDatabase } from "../../test/helpers";
import { closePool, getPool } from "../db/pool";
import { PermissionError } from "../companies/permissions";
import { deleteCoverageRule, getCoverage, saveCoverageRule, setRulesPaused, testMove, updateCapabilities, bundledGeo } from "./coverage";
import { coverageRuleSchema, describeLocationSet, matchReasonText, ruleCapabilityProblems, splitZipList } from "./schema";

const pool = () => getPool();
const LONE_STAR = "c0000000-0000-4000-8000-000000000001";
const OWNER = "a0000000-0000-4000-8000-000000000002";
const owner = { userId: OWNER, companyId: LONE_STAR };
const version = async () => (await pool().query("select coverage_version from companies where id = $1", [LONE_STAR])).rows[0].coverage_version as number;

describe("coverage rule validation", () => {
  const schema = coverageRuleSchema(bundledGeo);

  it("accepts states, counties of the geo module and known ZIP codes, deduplicated and sorted", () => {
    const parsed = schema.parse({
      kind: "include",
      label: "  Austin metro  ",
      origin: { states: ["tx"], counties: ["48453", "48453"], zips: ["78704", "78701"] },
      moveTypes: ["local", "local"],
    });
    expect(parsed).toMatchObject({
      label: "Austin metro",
      origin: { states: ["TX"], counties: ["48453"], zips: ["78701", "78704"] },
      destination: { states: [], counties: [], zips: [] },
      moveTypes: ["local"],
      paused: false,
    });
  });

  it("rejects unknown states, counties and ZIP codes", () => {
    const result = schema.safeParse({ kind: "include", origin: { states: ["ZZ"], counties: ["99999"], zips: ["00000"] } });
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages.join(" ")).toMatch(/state "ZZ"/);
    expect(messages.join(" ")).toMatch(/county code "99999"/);
    expect(messages.join(" ")).toMatch(/ZIP code "00000"/);
    expect(schema.safeParse({ kind: "maybe" }).success).toBe(false);
  });

  it("splits pasted ZIP lists and explains matcher reasons", () => {
    expect(splitZipList("78701, 78702\n78701 7870 02108-1234")).toEqual({ zips: ["78701", "78702", "02108"], invalid: ["7870"] });
    expect(matchReasonText("excluded_by:r1", () => "No Houston")).toMatch(/"No Houston"/);
    expect(matchReasonText("no_matching_coverage", () => null)).toMatch(/None of your active coverage rules/);
    expect(describeLocationSet({ states: ["TX"], counties: ["48453"], zips: [] }, () => "Travis County")).toBe("TX; Travis County");
    expect(ruleCapabilityProblems({ moveTypes: ["interstate"], moveSizes: [], services: [] }, { moveTypes: ["local"], moveSizes: ["1br"], services: ["packing"] })).toHaveLength(1);
  });
});

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password-s5",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password-s5",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
});

afterAll(async () => {
  await closePool();
});

describe("coverage (database)", () => {
  it("the test tool matches a seeded route with the seeded rules", async () => {
    const result = await testMove(owner, { fromZip: "78704", toZip: "77007", moveSize: "2br", services: ["full_service"] });
    expect(result).toMatchObject({
      ok: true,
      moveType: "intrastate",
      matches: true,
      matchedRule: { label: "Texas statewide: local and intrastate" },
      canPurchase: true,
      origin: { city: "Austin", state: "TX" },
    });
    const interstate = await testMove(owner, { fromZip: "78704", toZip: "33130", moveSize: "2br", services: [] });
    expect(interstate).toMatchObject({ ok: true, moveType: "interstate", matches: true, matchedRule: { label: "Texas to Florida (interstate)" } });
    const outside = await testMove(owner, { fromZip: "90012", toZip: "92618", moveSize: "2br", services: [] });
    expect(outside).toMatchObject({ ok: true, matches: false, reason: expect.stringMatching(/None of your active coverage rules/) });
    const service = await testMove(owner, { fromZip: "78704", toZip: "77007", moveSize: "2br", services: ["auto_transport"] });
    expect(service).toMatchObject({ ok: true, matches: false, reason: expect.stringMatching(/every service/) });
    expect(await testMove(owner, { fromZip: "00000", toZip: "77007", moveSize: "2br", services: [] })).toMatchObject({ ok: false });
  });

  it("creating, editing, pausing and deleting rules bump coverage_version and are audited", async () => {
    const start = await version();
    const created = await saveCoverageRule(owner, null, { kind: "exclude", label: "No Houston pickups", origin: { counties: ["48201"] } }, { ip: "203.0.113.9" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.coverageVersion).toBeGreaterThan(start);

    const excluded = await testMove(owner, { fromZip: "77007", toZip: "78704", moveSize: "2br", services: [] });
    expect(excluded).toMatchObject({ ok: true, matches: false, reason: expect.stringMatching(/"No Houston pickups"/) });

    const v1 = await version();
    const edited = await saveCoverageRule(owner, created.ruleId, { kind: "exclude", label: "No Houston pickups", origin: { zips: ["77007"] }, paused: false });
    expect(edited.ok).toBe(true);
    expect(await version()).toBeGreaterThan(v1);
    const coverage = await getCoverage(owner);
    expect(coverage.rules.find((r) => r.id === created.ruleId)?.origin).toEqual({ states: [], counties: [], zips: ["77007"] });

    const v2 = await version();
    expect(await setRulesPaused(owner, created.ruleId, true)).toBe(1);
    expect(await version()).toBeGreaterThan(v2);
    expect(await testMove(owner, { fromZip: "77007", toZip: "78704", moveSize: "2br", services: [] })).toMatchObject({ matches: true });

    expect(await deleteCoverageRule(owner, created.ruleId)).toBe(true);
    const audits = await pool().query("select action from audit_log where company_id = $1 and action like 'coverage.%' order by id", [LONE_STAR]);
    expect(audits.rows.map((r) => r.action)).toEqual(["coverage.rule_created", "coverage.rule_updated", "coverage.paused", "coverage.rule_deleted"]);
  });

  it("validates on the server: capability ceiling, empty exclusions, other companies' rules", async () => {
    const wider = await saveCoverageRule(owner, null, { kind: "include", moveTypes: ["local"], services: ["auto_transport"] });
    expect(wider).toMatchObject({ ok: false, errors: [expect.stringMatching(/Vehicle transport/)] });
    expect(await saveCoverageRule(owner, null, { kind: "exclude" })).toMatchObject({ ok: false });
    const other = (await pool().query("select id from coverage_rules where company_id <> $1 limit 1", [LONE_STAR])).rows[0].id as string;
    expect(await saveCoverageRule(owner, other, { kind: "include", origin: { states: ["TX"] } })).toEqual({ ok: false, errors: ["That rule doesn't exist."] });
    expect(await deleteCoverageRule(owner, other)).toBe(false);
    expect(await setRulesPaused(owner, other, true)).toBe(0);
  });

  it("pause all and resume all", async () => {
    const paused = await setRulesPaused(owner, null, true);
    expect(paused).toBeGreaterThan(0);
    expect(await testMove(owner, { fromZip: "78704", toZip: "77007", moveSize: "2br", services: [] })).toMatchObject({ matches: false });
    expect(await setRulesPaused(owner, null, false)).toBe(paused);
  });

  it("updates capabilities with validation", async () => {
    expect(await updateCapabilities(owner, { moveTypes: [], moveSizes: ["1br"], services: ["packing"] })).toMatchObject({ ok: false, fieldErrors: { moveTypes: expect.any(String) } });
    const v = await version();
    const result = await updateCapabilities(owner, { moveTypes: ["local", "intrastate", "interstate"], moveSizes: ["studio", "1br", "2br", "3br", "4br_plus"], services: ["full_service", "packing", "storage", "specialty_items", "auto_transport"] });
    expect(result.ok).toBe(true);
    expect(await version()).toBeGreaterThan(v);
  });

  it("refuses agents and other companies' members", async () => {
    const agent = await createUser({ email: "agent@demo-lone-star.invalid" });
    await pool().query("insert into company_memberships (company_id, user_id, role) values ($1, $2, 'agent')", [LONE_STAR, agent]);
    const asAgent = { userId: agent, companyId: LONE_STAR };
    await expect(getCoverage(asAgent)).rejects.toBeInstanceOf(PermissionError);
    await expect(saveCoverageRule(asAgent, null, { kind: "include", origin: { states: ["TX"] } })).rejects.toBeInstanceOf(PermissionError);
    await expect(testMove(asAgent, { fromZip: "78704", toZip: "77007", moveSize: "2br", services: [] })).rejects.toBeInstanceOf(PermissionError);
    await expect(getCoverage({ userId: OWNER, companyId: "c0000000-0000-4000-8000-000000000002" })).rejects.toBeInstanceOf(PermissionError);
  });
});
