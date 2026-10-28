import { describe, expect, it } from "vitest";
import { TRANSIT_MODEL_V1, estimateTransit, estimateRoadTransit } from "./transit";

describe("estimateTransit", () => {
  it("scales straight-line miles by the driving factor and rounds to whole miles", () => {
    const e = estimateTransit(1000);
    expect(e.drivingMiles).toBe(1180);
    expect(e.drivingDays).toBe(3);
    expect(e.version).toBe("transit-model-v1");
  });

  it("gives at least one driving day for any distance over zero and zero for zero", () => {
    expect(estimateTransit(0).drivingDays).toBe(0);
    expect(estimateTransit(3).drivingDays).toBe(1);
    expect(estimateTransit(TRANSIT_MODEL_V1.milesPerDrivingDay / TRANSIT_MODEL_V1.drivingDistanceFactor).drivingDays).toBe(1);
  });

  it("rejects negative or non-finite input", () => {
    expect(() => estimateTransit(-1)).toThrow(RangeError);
    expect(() => estimateTransit(Number.NaN)).toThrow(RangeError);
  });
});

describe("estimateRoadTransit", () => {
  it("keeps the disclosed formula for two contiguous endpoints including DC", () => {
    expect(estimateRoadTransit(1000, "TX", "CO")).toEqual(estimateTransit(1000));
    expect(estimateRoadTransit(50, "DC", "VA")).toEqual(estimateTransit(50));
  });
  it("fails closed for Alaska or Hawaii in either direction, including same-state pairs", () => {
    for (const [origin, destination] of [["HI", "CA"], ["CA", "HI"], ["AK", "WA"], ["WA", "AK"], ["AK", "AK"], ["HI", "HI"], ["AK", "HI"]]) {
      expect(estimateRoadTransit(1000, origin!, destination!)).toBeNull();
    }
  });
  it("does not model unknown endpoint geography", () => {
    expect(estimateRoadTransit(1000, "", "TX")).toBeNull();
    expect(estimateRoadTransit(1000, "TX", "unknown")).toBeNull();
  });
});
