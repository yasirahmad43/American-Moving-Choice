import type { SeoFamily } from "./slugs";

/** Shared by public XML and admin reporting so large editorial families cannot diverge. */
export const SEO_SITEMAP_CHUNK = 1000;
export const SEO_SITEMAP_SEGMENTS: readonly { name: string; family: SeoFamily; chunked: boolean }[] = [
  { name: "states", family: "state", chunked: false },
  { name: "cities", family: "city", chunked: true },
  { name: "zips", family: "zip", chunked: false },
  { name: "routes", family: "route", chunked: true },
  { name: "services", family: "service", chunked: false },
  { name: "costs", family: "cost", chunked: false },
  { name: "questions", family: "question", chunked: true },
  { name: "planning", family: "planning", chunked: true },
];
