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

const { StoryPhoto, StorySections } = await import("../../components/site/story-sections.tsx");
const asset = { id: "tablet-regression", kind: "image", src: "/media/tablet.webp", alt: "Tablet with a blurred form on a sofa", width: 1168, height: 880 };

describe("reader captions and accessible image descriptions", () => {
  it("gives the screenshot's heading-free request assurance an intentional task caption", () => {
    const html = renderToStaticMarkup(createElement(StorySections, {
      chapters: [{ key: "assurance", content: createElement("blockquote", null, "Free to use. You choose how many may contact you.") }],
      images: [asset], planned: true, url: "/which-companies-receive-my-request/", topic: "Which companies receive my request?",
    }));
    expect(html).toContain("Free to use. You choose how many may contact you.");
    expect(html).toMatch(/<figcaption>[^]*You choose your contact limit\.<\/figcaption>/);
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
