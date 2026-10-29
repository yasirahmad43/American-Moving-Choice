import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT, restoreSurveyDraft } from "./draft.ts";

const today = "2026-10-29";
const starter = { source: "quote-starter", entry: "household", originZip: "75201", destZip: "77002", moveSize: "2br", moveDate: "2026-11-28" };
const restore = (options = {}) => restoreSurveyDraft({ today, ...options });

describe("one continuous quote journey", () => {
  it("keeps fresh direct entry at the need question with no selected answers", () => {
    expect(restore()).toEqual({ draft: EMPTY_DRAFT, prefilled: false });
  });

  it("continues a completed starter at services instead of repeating route, date and size", () => {
    const { draft, prefilled } = restore({ prefill: starter });
    expect(prefilled).toBe(true);
    expect(draft).toMatchObject({ entry: "household", need: "household", step: "size", starterComplete: true, originZip: "75201", destZip: "77002", moveSize: "2br", moveDate: "2026-11-28" });
  });

  it("does not mix a new starter with a previous non-household move, date range or services", () => {
    const stored = { entry: "full", need: "vehicle_only", step: "when", originZip: "99501", destZip: "99503", moveSize: "studio", moveDate: "2026-12-01", flexible: true, latestDate: "2026-12-15", services: ["storage", "labor_only"], profileCompanyId: "old-company", email: "not-stored@example.com", consent: true };
    const { draft } = restore({ stored, prefill: starter });
    expect(draft).toMatchObject({ need: "household", step: "size", flexible: false, latestDate: "", services: [], profileCompanyId: null });
    expect(draft).not.toHaveProperty("email");
    expect(draft).not.toHaveProperty("consent");
  });

  it("reopens a later starter checkpoint at services and never at step one", () => {
    const carried = restore({ prefill: starter }).draft;
    for (const step of ["found", "details", "count", "review"]) {
      const { draft } = restore({ stored: { ...carried, step } });
      expect(draft).toMatchObject({ step: "size", starterComplete: true, entry: "household", need: "household", moveSize: "2br" });
    }
  });

  it("keeps an explicitly reopened route/date editor on reload", () => {
    const carried = restore({ prefill: starter }).draft;
    expect(restore({ stored: { ...carried, step: "where" } }).draft.step).toBe("where");
    expect(restore({ stored: { ...carried, step: "when" } }).draft.step).toBe("when");
  });

  it("repairs legacy household drafts whose excluded need step caused progress to reset", () => {
    const { draft } = restore({ stored: { entry: "household", need: "household", step: "review", originZip: "75201", destZip: "77002", moveDate: "2026-11-28", moveSize: "2br" } });
    expect(draft.step).toBe("size");
    expect(draft.entry).toBe("household");
  });

  it("does not skip a missing, expired or invalid carried date", () => {
    for (const moveDate of ["", "2025-01-01", "2026-99-99"]) {
      expect(restore({ prefill: { ...starter, moveDate } }).draft.step).toBe("when");
    }
  });

  it("does not skip missing route or size answers even with a forged completion flag", () => {
    expect(restore({ prefill: { ...starter, originZip: "12" } }).draft.step).toBe("where");
    expect(restore({ prefill: { ...starter, moveSize: "invalid" } }).draft).toMatchObject({ step: "size", starterComplete: false });
  });

  it("accepts an older complete hero handoff without restarting its answered steps", () => {
    const { source, ...legacy } = starter;
    expect(restore({ prefill: legacy }).draft).toMatchObject({ step: "size", starterComplete: true });
  });

  it("keeps calculator/location handoffs on their existing confirmation path", () => {
    const { draft } = restore({ stored: { entry: "full", need: "truck_rental" }, prefill: { source: "cost-calculator", originZip: "75201", destinationZip: "77002", moveSize: "2br", services: ["packing"] } });
    expect(draft).toMatchObject({ entry: "household", need: "household", step: "where", starterComplete: false, destZip: "77002", services: ["packing"] });
  });
});
