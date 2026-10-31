/**
 * Rate cards and the calculator against explicitly non-demo test fixtures (slice S3 acceptance):
 * Dallas 75201 to Houston 77002, 2 bedrooms, gives a range from at least 5 movers; a Wyoming pair
 * gives no range; saving a card supersedes the old one and changes the output.
 */
import { randomBytes } from "node:crypto";
import { queryFromSurveyPrefill, surveyPrefillFor, type CostRange } from "@amc/core";
import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../db/pool";
import { resetDatabase } from "../../test/helpers";
import { RateCardValidationError, calculatorRange, checkRoute, getActiveRateCard, listRateCards, loadAreaRateCards, saveRateCard } from "./rates";
import { parseRateCardForm, rateCardToFormValues, type RateCardData } from "./schema";
import { rateCardMoversByState } from "../seo/network";
import { pipelineCounts } from "../seo/publish";

const DALLAS_HOUSTON = { origin: "75201", destination: "77002", size: "2br", services: [] as string[] };
let ownerId: string;
let companyId: string;

const q = async <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) => (await getPool().query<R>(sql, params)).rows;

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: `admin-${randomBytes(12).toString("base64url")}`,
    moverEmail: "owner@demo.invalid",
    moverPassword: `mover-${randomBytes(12).toString("base64url")}`,
    bcryptCost: 4,
  });
  await getPool().query(seed.body);
  const [owner] = await q<{ user_id: string; company_id: string }>(
    `select m.user_id, m.company_id from company_memberships m join users u on u.id = m.user_id where u.email = 'owner@demo.invalid'`,
  );
  ownerId = owner!.user_id;
  companyId = owner!.company_id;
  // These are isolated calculation fixtures, not a change to the production/demo seed.
  // Mark the test card owners explicitly live so the range tests exercise real-evidence logic.
  await getPool().query("update companies c set is_demo = false where exists(select 1 from rate_cards rc where rc.company_id = c.id)");
});

afterAll(async () => {
  await closePool();
});

describe("calculatorRange with non-demo rate fixtures", () => {
  it("never counts demo cards as live evidence or toward the five-company cost threshold", async () => {
    const db = getPool();
    const eligible = await loadAreaRateCards("TX");
    expect(eligible.length).toBeGreaterThanOrEqual(5);
    const ids = eligible.map(card => card.companyId);
    const allCardOwnerIds = (await q<{ company_id: string }>("select distinct company_id from rate_cards")).map(row => row.company_id);
    try {
      await db.query("update companies set is_demo = true where id = any($1::uuid[])", [allCardOwnerIds]);
      expect(await loadAreaRateCards("TX")).toEqual([]);
      expect((await rateCardMoversByState(db)).get("TX") ?? 0).toBe(0);
      expect((await pipelineCounts(db)).find(row => row.family === "cost")?.planned).toBe(2);
      const onlyDemo = await calculatorRange(DALLAS_HOUSTON);
      expect(onlyDemo.status === "ok" && onlyDemo.result).toMatchObject({ kind: "no_data", cause: "too_few_movers", moverCount: 0 });

      await db.query("update companies set is_demo = false where id = any($1::uuid[])", [ids.slice(0, 4)]);
      expect(await loadAreaRateCards("TX")).toHaveLength(4);
      expect((await rateCardMoversByState(db)).get("TX")).toBe(4);
      expect((await pipelineCounts(db)).find(row => row.family === "cost")?.planned).toBe(2);
      const fourReal = await calculatorRange(DALLAS_HOUSTON);
      expect(fourReal.status === "ok" && fourReal.result).toMatchObject({ kind: "no_data", cause: "too_few_movers", moverCount: 4 });

      await db.query("update companies set is_demo = false where id = $1", [ids[4]]);
      expect((await rateCardMoversByState(db)).get("TX")).toBe(5);
      expect((await pipelineCounts(db)).find(row => row.family === "cost")?.planned).toBeGreaterThan(2);
      const fiveReal = await calculatorRange(DALLAS_HOUSTON);
      expect(fiveReal.status === "ok" && fiveReal.result).toMatchObject({ kind: "range", moverCount: 5 });
    } finally {
      await db.query("update companies set is_demo = false where id = any($1::uuid[])", [allCardOwnerIds]);
    }
  });

  it("gives Dallas 75201 to Houston 77002, 2 bedrooms, a range from at least 5 movers", async () => {
    const outcome = await calculatorRange(DALLAS_HOUSTON);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.route).toMatchObject({ origin: { city: "Dallas", state: "TX" }, destination: { city: "Houston", state: "TX" }, moveType: "intrastate" });
    expect(outcome.route.miles).toBeGreaterThan(200);
    const result = outcome.result as CostRange;
    expect(result).toMatchObject({ kind: "range", band: "0_250", homeSize: "2br", modelVersion: "cost-model-v1", area: { state: "TX", name: "Texas" } });
    expect(result.moverCount).toBeGreaterThanOrEqual(5);
    expect(result.lowCents).toBeLessThan(result.highCents);
    expect(result.lowCents % 10_000).toBe(0);
    // As of the oldest contributing card.
    const [oldest] = await q<{ at: Date }>(
      `select min(rc.created_at) as at from rate_cards rc join companies c on c.id = rc.company_id
        where rc.status = 'active' and 'TX' = any(rc.states) and c.status = 'approved'`,
    );
    expect(result.asOf).toBe(oldest!.at.toISOString());
  });

  it("gives a Wyoming ZIP pair no range", async () => {
    const outcome = await calculatorRange({ origin: "82001", destination: "82601", size: "2br", services: [] });
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.route).toMatchObject({ origin: { state: "WY" }, destination: { state: "WY" }, moveType: "intrastate" });
    expect(outcome.result).toMatchObject({ kind: "no_data", cause: "too_few_movers", moverCount: 0, area: { name: "Wyoming" } });
  });

  it("names picked services when they are the cause, and gives office moves no range", async () => {
    const withServices = await calculatorRange({ ...DALLAS_HOUSTON, services: ["packing", "storage", "specialty_items"] });
    expect(withServices.status === "ok" && withServices.result).toMatchObject({ kind: "no_data", cause: "services" });
    const office = await calculatorRange({ ...DALLAS_HOUSTON, size: "office" });
    expect(office.status === "ok" && office.result).toMatchObject({ kind: "size_unpriced" });
  });

  it("returns the copy's field errors", async () => {
    expect(await calculatorRange({ origin: "", destination: "M5V 2T6", size: null, services: [] })).toEqual({
      status: "invalid",
      errors: { origin: { id: "error.origin.required" }, destination: { id: "error.zip.non_us" }, size: { id: "error.size.required" } },
    });
    expect(await calculatorRange({ origin: "00000", destination: "00901", size: "2br", services: [] })).toEqual({
      status: "invalid",
      errors: { origin: { id: "error.zip.unknown", zip: "00000" }, destination: { id: "error.zip.unsupported", zip: "00901" } },
    });
  });

  it("gives the same result through the widget path and the survey-prefill path", async () => {
    const widget = await calculatorRange({ origin: "ZIP 75201", destination: "77002-0001", size: "3br", services: ["storage", "packing"] });
    if (widget.status !== "ok") throw new Error("expected a result");
    const carried = queryFromSurveyPrefill(JSON.parse(JSON.stringify(surveyPrefillFor(widget.query))));
    const results = await calculatorRange({ origin: carried.originZip, destination: carried.destinationZip, size: carried.moveSize, services: carried.services });
    expect(results).toEqual(widget);
  });

  it("checks the route for the summary once both ZIP codes resolve", async () => {
    const partial = await checkRoute("75201", "772");
    expect(partial).toMatchObject({ origin: { status: "resolved", location: { city: "Dallas" } }, destination: { status: "incomplete" }, route: null, localRadiusMiles: 50 });
    const both = await checkRoute("75201", "77002");
    expect(both.route).toMatchObject({ moveType: "intrastate" });
    expect((await checkRoute("99999", "")).origin).toEqual({ status: "error", error: { id: "error.zip.unknown", zip: "99999" } });
  });

  it("leaves suspended and unapproved companies out", async () => {
    const before = await loadAreaRateCards("TX");
    const [victim] = await q<{ id: string }>(
      `select c.id from companies c join rate_cards rc on rc.company_id = c.id and rc.status = 'active'
        where 'TX' = any(rc.states) and c.status = 'approved' and c.id <> $1 order by c.legal_name limit 1`,
      [companyId],
    );
    await getPool().query("update companies set status = 'suspended', suspended_at = now() where id = $1", [victim!.id]);
    try {
      const after = await loadAreaRateCards("TX");
      expect(after.map((c) => c.companyId)).not.toContain(victim!.id);
      expect(after).toHaveLength(before.length - 1);
    } finally {
      await getPool().query("update companies set status = 'approved', suspended_at = null where id = $1", [victim!.id]);
    }
  });
});

const NEW_CARD: RateCardData = {
  states: ["TX"],
  local: {
    crew_hourly_cents: { "2": 15000, "3": 19000, "4": 23000, "5": 27000 },
    travel_fee_cents: 15000,
    hours_by_size: { studio: 3, "1br": 4, "2br": 5.5, "3br": 7.5, "4br_plus": 9.5 },
    crew_by_size: { studio: 2, "1br": 2, "2br": 3, "3br": 3, "4br_plus": 4 },
  },
  long_distance: {
    cwt_cents_by_band: { "0_250": 20000, "250_500": 21000, "500_1000": 22000, "1000_1500": 23000, "1500_plus": 24000 },
    weight_lbs_by_size: { studio: 2000, "1br": 3000, "2br": 4500, "3br": 6500, "4br_plus": 9000 },
  },
  services: { packing_cents_by_size: { "2br": 70000 }, storage_cents_per_month_by_size: null, specialty_item_cents: 40000 },
};

describe("saveRateCard", () => {
  it("supersedes the active card, audits the change and changes the calculator output", async () => {
    const outcomeBefore = await calculatorRange(DALLAS_HOUSTON);
    const previous = await getActiveRateCard(companyId);
    expect(previous).not.toBeNull();

    // Twice the highest seeded rate for 0–250 miles: this mover moves from the middle to the top.
    const saved = await saveRateCard(companyId, NEW_CARD, { userId: ownerId, ip: "203.0.113.9" });
    expect(saved.supersededId).toBe(previous!.id);

    const active = await getActiveRateCard(companyId);
    expect(active).toMatchObject({ id: saved.id, status: "active", states: ["TX"], submittedBy: ownerId, services: NEW_CARD.services });
    const history = await listRateCards(companyId);
    expect(history.map((c) => [c.id, c.status])).toEqual([
      [saved.id, "active"],
      [previous!.id, "superseded"],
    ]);
    const [entry] = await q<{ action: string; actor_id: string; company_id: string; before: { id: string }; after: { id: string } }>(
      "select action, actor_id, company_id, before, after from audit_log where entity = 'rate_card' and entity_id = $1",
      [saved.id],
    );
    expect(entry).toMatchObject({ action: "rate_card.supersede", actor_id: ownerId, company_id: companyId, before: { id: previous!.id }, after: { id: saved.id } });

    const outcomeAfter = await calculatorRange(DALLAS_HOUSTON);
    if (outcomeBefore.status !== "ok" || outcomeAfter.status !== "ok") throw new Error("expected results");
    const [b, a] = [outcomeBefore.result as CostRange, outcomeAfter.result as CostRange];
    expect(a.highCents).toBeGreaterThan(b.highCents);
    // A new card is dated now, so "data as of" can only stay or move later.
    expect(new Date(a.asOf).getTime()).toBeGreaterThanOrEqual(new Date(b.asOf).getTime());
  });

  it("rejects invalid cards without changing the active one", async () => {
    const active = await getActiveRateCard(companyId);
    await expect(saveRateCard(companyId, { ...NEW_CARD, states: [] }, { userId: ownerId })).rejects.toBeInstanceOf(RateCardValidationError);
    await expect(saveRateCard(companyId, { ...NEW_CARD, local: null, long_distance: null }, { userId: ownerId })).rejects.toBeInstanceOf(RateCardValidationError);
    await expect(
      saveRateCard(companyId, { ...NEW_CARD, local: { ...NEW_CARD.local!, crew_hourly_cents: { "2": 15000 } } }, { userId: ownerId }),
    ).rejects.toThrow(/crew of 3/);
    expect((await getActiveRateCard(companyId))?.id).toBe(active!.id);
  });

  it("keeps stored cards immutable and leaves one active card per company", async () => {
    const active = await getActiveRateCard(companyId);
    await expect(getPool().query("update rate_cards set local = null where id = $1", [active!.id])).rejects.toThrow(/rate_card_immutable/);
    const [old] = await q<{ id: string }>("select id from rate_cards where company_id = $1 and status = 'superseded' limit 1", [companyId]);
    await expect(getPool().query("update rate_cards set status = 'active' where id = $1", [old!.id])).rejects.toThrow(/reactivation/);
    const active2 = await q("select id from rate_cards where company_id = $1 and status = 'active'", [companyId]);
    expect(active2).toHaveLength(1);
  });

  it("names a stale area when only cards older than 12 months would give a range", async () => {
    // Re-date every Texas card to 13 months ago through new rows (stored cards are immutable).
    const cards = await q<{ id: string; company_id: string; states: string[]; local: unknown; long_distance: unknown; services: unknown }>(
      `select id, company_id, states, local, long_distance, services from rate_cards where status = 'active' and 'TX' = any(states)`,
    );
    for (const card of cards) {
      await getPool().query("update rate_cards set status = 'superseded' where id = $1", [card.id]);
      await getPool().query(
        `insert into rate_cards (company_id, states, local, long_distance, services, status, created_at)
         values ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, 'active', now() - interval '13 months')`,
        [card.company_id, card.states, JSON.stringify(card.local), JSON.stringify(card.long_distance), JSON.stringify(card.services)],
      );
    }
    const outcome = await calculatorRange(DALLAS_HOUSTON);
    expect(outcome.status === "ok" && outcome.result).toMatchObject({ kind: "no_data", cause: "stale" });
  });
});

describe("the rate-card form", () => {
  it("round-trips a card through the editor's fields", () => {
    const values = rateCardToFormValues(NEW_CARD);
    expect(values["local.crew.3"]).toBe("190");
    expect(values["ld.cwt.0_250"]).toBe("200");
    expect(parseRateCardForm(values)).toEqual({ ok: true, data: NEW_CARD });
  });

  it("explains each problem next to its field", () => {
    const result = parseRateCardForm({
      states: [],
      local_enabled: "on",
      "local.crew.2": "12x",
      "local.travel": "",
      "local.hours.2br": "5.5",
      "local.crew_size.studio": "2",
      "local.crew_size.2br": "3",
      ld_enabled: "on",
      "ld.weight.2br": "4500",
      "svc.specialty": "-5",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors).toMatchObject({
      states: "Choose at least one state your card covers.",
      "local.crew.2": "Enter an amount in dollars, such as 129 or 129.50.",
      "local.travel": "Enter your truck or travel fee, or 0 if you don't charge one.",
      "local.hours.studio": "Enter the typical hours for this size, or clear its crew.",
      "local.crew_size.2br": "Add an hourly rate for a crew of 3, or pick a crew size you price.",
      "ld.cwt": "Enter a rate for at least one distance band.",
      "svc.specialty": "Enter an amount in dollars, such as 129 or 129.50.",
    });
  });

  it("needs local or long-distance rates", () => {
    const result = parseRateCardForm({ states: ["TX"] });
    expect(result.ok === false && result.fieldErrors).toEqual({ local_enabled: "Price local moves, long-distance moves or both." });
  });
});
