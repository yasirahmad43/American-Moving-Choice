import "server-only";
import type { Metadata } from "next";
import { env } from "@amc/server/env";
import { pageCardImage, type PageMediaOptions } from "@/lib/page-media";

/** Licensed topic imagery, with real dimensions, for links shared outside the site. */
export function socialMetadata(url: string, title: string, description: string, options: PageMediaOptions & { type?: "website" | "article" } = {}): Pick<Metadata, "openGraph" | "twitter"> {
  const { WEB_URL } = env();
  const asset = pageCardImage(url, { ...options, topic: options.topic ?? title });
  const image = { url: new URL(asset.src, WEB_URL).href, width: asset.width, height: asset.height, alt: asset.alt };
  return {
    openGraph: { title, description, url: new URL(url, WEB_URL).href, type: options.type ?? "website", siteName: "American Moving Choice", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image.url, alt: image.alt }] },
  };
}
