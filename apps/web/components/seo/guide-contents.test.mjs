import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideContents } from "./guide-contents.tsx";

describe("complete guide navigation on narrow screens", () => {
  it("server-renders every section beyond the three highlight cards and all real supporting targets", () => {
    const sections = Array.from({ length: 9 }, (_, index) => ({ id: `chapter-${index + 1}`, heading: `Moving detail ${index + 1}` }));
    const html = renderToStaticMarkup(createElement(GuideContents, { sections, hasFacts: true, hasFaq: true }));
    expect(html).toContain("<details");
    expect(html).toContain("<summary>");
    for (const section of sections) expect(html).toContain(`href="#${section.id}"`);
    expect(html).toContain('href="#facts-and-sources"');
    expect(html).toContain('href="#faq"');
    expect(html).toContain('href="#sources-and-methodology"');
    expect(html).not.toMatch(/<button|onclick|javascript:/i);
  });
  it("escapes stored headings and omits optional targets absent from the actual document", () => {
    const html = renderToStaticMarkup(createElement(GuideContents, { sections: [{ id: "quote", heading: '<script>alert("fake")</script> & estimates' }], hasFacts: false, hasFaq: false }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('href="#faq"');
    expect(html).not.toContain('href="#facts-and-sources"');
    expect(renderToStaticMarkup(createElement(GuideContents, { sections: [], hasFacts: false, hasFaq: false }))).toBe("");
  });
});
