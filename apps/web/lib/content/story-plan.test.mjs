import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import manifest from "../../content/media/manifest.json";
import { chapterKind, guideOverview, storyImageAt, storyMediaPlan, storyNextItems } from "./story-plan.ts";
import { parseFrontMatter } from "./front-matter.ts";
import { renderMarkdown } from "./markdown.ts";
import { createTokenResolver } from "./tokens.ts";

describe("shared story contracts", () => {
  it("preserves all legacy standalone cards and their original offset destinations", () => {
    const images = manifest.assets.filter(asset => asset.kind === "image").slice(0, 5);
    const all = storyNextItems({ images });
    expect(all.map(item => item.image.id)).toEqual(images.map(image => image.id));
    expect(all.map(item => item.href)).toEqual(["/get-quotes/", "/moving-costs/how-movers-charge/", "/planning/", "/which-companies-receive-my-request/", "/movers/"]);
    const remaining = storyNextItems({ images, usedCount: 3 });
    expect(remaining.map(item => item.image.id)).toEqual(images.slice(3).map(image => image.id));
    expect(remaining.map(item => item.title)).toEqual(["Choose your contact preferences", "Explore your destination"]);
    expect(storyNextItems({ items: [], images })).toEqual([]);
    expect(storyImageAt(images, 7)).toBe(images[2]);
    expect(storyImageAt([images[0], null, images[1]], 1, true)).toBeNull();
  });

  it("moves the complete answer/action blocks without losing any paragraph, source, anchor or table", () => {
    const html = '<p>Answer <a href="https://www.fmcsa.dot.gov/">source</a>.</p><blockquote><p>Important limit.</p></blockquote><h2 id="start-here">Three checks</h2><ol><li>Check A.</li><li>Check B.</li></ol><h2 id="detail">Full detail</h2><div class="table-wrap"><table><tbody><tr><td>Every record stays.</td></tr></tbody></table></div>';
    const result = guideOverview(html);
    expect(result.answer).toContain('href="https://www.fmcsa.dot.gov/"');
    expect(result.actions).toContain('id="start-here"');
    expect(result.actions).toContain("Check B.");
    expect(result.body).toContain("Important limit.");
    expect(result.body).toContain('id="detail"');
    expect(result.body).toContain("Every record stays.");
    const joined = result.answer + result.actions + result.body;
    for (const value of ["Answer", "source</a>", "Important limit.", "Check A.", "Check B.", "Every record stays."]) expect(joined.split(value)).toHaveLength(2);
  });

  it("gives a long guide distinct licensed chapter scenes while leaving sources and data uncluttered", () => {
    const headings = ["Understand an estimate", "Packing responsibility", "Compare access", "Record the inventory", "Delivery questions", "Storage", "Specialty items", "Read the payment terms", "Plan the route", "Keep the documents", "Sources"];
    const chapters = headings.map(heading => ({ heading, kind: heading === "Sources" ? "sources" : "narrative" }));
    const plan = storyMediaPlan(manifest.assets, "/moving-costs/how-movers-charge/", chapters, "How movers charge");
    const photos = plan.chapterImages.filter(Boolean);
    expect(photos).toHaveLength(10);
    expect(new Set(photos.map(image => image.id)).size).toBe(photos.length);
    expect(plan.chapterImages[10]).toBeNull();
    expect(plan.steps).toEqual([]);
    for (const image of photos) { expect(image.tags).not.toContain("hero"); expect(image.credit.license).toBeTruthy(); expect(image.credit.source_url).toBeTruthy(); }
    const short = storyMediaPlan(manifest.assets, "/contact/", [{ heading: "Your question" }], "Contact");
    expect(new Set([...short.chapterImages.filter(Boolean), ...short.steps.map(item => item.image)].map(image => image.id)).size).toBe(5);
  });

  it("uses the chapter's actual service subject instead of repeating the overall cost-page scene", () => {
    const plan = storyMediaPlan(manifest.assets, "/moving-costs/", [{ heading: "Storage" }, { heading: "Packing your belongings" }], "Moving costs");
    expect(plan.chapterImages[0].tags).toContain("service:storage");
    expect(plan.chapterImages[1].tags).toContain("service:packing");
  });
});

const content = relative => fileURLToPath(new URL(`../../../../content/${relative}`, import.meta.url));
const tokens = JSON.parse(readFileSync(content("tokens.json"), "utf8"));
const resolver = createTokenResolver(tokens, { storedText: () => "A recorded platform rule." });

describe("served consumer guide improvements", () => {
  for (const file of ["costs/moving-costs", "costs/how-movers-charge", "costs/calculator-method", "trust/how-we-verify-movers", "trust/movers-vs-brokers", "trust/which-companies-receive-my-request", "trust/review-methodology", "trust/editorial-policy"]) {
    it(`${file} keeps an answer, useful actions and the complete linked body`, () => {
      const parsed = parseFrontMatter(readFileSync(content(`pages/${file}.md`), "utf8"));
      const { html } = renderMarkdown(parsed.content, { resolveToken: resolver, mode: "public" });
      const overview = guideOverview(html);
      expect(overview.answer).toMatch(/<p>/);
      expect(overview.actions).toContain('id="start-here"');
      expect((overview.actions.match(/<li>/g) ?? []).length).toBe(3);
      expect(overview.body).toMatch(/<h2/);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      if (file === "costs/moving-costs") expect(overview.body).toContain('<h2 id="by-home-size"');
      if (file === "costs/how-movers-charge") expect(overview.body).toContain('<h2 id="which-rules-apply-to-your-move"');
      expect((overview.answer + overview.actions + overview.body).match(/<table>/g)?.length ?? 0).toBe((html.match(/<table>/g) ?? []).length);
      expect(chapterKind("<table></table>", "Compare your estimates")).toBe("data");
      expect(parsed.data.last_updated).toBeTruthy();
    });
  }
});
