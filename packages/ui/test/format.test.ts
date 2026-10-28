import { describe, expect, it } from "vitest";
import { pageWindow } from "../src/components/pagination";
import { formatAbsoluteDate, formatMoney, isoDateTime } from "../src/format";

describe("formatMoney", () => {
  it("formats integer cents as US dollars", () => {
    expect(formatMoney(4000)).toBe("$40.00");
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(-2600)).toBe("-$26.00");
    expect(formatMoney(123456, { whole: true })).toBe("$1,235");
    expect(() => formatMoney(Number.NaN)).toThrow();
  });
});

describe("formatAbsoluteDate", () => {
  it("formats date-only values in UTC so they never shift a day", () => {
    expect(formatAbsoluteDate("2026-10-27")).toBe("Oct 27, 2026");
    expect(formatAbsoluteDate("2026-01-01", { month: "long" })).toBe("January 1, 2026");
    expect(isoDateTime("2026-10-27")).toBe("2026-10-27");
  });

  it("formats timestamps in US Eastern time by default, with the zone when showing time", () => {
    expect(formatAbsoluteDate("2026-10-28T03:30:00Z")).toBe("Oct 27, 2026");
    expect(formatAbsoluteDate("2026-10-28T15:04:00Z", { withTime: true })).toBe("Oct 28, 2026, 11:04 AM EDT");
    expect(formatAbsoluteDate(new Date("2026-10-28T15:04:00Z"), { timeZone: "UTC" })).toBe("Oct 28, 2026");
    expect(isoDateTime(new Date("2026-10-28T15:04:00Z"))).toBe("2026-10-28T15:04:00.000Z");
  });
});

describe("pageWindow", () => {
  it("shows the first, last and neighbouring pages with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});
