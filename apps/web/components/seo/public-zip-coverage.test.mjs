import { publicSeoPage } from "./public-content.ts";

const legacyColumn = "Movers naming it (local)";
const correctedColumn = "Local rule counts (named / total matches)";
const datedNote = "No network mover's local rule names these ZIP codes or Travis County as of 2026-10-28.";
function page({ family = "city", id = "zips", columns = ["ZIP code", "Place name", "Population", legacyColumn], rows = [["78701", "Austin", "967,862", "5"]], heading = "The 74 ZIP codes of Austin, with movers naming each" } = {}) {
  return { family, url: "/movers/texas/austin/", title: "Austin moving guide", h1: "Movers in Austin, TX", metaDescription: "An Austin moving guide.",
    publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"),
    sources: [{ label: "Coverage records", url: "/which-companies-receive-my-request/", accessedOn: "2026-10-28" }],
    content: { intro: { answer: "Read the [local guide](/services/local/)." }, sections: [{ id, heading, blocks: [
      { type: "paragraph", text: datedNote }, { type: "table", caption: "Dated ZIP records", columns, rows },
    ] }], faq: [], related: [], quote: {}, credits: ["GeoNames, CC BY 4.0"], dataAsOf: "2026-10-28" },
  };
}
const tableOf = page => page.content.sections[0].blocks.find(block => block.type === "table");

describe("city ZIP-specific versus total local-rule matches", () => {
  it("explains Austin's actual zero-named/five-total case without changing the dated zero-specific-rule note", () => {
    const stored = page();
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(tableOf(projected).columns).toEqual(["ZIP code", "Place name", "Population", correctedColumn]);
    expect(tableOf(projected).rows).toEqual([["78701", "Austin", "967,862", "0 named / 5 matches"]]);
    expect(tableOf(projected).caption).toBe("Dated ZIP records");
    expect(projected.content.sections[0].blocks[0].text).toBe(datedNote);
    expect(projected.content.sections[0].heading).toBe("The 74 ZIP codes of Austin, with local coverage-rule counts");
    const note = projected.content.sections[0].blocks.find(block => block.type === "note").text;
    expect(note).toContain("ZIP- or county-specific local rules");
    expect(note).toContain("total matches can also include broader rules");
    expect(note).toContain("representative local move");
    expect(note).toContain("quote survey checks the rules against your exact route");
    expect(projected.sources).toEqual(stored.sources);
    expect(projected.publishedAt).toEqual(stored.publishedAt);
    expect(projected.updatedAt).toEqual(stored.updatedAt);
    expect(projected.content.credits).toEqual(stored.content.credits);
    expect(projected.content.intro).toEqual(stored.content.intro);
    expect(JSON.stringify(stored)).toBe(before);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it.each([
    ["0", "0 named / 0 matches"], ["5", "0 named / 5 matches"], ["1,234", "0 named / 1,234 matches"],
    ["0 of 5", "0 named / 5 matches"], ["2 of 5", "2 named / 5 matches"], ["12 of 1,234", "12 named / 1,234 matches"],
    ["unknown", "unknown"], ["1 / 5", "1 / 5"], ["1 of unknown", "1 of unknown"], ["", ""], ["01", "01"],
  ])("preserves both counts or leaves an unknown cell unchanged: %s", (original, expected) => {
    const stored = page({ rows: [["78701", "Austin", "967,862", original]] });
    const projected = publicSeoPage(stored);
    expect(tableOf(projected).rows[0]).toEqual(["78701", "Austin", "967,862", expected]);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("preserves row width and absent cells rather than inventing missing values", () => {
    const rows = [["78701", "Austin", "967,862"], [], ["78702", "Austin", "22,000", "2 of 5", "extra retained"]];
    const projected = publicSeoPage(page({ rows }));
    expect(tableOf(projected).rows).toEqual([rows[0], [], ["78702", "Austin", "22,000", "2 named / 5 matches", "extra retained"]]);
  });

  it.each([{ family: "state" }, { id: "nearby-zips" }, { columns: ["ZIP code", "Place name", "Population", "Another count"] }])("does not reinterpret tables outside the known source contract: %j", (options) => {
    const stored = page(options);
    const projected = publicSeoPage(stored);
    expect(tableOf(projected)).toEqual(tableOf(stored));
    expect(projected.content.sections[0].blocks.some(block => block.type === "note")).toBe(false);
  });

  it("handles an absent table without manufacturing counts or notes", () => {
    const stored = page();
    stored.content.sections[0].blocks = [{ type: "paragraph", text: datedNote }];
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks).toEqual(stored.content.sections[0].blocks);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("keeps counts when redacting archived private company identities", () => {
    const stored = page({ rows: [["78701", "Private Moving Company", "967,862", "2 of 5"]] });
    stored.content.sections[0].blocks.push({ type: "movers", items: [{ name: "Private Moving Company" }] });
    const projected = publicSeoPage(stored);
    expect(tableOf(projected).rows[0]).toEqual(["78701", "a participating moving company", "967,862", "2 named / 5 matches"]);
    expect(JSON.stringify(projected)).not.toContain("Private Moving Company");
    expect(publicSeoPage(projected)).toEqual(projected);
  });
});
