import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import { parseFrontMatter } from "./front-matter.ts";
import { renderMarkdown } from "./markdown.ts";
import { createTokenResolver } from "./tokens.ts";

vi.mock("@amc/ui", () => ({ LineIcon: () => null }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("@/components/media/media-frame", () => ({ MediaFrame: () => null, MediaCreditLine: () => null }));
vi.mock("@/lib/content/story-plan", async () => import("./story-plan.ts"));
vi.mock("@/lib/content/story-captions", async () => import("./story-captions.ts"));
const { presentEditorialHtml } = await import("../../components/site/story-sections.tsx");

const table = '<div class="table-wrap" role="region" tabindex="0" aria-label="Moving-cost reference fields"><table><thead><tr><th>What the range covers</th><th>Planning range</th><th>Source</th><th>Sample size</th><th>Data as of</th></tr></thead><tbody><tr id="reference-one"><td>not yet available</td><td>not yet available</td><td><a href="https://example.org/source">not yet available</a></td><td>not yet available</td><td>not yet available</td></tr><tr id="reference-two"><td>not yet available</td><td>not yet available</td><td>not yet available</td><td>not yet available</td><td>not yet available</td></tr></tbody></table></div>';
const specimen = '<blockquote><p><a id="range-label"></a><strong>Planning range, not a quote:</strong> not yet available for not yet available. Based on not yet available; data as of not yet available; model cost-model-v1 (proposal). <a href="/moving-cost-calculator/method/">How this range is calculated</a></p></blockquote>';

describe("missing cost data in public editorial presentation", () => {
  it("turns missing cells into named-field statuses without losing a column, row, anchor or link", () => {
    const html = presentEditorialHtml(table);
    expect(html).not.toContain("not yet available");
    expect(html.match(/Not available/g)).toHaveLength(11); // explanatory status plus ten missing cells
    expect(html.match(/<th>/g)).toHaveLength(5);
    expect(html.match(/<td>/g)).toHaveLength(10);
    expect(html.match(/<tr\b/g)).toHaveLength(3);
    expect(html).toContain('id="reference-one"');
    expect(html).toContain('id="reference-two"');
    expect(html).toContain('href="https://example.org/source"');
    expect(html).toContain('role="region" tabindex="0"');
    expect(html).not.toMatch(/[$£€]\s*\d/);
    for (const name of ["What the range covers", "Planning range", "Source", "Sample size", "Data as of"]) expect(html).toContain(`<th>${name}</th>`);
  });
  it("replaces the nonsensical specimen sentence with visible field/value explanations", () => {
    const html = presentEditorialHtml(specimen);
    expect(html).not.toMatch(/not yet available|Read the complete example label|<details>/i);
    expect(html).toContain("Planning range, not a quote.");
    for (const name of ["Planning range", "Move and area", "Rate-card sources and sample", "Data as of", "Calculation model"]) expect(html).toContain(`>${name}</dt>`);
    expect(html.match(/<dd\b[^>]*>Not available<\/dd>/g)).toHaveLength(4);
    expect(html).toContain("cost-model-v1 (proposal)");
    expect(html).toContain('id="range-label"');
    expect(html).toContain('href="/moving-cost-calculator/method/"');
    expect(presentEditorialHtml(html)).toBe(html);
  });
  it("retains real values and source markup when just one label field is unavailable", () => {
    const original = '<blockquote><p><strong>Planning range, not a quote:</strong> $100–$200 for a two-bedroom local move. Based on <a href="https://example.org/rates">five recorded rate cards</a>; data as of not yet available; model sample-v1.2. <a href="/moving-cost-calculator/method/">How this range is calculated</a></p></blockquote>';
    const html = presentEditorialHtml(original);
    for (const value of ["$100–$200", "a two-bedroom local move", "five recorded rate cards", "sample-v1.2", 'href="https://example.org/rates"', 'href="/moving-cost-calculator/method/"']) expect(html).toContain(value);
    expect(html.match(/<dd\b[^>]*>Not available<\/dd>/g)).toHaveLength(1);
  });
  it("retains real prices without a no-range wrapper and leaves unrelated quoted guidance unchanged", () => {
    const priced = table.replace("<td>not yet available</td><td>not yet available</td>", "<td>Studio local move</td><td>$120–$240</td>");
    const safety = '<a id="limits"></a><blockquote><p>Only a mover can give a written estimate. A range is not a quote.</p></blockquote><p>Keep the complete source note.</p>';
    const shown = presentEditorialHtml(priced);
    expect(shown).toContain("Studio local move");
    expect(shown).toContain("$120–$240");
    expect(shown).not.toContain("No supported price range");
    expect(shown).not.toContain("planning-availability");
    expect(shown.match(/<tr\b/g)).toHaveLength(3);
    expect(shown).toContain('href="https://example.org/source"');
    expect(shown).not.toContain("not yet available");
    expect(presentEditorialHtml(safety)).toBe(safety);
    expect(presentEditorialHtml('<blockquote><p>Planning range, not a quote: not yet available.</p><p>Keep this separate instruction.</p></blockquote>')).toContain("Keep this separate instruction.");
  });
});

const content = relative => fileURLToPath(new URL(`../../../../content/${relative}`, import.meta.url));
const stored = new Map([...readFileSync(content("stored-texts.md"), "utf8").matchAll(/^#{2,3} (ST-\d+[a-z]?)\b[^\n]*\n(?:(?!^#{1,3} )[^])*?^> (.+)$/gm)].map(match => [match[1], match[2]]));
const resolver = createTokenResolver(JSON.parse(readFileSync(content("tokens.json"), "utf8")), { storedText: key => stored.get(key) ?? null });

describe("the two served missing-data guides", () => {
  for (const file of ["costs/moving-costs", "costs/calculator-method"]) {
    it(`${file} preserves records and sources without a placeholder sentence`, () => {
      const parsed = parseFrontMatter(readFileSync(content(`pages/${file}.md`), "utf8"));
      const { html: original } = renderMarkdown(parsed.content, { resolveToken: resolver, mode: "public", linkLabels: { "How this range is calculated": "/moving-cost-calculator/method/" } });
      const shown = presentEditorialHtml(original);
      expect(shown).not.toMatch(/not yet available for not yet available|Based on not yet available|data as of not yet available/i);
      expect(shown).not.toContain("not yet available");
      expect(shown).toContain("What a complete planning range identifies");
      expect((shown.match(/<tr\b/g) ?? []).length).toBe((original.match(/<tr\b/g) ?? []).length);
      expect((shown.match(/<th\b/g) ?? []).length).toBe((original.match(/<th\b/g) ?? []).length);
      expect((shown.match(/<td\b/g) ?? []).length).toBe((original.match(/<td\b/g) ?? []).length);
      const anchors = value => [...value.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      for (const id of anchors(original)) expect(anchors(shown)).toContain(id);
      const links = value => [...value.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
      for (const href of links(original)) expect(links(shown)).toContain(href);
    });
  }
});
