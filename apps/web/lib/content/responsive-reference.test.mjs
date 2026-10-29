import { renderMarkdown } from "./markdown.ts";

const render = source => renderMarkdown(source, { resolveToken: () => null }).html;

describe("responsive Markdown reference data", () => {
  it("retains every wide-table cell, source link and number once with exact column labels", () => {
    const source = "## Reference\n\n| Move | Amount | Source | Sample | Date |\n|---|---|---|---|---|\n| Studio | $1,100 | [Official record](https://example.org/one) | 12 | 2026-10-28 |\n| Family | $2,400 | [Second record](https://example.org/two) | 28 | 2026-10-29 |\n";
    const html = render(source);
    expect(html.match(/<table\b/g)).toHaveLength(1);
    expect(html.match(/<tbody\b[^>]*>[^]*<\/tbody>/)?.[0].match(/<tr\b/g)).toHaveLength(2);
    expect(html.match(/<td\b/g)).toHaveLength(10);
    for (const value of ["Studio", "Family", "$1,100", "$2,400", "2026-10-28", "2026-10-29"]) expect(html.split(value)).toHaveLength(2);
    for (const href of ["https://example.org/one", "https://example.org/two"]) expect(html.split(`href="${href}"`)).toHaveLength(2);
    expect(html).toContain('data-wide="true"');
    expect(html).toMatch(/<table role="table">/);
    expect(html).toMatch(/role="cell" data-label="Amount" data-col-index="1">\$1,100<\/td>/);
    expect(html).not.toMatch(/scrolls sideways|tabindex="0"/);
  });

  it("keeps full long text and safely escaped values in narrow-card fields", () => {
    const text = "A complete description with punctuation, a $250 example and a very-long-reference-identifier-without-spaces";
    const html = render(`| Topic | Explanation | Link |\n|---|---|---|\n| Packing | ${text} | [Read all guidance](/planning/) |\n`);
    expect(html).toContain(text);
    expect(html).toContain('data-reflow="true"');
    expect(html).not.toContain('data-wide="true"');
    expect(html).toContain('data-label="Explanation" data-col-index="1"');
    expect(html).toContain('href="/planning/"');
  });

  it("marks linked headers for a visible legend instead of hiding focusable links", () => {
    const html = render("| [Source](https://example.org/source) | A | B | C | D |\n|---|---|---|---|---|\n| one | two | three | four | five |\n");
    expect(html).toContain('data-rich-header="true"');
    expect(html).toContain('<a href="https://example.org/source">Source</a>');
    expect(html.match(/<td\b/g)).toHaveLength(5);
  });

  it("names an empty corner header while retaining every comparison value", () => {
    const html = render("| | Local | Interstate |\n|---|---|---|\n| Estimate | Hourly | Weight |\n");
    expect(html).toMatch(/<th[^>]*>Item<\/th>/);
    expect(html).toContain('data-label="Item"');
    for (const value of ["Estimate", "Hourly", "Weight"]) expect(html.split(`>${value}</td>`)).toHaveLength(2);
  });
});
