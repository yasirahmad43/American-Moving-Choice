import type { Metadata } from "next";
import { socialMetadata } from "./social-metadata";

/** Metadata for a TSX page: absolute title, description and self-canonical URL (site architecture §2.4, §8.2). */
export function pageMetadata(url: string, title: string, description: string, options: { noindex?: boolean } = {}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...socialMetadata(url, title, description),
    ...(options.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
