import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { adaptiveReactTables } from "./adaptive-react-tables.tsx";

const cell = (type, value, props = {}) => h(type, props, value);
const table = (headers, rows, props = {}) => h("div", { className: "table-wrap", role: "region", tabIndex: 0, "aria-label": "Original reference", "data-original": "keep", ...props }, h("table", { id: "reference" }, h("thead", null, h("tr", null, ...headers.map(value => cell("th", value)))), h("tbody", null, ...rows.map((row, index) => h("tr", { id: `row-${index}` }, ...row)))));
const render = children => renderToStaticMarkup(adaptiveReactTables(children));

describe("authored React table adaptation", () => {
  it("retains all cell content, sources and custom attributes once with correct row/header semantics", () => {
    const original = table(["Layer", "Check", "Outcome"], [[cell("th", "Identity", { scope: "row", id: "identity", "data-evidence": "current" }), cell("td", h("a", { href: "https://example.org/source" }, "Complete source")), cell("td", "$1,100 as of 2026-10-28")]]);
    const html = render(original);
    for (const value of ["Identity", "Complete source", "$1,100 as of 2026-10-28"]) expect(html.split(value)).toHaveLength(2);
    expect(html).toContain('id="reference"');
    expect(html).toContain('id="row-0"');
    expect(html).toContain('id="identity"');
    expect(html).toContain('data-original="keep"');
    expect(html).toContain('data-evidence="current"');
    expect(html).toContain('href="https://example.org/source"');
    expect(html).toContain('scope="row"');
    expect(html).toContain('role="rowheader"');
    expect(html).toContain('data-label="Outcome" data-col-index="2"');
    expect(html).toContain('data-reflow="true"');
    expect(html).not.toContain('tabindex="0"');
  });

  it("gives a truly blank corner header a useful name without deleting rich header content", () => {
    const html = render(table([null, "One", "Two"], [[cell("th", "Population", { scope: "row" }), cell("td", "10,000"), cell("td", "20,000")]]));
    expect(html).toMatch(/<th[^>]*>Item<\/th>/);
    expect(html).toContain('data-label="Item"');
    const linked = render(table([h("a", { href: "/source/" }, "Source"), "A", "B", "C", "D"], [[cell("td", "v1"), cell("td", "v2"), cell("td", "v3"), cell("td", "v4"), cell("td", "v5")]]));
    expect(linked).toContain('data-rich-header="true"');
    expect(linked).toContain('<a href="/source/">Source</a>');
  });

  it("leaves complex spans native without guessing which label belongs to a merged cell", () => {
    const html = render(table(["A", "B", "C"], [[cell("td", "Merged record", { colSpan: 2, id: "merged" }), cell("td", "Third")]]));
    expect(html).toContain('colSpan="2"');
    expect(html).toContain('id="merged"');
    expect(html).toContain('data-complex-table="true"');
    expect(html).not.toContain('data-reflow="true"');
    expect(html).not.toContain('data-label=');
    expect(html).toContain("Merged record");
    expect(html).toContain("Third");
  });

  it("preserves ordinary surrounding markup and every separate region name", () => {
    const html = render(h("section", { id: "existing-section" }, h("p", null, "Before and after."), table(["Fact", "Value"], [[cell("td", "Date"), cell("td", "2026-10-28")]]), table(["Fact", "Value"], [[cell("td", "Amount"), cell("td", "$250")]], { "aria-label": "Second reference" })));
    expect(html).toContain('id="existing-section"');
    expect(html).toContain("Before and after.");
    expect(html).toContain('aria-label="Original reference"');
    expect(html).toContain('aria-label="Second reference"');
    expect(html.match(/<td\b/g)).toHaveLength(4);
  });
});
