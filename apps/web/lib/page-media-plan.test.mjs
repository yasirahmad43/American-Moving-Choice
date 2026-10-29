import manifest from "../content/media/manifest.json";
import { buildPageCardMedia, buildPageMediaPlan } from "./page-media-plan.ts";

const assets = manifest.assets;
const ids = (plan) => [plan.video.id, ...plan.images.map((asset) => asset.id)];

describe("reusable editorial page media", () => {
  it("is independent of render order, library order and tracking query parameters", () => {
    const before = JSON.stringify(assets);
    const expected = ids(buildPageMediaPlan(assets, "/movers/illinois/east-peoria/", { family: "city", stateCode: "IL" }));
    buildPageMediaPlan(assets, "/planning/moving-checklist/", { family: "planning" });
    expect(ids(buildPageMediaPlan([...assets].reverse(), "/movers/illinois/east-peoria/?utm_source=test", { family: "city", stateCode: "IL" }))).toEqual(expected);
    expect(JSON.stringify(assets)).toBe(before);
  });

  it("keeps five distinct licensed non-hero illustrations available across thousands of pages", () => {
    const stateCodes = [...new Set(assets.flatMap((asset) => asset.tags.filter((tag) => tag.startsWith("state:")).map((tag) => tag.slice(6))))];
    for (let i = 0; i < 2_500; i++) {
      const stateCode = stateCodes[i % stateCodes.length];
      const plan = buildPageMediaPlan(assets, `/movers/example-${stateCode.toLowerCase()}/city-${i}/`, { family: "city", stateCode });
      expect(new Set(plan.images.map((asset) => asset.id)).size).toBe(5);
      for (const image of plan.images) {
        expect(image.kind).toBe("image");
        expect(image.tags).not.toContain("hero");
        expect(image.placeholder).not.toBe(true);
        expect(image.credit.license).toBeTruthy();
        expect(image.credit.source_url).toBeTruthy();
        expect(image.generator.provider).toBe("higgsfield");
        const stateTag = image.tags.find((tag) => tag.startsWith("state:"));
        if (stateTag) expect(stateTag).toBe(`state:${stateCode}`);
      }
    }
  }, 30_000);

  it("uses actual subject metadata and never borrows another state's scenery", () => {
    const local = buildPageMediaPlan(assets, "/movers/alabama/alabaster/", { family: "city", stateCode: "AL" });
    expect(local.images.filter((asset) => asset.tags.includes("state:AL"))).toHaveLength(2);
    const packing = buildPageMediaPlan(assets, "/services/packing/", { family: "service", topic: "packing" });
    expect(packing.images.every((asset) => asset.tags.includes("service:packing"))).toBe(true);
    const inferredState = buildPageMediaPlan(assets, "/moving-costs/new-york/", { family: "cost" });
    expect(inferredState.images.filter((asset) => asset.tags.includes("state:NY"))).toHaveLength(2);
  });

  it("selects appropriate licensed video and a neutral fallback for an unrecognised topic", () => {
    expect(buildPageMediaPlan(assets, "/routes/texas-to-colorado/", { family: "route" }).video.id).toBe("long-distance-hero-aerial-highway-dawn");
    expect(buildPageMediaPlan(assets, "/movers/hawaii/honolulu/", { family: "city", stateCode: "HI" }).video.id).toBe("local-hero-sofa-apartment-door");
    const fallback = buildPageMediaPlan(assets, "/privacy-policy/");
    expect(fallback.images).toHaveLength(5);
    expect(fallback.images.every((asset) => !asset.tags.some((tag) => tag.startsWith("state:")))).toBe(true);
    expect(fallback.video.poster).toBeTruthy();
    expect(fallback.video.credit.license).toBeTruthy();
  });

  it("prioritises an explicit subject over a generic catalog URL", () => {
    const cases = [{ family: "state", tag: "service:local" }, { family: "route", tag: "route" }, { family: "service", tag: "services" }, { family: "planning", tag: "planning" }];
    const firstImages = new Set();
    for (const { family, tag } of cases) {
      const plan = buildPageMediaPlan(assets, "/explore/", { family, topic: family });
      expect(plan.images[0].tags).toContain(tag);
      firstImages.add(plan.images[0].id);
    }
    expect(firstImages.size).toBe(cases.length);
  });

  it("gives the seven published planning subjects distinct, relevant thumbnails without pets", () => {
    const subjects = [
      ["delivery-day-checklist", /unloading/i],
      ["how-to-choose-a-moving-company", /homeowner and mover/i],
      ["how-to-pack-for-a-move", /taping|pack|wrap/i],
      ["moving-day-checklist", /boxes|same.day/i],
      ["moving-out-of-state-checklist", /highway|road/i],
      ["moving-timeline-8-weeks", /planner|notebook|calendar/i],
      ["moving-to-a-new-state-first-30-days", /empty new home|essentials/i],
    ];
    const used = new Set();
    for (const [slug, subject] of subjects) {
      const image = buildPageCardMedia(assets, `/planning/${slug}/`, { family: "planning", topic: slug }, used);
      expect(image.alt).toMatch(subject);
      expect(image.alt).not.toMatch(/pet|leash/i);
    }
    expect(used.size).toBe(subjects.length);
    expect(buildPageMediaPlan(assets, "/planning/").images.every((image) => !/pet|leash/i.test(image.alt))).toBe(true);
  });

  it("uses four relevant video scenes for home, costs, exploration and planning", () => {
    const home = buildPageMediaPlan(assets, "/").video;
    const cost = buildPageMediaPlan(assets, "/moving-costs/").video;
    const explore = buildPageMediaPlan(assets, "/explore/").video;
    const planning = buildPageMediaPlan(assets, "/planning/").video;
    expect(new Set([home.id, cost.id, explore.id, planning.id]).size).toBe(4);
    expect(home.tags).toContain("home");
    expect(cost.tags).toContain("route");
    expect(explore.tags).toContain("service:local");
    expect(planning.tags).toContain("how-it-works");
  });
});
