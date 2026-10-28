import { describe, expect, it } from "vitest";
import { TRANSIT_MODEL_V1, estimateTransit } from "./transit";

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
