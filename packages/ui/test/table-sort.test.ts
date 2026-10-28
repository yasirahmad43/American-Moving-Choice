import { describe, expect, it } from "vitest";
import { compareTableValues, tableSortValue } from "../src/components/table-sort";

describe("table sorting", () => {
  it("sorts financial values by amount, including credits", () => {
    const values = ["$1,250.00", "$80.00", "($25.00)", "$0.00"];
    expect(values.toSorted((a, b) => compareTableValues(tableSortValue(a), tableSortValue(b), "ascending")))
      .toEqual(["($25.00)", "$0.00", "$80.00", "$1,250.00"]);
  });
  it("keeps missing values last in both directions", () => {
    for (const direction of ["ascending", "descending"] as const) {
      expect(compareTableValues(tableSortValue("—"), tableSortValue("0"), direction)).toBeGreaterThan(0);
      expect(compareTableValues(tableSortValue("0"), tableSortValue(" "), direction)).toBeLessThan(0);
    }
  });
  it("sorts dates by their actual timestamp rather than rendered text or time zone", () => {
    const later = tableSortValue("Oct 28", "2026-10-28T00:00:00-05:00");
    const earlier = tableSortValue("Oct 28", "2026-10-28T02:00:00Z");
    expect(compareTableValues(later, earlier, "ascending")).toBeGreaterThan(0);
  });
  it("sorts mixed natural-language labels without treating labels as zero", () => {
    expect(tableSortValue("Company 12")).toBe("company 12");
    expect(compareTableValues(tableSortValue("Company 2"), tableSortValue("Company 12"), "ascending")).toBeLessThan(0);
  });
});
