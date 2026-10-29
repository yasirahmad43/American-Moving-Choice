import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";

const config = vi.hoisted(() => ({ WEB_URL: "https://amc.example", SITE_INDEXABLE: false }));
const asset = vi.hoisted(() => ({ src: "/media/packing.webp", width: 1168, height: 880, alt: "Moving boxes beside a packed bookcase" }));
vi.mock("server-only", () => ({}));
vi.mock("@amc/server/env", () => ({ env: () => config }));
vi.mock("@/components/site/json-ld", async () => import("../site/json-ld.tsx"));
vi.mock("@/lib/page-media", () => ({ pageCardImage: vi.fn(() => asset) }));
vi.mock("@/components/site/social-metadata", async () => import("../site/social-metadata.ts"));

const { seoMetadata, pageLd, seoPageHeading } = await import("./seo-metadata.ts");
const { JsonLd, jsonLdString, webPageLd } = await import("../site/json-ld.tsx");
const { socialMetadata } = await import("../site/social-metadata.ts");

function publishedPage(overrides = {}) {
  return {
    id: "test-page", url: "/movers/texas/austin/", slug: "austin", family: "city", stateCode: "TX",
    title: "Moving in Austin, Texas", h1: "Movers in Austin, Texas: compare screened moving companies",
    metaDescription: "Plan an Austin move with local access considerations and sourced guidance.",
    indexable: true, canonicalUrl: "/movers/texas/austin/",
    content: { schemaType: "Article", intro: { answer: "Plan your move." }, sections: [], faq: [], related: [], quote: {} },
    sources: [], publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T15:00:00Z"),
    ...overrides,
  };
}

describe("public page search metadata", () => {
  afterEach(() => { config.SITE_INDEXABLE = false; });

  it.each([true, false])("preserves demo noindex/nofollow when record indexable is %s", (indexable) => {
    const meta = seoMetadata(publishedPage({ indexable }));
    expect(meta.robots).toEqual({ index: false, follow: false, googleBot: { index: false, follow: false } });
    expect(meta.alternates?.canonical).toBeUndefined();
  });

  it("publishes a canonical only when the site and the record both permit indexing", () => {
    config.SITE_INDEXABLE = true;
    const meta = seoMetadata(publishedPage());
    expect(meta.alternates.canonical).toBe("https://amc.example/movers/texas/austin/");
    expect(meta.robots).toBeUndefined();
    const excluded = seoMetadata(publishedPage({ indexable: false }));
    expect(excluded.robots).toEqual({ index: false, follow: true, googleBot: { index: false, follow: true } });
    expect(excluded.alternates?.canonical).toBeUndefined();
  });

  it("continues projecting archived company identities out of titles, descriptions and share metadata", () => {
    const page = publishedPage({ title: "Old Company moving guide", metaDescription: "Move with Old Company." });
    page.content.sections = [{ id: "archived", heading: "Coverage", blocks: [{ type: "movers", items: [{ name: "Old Company" }] }] }];
    const meta = seoMetadata(page);
    expect(JSON.stringify(meta)).not.toContain("Old Company");
    expect(meta.title.absolute).toContain("a participating moving company");
  });
});

describe("structured data matches the visible page", () => {
  it("shares the exact existing city headline normalization with the visible hero", () => {
    const page = publishedPage();
    expect(seoPageHeading(page)).toBe("Movers in Austin, Texas");
    expect(pageLd(config.WEB_URL, page).headline).toBe(seoPageHeading(page));
    expect(pageLd(config.WEB_URL, page).name).toBe(seoPageHeading(page));
    expect(seoPageHeading({ ...page, family: "question" })).toBe(page.h1);
    expect(seoPageHeading({ ...page, h1: "Moving in Austin: a practical guide" })).toBe("Moving in Austin: a practical guide");
  });

  it("describes the supplied visible image and real dates without assigning the publisher as author", () => {
    const ld = pageLd(config.WEB_URL, publishedPage(), asset);
    expect(ld.image).toEqual({ "@type": "ImageObject", url: "https://amc.example/media/packing.webp", width: 1168, height: 880 });
    expect(ld.datePublished).toBe("2026-10-27T12:00:00.000Z");
    expect(ld.dateModified).toBe("2026-10-28T15:00:00.000Z");
    expect(ld.publisher).toEqual({ "@id": "https://amc.example/#organization" });
    expect(ld.isPartOf).toEqual({ "@id": "https://amc.example/#website" });
    for (const field of ["author", "review", "aggregateRating", "offers", "telephone", "address"]) expect(ld).not.toHaveProperty(field);
  });

  it("does not invent an image or publication date when one is not supplied", () => {
    const ld = pageLd(config.WEB_URL, publishedPage({ publishedAt: null }));
    expect(ld).not.toHaveProperty("image");
    expect(ld).not.toHaveProperty("datePublished");
    expect(pageLd(config.WEB_URL, publishedPage({ content: { schemaType: "CollectionPage" } })).headline).toBeUndefined();
  });

  it("supports the actual rendered editorial Article image without inventing authorship", () => {
    const page = { url: "/moving-costs/", name: "How much do movers cost?", description: "What changes a moving estimate.", type: "Article" };
    expect(webPageLd(config.WEB_URL, page)).not.toHaveProperty("image");
    const ld = webPageLd(config.WEB_URL, { ...page, image: { ...asset, src: "https://cdn.example/photo.webp" } });
    expect(ld.image.url).toBe("https://cdn.example/photo.webp");
    expect(ld.image.width).toBe(asset.width);
    expect(ld.headline).toBe(page.name);
    expect(ld).not.toHaveProperty("author");
  });

  it("keeps user-controlled strings inside a single parseable native JSON-LD script", () => {
    const data = { headline: "</script><script>alert('x')</script>\u2028\u2029", description: "A & B < C" };
    const encoded = jsonLdString(data);
    expect(encoded).not.toMatch(/[<\u2028\u2029]/);
    expect(JSON.parse(encoded)).toEqual(data);
    const html = renderToStaticMarkup(createElement(JsonLd, { data }));
    expect((html.match(/<script\b/g) ?? []).length).toBe(1);
    expect(JSON.parse(html.match(/<script[^>]*>([^]*?)<\/script>/)[1])).toEqual(data);
  });
});

describe("social metadata", () => {
  it("keeps the real licensed image, dimensions and accessible description consistent across share cards", () => {
    const meta = socialMetadata("/moving-costs/", "Moving costs", "Plan a moving budget.", { type: "article" });
    expect(meta.openGraph.url).toBe("https://amc.example/moving-costs/");
    expect(meta.openGraph.type).toBe("article");
    expect(meta.openGraph.images).toEqual([{ url: "https://amc.example/media/packing.webp", width: 1168, height: 880, alt: asset.alt }]);
    expect(meta.twitter.images).toEqual([{ url: meta.openGraph.images[0].url, alt: asset.alt }]);
    expect(meta.twitter.card).toBe("summary_large_image");
  });
});
