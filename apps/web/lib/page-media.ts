import "server-only";
import { mediaManifest } from "./media";
import { buildPageCardMedia, buildPageMediaPlan, type PageMediaOptions, type PageMediaPlan } from "./page-media-plan";

export type { PageMediaOptions, PageMediaPlan } from "./page-media-plan";

/** Reusable editorial illustrations, independent of exclusive hero/upload ownership. */
export function pageMediaPlan(url: string, options: PageMediaOptions = {}): PageMediaPlan {
  return buildPageMediaPlan(mediaManifest(), url, options);
}

export function pageCardImage(url: string, options: PageMediaOptions = {}, usedIds = new Set<string>()) {
  return buildPageCardMedia(mediaManifest(), url, options, usedIds);
}
