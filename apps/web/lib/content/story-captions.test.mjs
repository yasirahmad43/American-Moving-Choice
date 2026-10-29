import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";
import { storyCaption } from "./story-captions.ts";

vi.mock("@amc/ui", () => ({ LineIcon: () => null }));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return { default: ({ children, ...props }) => createElement("a", props, children) };
});
vi.mock("@/components/media/media-frame", async () => {
  const { createElement } = await import("react");
  return {
    // Check the StoryPhoto-to-MediaFrame contract without Next's image optimizer.
    MediaFrame: ({ asset, alt }) => createElement("img", { src: asset.src, alt: alt ?? asset.alt }),
    MediaCreditLine: () => null,
  };
});
vi.mock("@/lib/content/story-plan", async () => import("./story-plan.ts"));
vi.mock("@/lib/content/story-captions", async () => import("./story-captions.ts"));

const { StoryPhoto, StorySections, htmlChapters, reactChapters } = await import("../../components/site/story-sections.tsx");
const asset = { id: "tablet-regression", kind: "image", src: "/media/tablet.webp", alt: "Tablet with a blurred form on a sofa", width: 1168, height: 880 };

describe("reader captions and accessible image descriptions", () => {
  it("gives the screenshot's heading-free request assurance an intentional task caption", () => {
    const html = renderToStaticMarkup(createElement(StorySections, {
      chapters: [{ key: "assurance", content: createElement("blockquote", null, "Free to use. You choose how many may contact you.") }],
      images: [asset], planned: true, url: "/which-companies-receive-my-request/", topic: "Which companies receive my request?",
    }));
    expect(html).toContain("Free to use. You choose how many may contact you.");
    expect(html).toMatch(/<p class="story-chapter-context">You choose your contact limit\.<\/p>/);
    expect(html.split("You choose your contact limit.")).toHaveLength(2);
    expect(html).toContain('alt="Tablet with a blurred form on a sofa"');
    expect(html).not.toMatch(/<figcaption>[^]*Tablet with a blurred form on a sofa/);
  });
  it("omits an unprovided or blank visible caption while preserving accessible alt text", () => {
    for (const caption of [undefined, "", "  "]) {
      const html = renderToStaticMarkup(createElement(StoryPhoto, { asset, caption }));
      expect(html).not.toContain("figcaption");
      expect(html).toContain('alt="Tablet with a blurred form on a sofa"');
    }
  });
  it("leaves contextless unheaded chapters captionless and preserves their full content", () => {
    const html = renderToStaticMarkup(createElement(StorySections, { chapters: [{ key: "content", content: createElement("p", null, "Keep the complete reader guidance.") }], images: [asset], planned: true }));
    expect(html).toContain("Keep the complete reader guidance.");
    expect(html).not.toContain("figcaption");
    expect(html).toContain('alt="Tablet with a blurred form on a sofa"');
  });
  it("uses section headings first and page context only when a chapter has no heading", () => {
    expect(storyCaption({ heading: "  Review your choices  ", url: "/which-companies-receive-my-request/", topic: "Page title" })).toBe("Review your choices");
    expect(storyCaption({ url: "/report-a-concern/", topic: "Report a concern or a broker" })).toBe("Tell us what happened.");
    expect(storyCaption({ url: "/another-guide/", topic: "  Make a complete moving plan  " })).toBe("Make a complete moving plan");
    expect(storyCaption({ heading: " ", topic: " " })).toBeUndefined();
  });
});

describe("compact chapter content preservation", () => {
  it("moves each original HTML heading and anchor once, keeping the complete guidance and source", () => {
    const original = '<h2 id="prices">Costs <a class="heading-anchor" href="#prices">#</a></h2><p>A $1,100 example as of 2026-10-28 stays qualified.</p><p>Read <a href="https://www.fmcsa.dot.gov/">the official guidance</a> before agreeing.</p><h2 id="records">Every record</h2><div class="table-wrap"><table><tbody><tr><td>78701</td><td>18,210</td></tr></tbody></table></div>';
    const chapters = htmlChapters(original);
    const html = renderToStaticMarkup(createElement(StorySections, { chapters, images: [] }));
    for (const value of ['id="prices"', 'id="records"', '$1,100', '2026-10-28', 'href="https://www.fmcsa.dot.gov/"', '78701', '18,210']) expect(html.split(value)).toHaveLength(2);
    expect(html).toContain('href="#prices"');
    expect(html.match(/<h2\b/g)).toHaveLength(2);
    expect(html).toContain("stays qualified.");
    expect(html).toContain("before agreeing.");
    expect(html.indexOf('id="prices"')).toBeLessThan(html.indexOf("A $1,100 example"));
  });

  it("retains a JSX heading, disclosure and all native table fields with their associations", () => {
    const nodes = [createElement("h2", { key: "h", id: "checks" }, "Check the details"),
      createElement("details", { key: "d" }, createElement("summary", null, "The complete limit"), createElement("p", null, "Keep this qualification.")),
      createElement("div", { key: "t", className: "table-wrap", role: "region", "aria-label": "Checks", tabIndex: 0 }, createElement("table", null,
        createElement("thead", null, createElement("tr", null, ...["Item", "Source", "Date"].map(text => createElement("th", { key: text }, text)))),
        createElement("tbody", null, createElement("tr", { id: "record-1" }, createElement("td", null, "USDOT check"), createElement("td", null, createElement("a", { href: "https://www.fmcsa.dot.gov/" }, "FMCSA")), createElement("td", null, "2026-10-28"))))),
    ];
    const chapters = reactChapters(nodes);
    const html = renderToStaticMarkup(createElement(StorySections, { chapters, images: [] }));
    expect(chapters[0].kind).toBe("data");
    for (const value of ['id="checks"', 'id="record-1"', 'href="https://www.fmcsa.dot.gov/"', 'USDOT check', '2026-10-28', 'Keep this qualification.']) expect(html.split(value)).toHaveLength(2);
    expect(html).toContain('data-label="Date"');
    expect(html).toContain('<details>');
    expect(html.match(/<h2\b/g)).toHaveLength(1);
  });
});
