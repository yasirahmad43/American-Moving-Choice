import { hubPageNumbers, hubPagePath, parseHubPageNumber } from "./hub-pagination.ts";
import { QUESTIONS_HUB, PLANNING_HUB } from "./editorial-hub-specs.ts";
import { ROUTES_HUB } from "./routes-hub-spec.ts";

describe("large guide family pagination", () => {
  it("keeps first, last and nearby pages without allocating every results page", () => {
    expect(hubPageNumbers(833, 1667)).toEqual([1, 831, 832, 833, 834, 835, 1667]);
    for (const count of [2, 9, 38, 1667, 999999]) {
      for (const page of [1, Math.ceil(count / 2), count]) {
        const numbers = hubPageNumbers(page, count);
        expect(numbers.length).toBeLessThanOrEqual(7);
        expect(numbers[0]).toBe(1);
        expect(numbers.at(-1)).toBe(count);
        expect(numbers).toContain(page);
        expect(new Set(numbers).size).toBe(numbers.length);
        expect(numbers.every(value => value >= 1 && value <= count)).toBe(true);
        if (page > 1) expect(numbers).toContain(page - 1);
        if (page < count) expect(numbers).toContain(page + 1);
      }
    }
  });

  it("accepts only unambiguous positive native page numbers", () => {
    expect(parseHubPageNumber("1")).toBe(1);
    expect(parseHubPageNumber("1667")).toBe(1667);
    for (const value of [undefined, null, 2, ["2", "3"], "", "0", "-1", "+2", "02", "2.0", "2e3", " 2", "1000000", "2/", "2?x=1"]) expect(parseHubPageNumber(value)).toBeNull();
  });

  it("uses sixty guides and canonical paths on all three large hubs", () => {
    for (const spec of [QUESTIONS_HUB, PLANNING_HUB, ROUTES_HUB]) {
      expect(spec.perPage).toBe(60);
      expect(spec.pageJump).toBe(true);
      expect(hubPagePath(spec.url, 1)).toBe(spec.url);
      expect(hubPagePath(spec.url, 2)).toBe(`${spec.url}page/2/`);
    }
  });
});
