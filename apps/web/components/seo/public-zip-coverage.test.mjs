import { publicSeoPage } from "./public-content.ts";

const countColumn = "Movers naming it (local)";
const datedClaim = "No network mover's local rule names these ZIP codes or Travis County as of 2026-10-28.";
const postalSource = { label: "GeoNames postal data", url: "https://www.geonames.org/", accessedOn: "2026-10-28" };
function page({ family = "city", id = "zips", columns = ["ZIP code", "Place name", "Population", countColumn], rows = [["78701", "Austin", "967,862", "5"]], heading = "The 74 ZIP codes of Austin, with movers naming each" } = {}) {
  return { family, url: "/movers/texas/austin/", title: "Austin moving guide", h1: "Movers in Austin, TX", metaDescription: "An Austin moving guide.",
    publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"),
    sources: [postalSource, { label: "American Moving Choice coverage rules", url: "/which-companies-receive-my-request/", accessedOn: "2026-10-28" }],
    content: { intro: { answer: "Austin has 74 ZIP codes. As of 2026-10-28, 5 network movers can receive moves from Texas.", dataPoints: [] }, sections: [{ id, heading, blocks: [
      { type: "paragraph", text: `78701 identifies a postal area in Austin. ${datedClaim}` }, { type: "table", caption: "Dated ZIP records", columns, rows },
    ] }], faq: [], related: [], quote: {}, credits: ["GeoNames, CC BY 4.0"], dataAsOf: "2026-10-28" },
  };
}
const tableOf = value => value.content.sections.flatMap(section => section.blocks).find(block => block.type === "table");

describe("public postal facts without archived company availability", () => {
  it("retains postal facts, sources and dates while removing fixture counts and claims", () => {
    const stored = page();
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(tableOf(projected).columns).toEqual(["ZIP code", "Place name", "Population"]);
    expect(tableOf(projected).rows).toEqual([["78701", "Austin", "967,862"]]);
    expect(tableOf(projected).caption).toBe("Dated ZIP records");
    expect(JSON.stringify(projected)).toContain("78701 identifies a postal area in Austin.");
    expect(projected.content.intro.answer).toContain("Austin has 74 ZIP codes.");
    expect(JSON.stringify(projected)).not.toMatch(/network movers?|named \/|total matches|local rule names|movers naming/i);
    expect(projected.sources).toContainEqual(postalSource);
    expect(projected.publishedAt).toEqual(stored.publishedAt);
    expect(projected.updatedAt).toEqual(stored.updatedAt);
    expect(projected.content.credits).toEqual(stored.content.credits);
    expect(JSON.stringify(stored)).toBe(before);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it.each(["0", "5", "1,234", "0 of 5", "2 of 5", "12 of 1,234", "unknown", "1 / 5", "1 of unknown", "", "01"])("removes the company column regardless of its archived value: %s", original => {
    const projected = publicSeoPage(page({ rows: [["78701", "Austin", "967,862", original]] }));
    expect(tableOf(projected).rows[0]).toEqual(["78701", "Austin", "967,862"]);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("retains absent cells and unrelated extra cells without inventing postal data", () => {
    const rows = [["78701", "Austin", "967,862"], [], ["78702", "Austin", "22,000", "2 of 5", "extra retained"]];
    expect(tableOf(publicSeoPage(page({ rows }))).rows).toEqual([rows[0], [], ["78702", "Austin", "22,000", "extra retained"]]);
  });

  it.each([{ family: "state" }, { id: "nearby-zips" }, { columns: ["ZIP code", "Place name", "Population", "Local rule counts (named / total matches)"] }])("removes archived availability from geographic table variants: %j", options => {
    expect(tableOf(publicSeoPage(page(options))).columns).toEqual(["ZIP code", "Place name", "Population"]);
  });

  it("preserves an unrelated real-data column", () => {
    const stored = page({ columns: ["ZIP code", "Place name", "Population", "Housing units"] });
    expect(tableOf(publicSeoPage(stored))).toEqual(tableOf(stored));
  });

  it("redacts a private identity while retaining postal facts", () => {
    const stored = page({ rows: [["78701", "Private Moving Company", "967,862", "2 of 5"]] });
    stored.content.sections[0].blocks.push({ type: "movers", items: [{ name: "Private Moving Company" }] });
    const projected = publicSeoPage(stored);
    expect(tableOf(projected).rows[0]).toEqual(["78701", "a participating moving company", "967,862"]);
    expect(JSON.stringify(projected)).not.toContain("Private Moving Company");
  });
});
