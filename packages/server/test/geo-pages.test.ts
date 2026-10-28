/** Slice S4: location-page gates (site architecture §4.1) and the /movers/ ZIP coverage check. */
import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { evaluateGates } from "../src/geo-pages/gates";
import { countCityMovers, countStateHubMovers, coverageForZip, evaluateCityPage, evaluateStateHub, publishedStateHubs } from "../src/geo-pages/queries";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await getPool().query(seed.sql);
});

afterAll(async () => {
  await closePool();
});

describe("evaluateGates", () => {
  it("passes G1 at the family threshold and fails every gate whose data doesn't exist yet", () => {
    const hub = evaluateGates("state_hub", { approvedMoversWithCoverage: 5 });
    expect(hub.passing).toEqual(["G1", "G2", "G4"]);
    expect(hub.publishable).toBe(false);
    expect(evaluateGates("state_hub", { approvedMoversWithCoverage: 4 }).passing).not.toContain("G1");
    const city = evaluateGates("city", { approvedMoversWithCoverage: 3 });
    expect(city.passing).toEqual(["G1"]);
    expect(city.gates.find((g) => g.id === "G3")?.detail).toMatch(/facts registry/);
  });

  it("publishes only when every gate passes", () => {
    const inputs = {
      approvedMoversWithCoverage: 3,
      demandEvidence: 120,
      verifiedFacts: 3,
      costBlockSourced: true,
      originalDataPoints: 1,
      uniqueFaqs: 4,
      uniqueContentShare: 0.45,
      swapTestPassed: true,
      humanReviewer: { name: "Reviewer", reviewedAt: new Date() },
      technicalPassed: true,
    };
    expect(evaluateGates("city", inputs).publishable).toBe(true);
    expect(evaluateGates("city", { ...inputs, approvedMoversWithCoverage: 2 }).publishable).toBe(false);
    expect(evaluateGates("city", { ...inputs, uniqueContentShare: 0.3 }).publishable).toBe(false);
  });
});

describe("G1 counts from the seed's coverage", () => {
  it("counts explicit state coverage for hubs, never nationwide rules", async () => {
    // Companies 1–5 name Texas; company 5's nationwide interstate rule doesn't add anyone.
    expect(await countStateHubMovers("TX")).toBe(5);
    expect(await countStateHubMovers("GA")).toBe(0);
  });

  it("counts only explicit county or ZIP inclusions with local capability for cities", async () => {
    // Los Angeles County: four movers have local rules naming the county (one Orange County rule is paused).
    expect(await countCityMovers("06037")).toBe(4);
    // Travis County, Texas: only statewide rules, which never count for a city.
    expect(await countCityMovers("48453")).toBe(0);
  });

  it("publishes nothing in the preview", async () => {
    const texas = await evaluateStateHub("texas");
    expect(texas?.evaluation.passing).toContain("G1");
    expect(texas?.evaluation.publishable).toBe(false);
    expect(await evaluateStateHub("atlantis")).toBeNull();
    expect((await evaluateCityPage("06037"))?.publishable).toBe(false);
    expect(await publishedStateHubs()).toEqual([]);
  });
});

describe("coverageForZip", () => {
  it("reports the state's coverage without needing the ZIP again", async () => {
    const austin = await coverageForZip("78704");
    expect(austin).toMatchObject({ status: "ok", stateName: "Texas", explicitInState: 5 });
    if (austin.status !== "ok") throw new Error("unreachable");
    expect(austin.moversStartingInState).toBeGreaterThanOrEqual(5);
    const georgia = await coverageForZip("30303");
    expect(georgia).toMatchObject({ status: "ok", stateName: "Georgia", explicitInState: 0 });
    expect(await coverageForZip("7870")).toEqual({ status: "invalid" });
    expect(await coverageForZip("00000")).toEqual({ status: "unknown" });
  });
});
