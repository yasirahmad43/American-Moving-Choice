/**
 * Renders a manifest asset: stills through next/image (sized, blurred preview from the manifest,
 * lazy below the fold, priority when it is the LCP element) and videos through the lazy ambient
 * player with a poster. The frame covers its box, so callers decide the aspect ratio.
 */
import Image from "next/image";
import { AmbientVideo } from "./ambient-video";
import { isUnoptimizable, srcSetOf, type MediaAsset } from "@/lib/media";

export interface MediaFrameProps {
  asset: MediaAsset;
  /** The hero's LCP image: eager, high priority. */
  priority?: boolean;
  /** Sizes hint for responsive images (defaults to full width). */
  sizes?: string;
  /** Cover the box (default) or keep the asset's own aspect ratio. */
  fit?: "cover" | "contain";
  /** Override the manifest alt (e.g. "" when a captioned frame already describes the picture). */
  alt?: string;
  className?: string;
}

export function MediaFrame({ asset, priority = false, sizes = "100vw", fit = "cover", alt, className }: MediaFrameProps) {
  const objectFit = fit === "cover" ? "object-cover" : "object-contain";
  if (asset.kind === "video") {
    return <AmbientVideo asset={asset} className={className} />;
  }
  // Runtime uploads already have optimized WebP tiers. Serve directly from their recorded
  // public URL, so the web app needs no privileged Storage key or remote optimizer allowlist.
  if (/^https?:\/\//.test(asset.src)) {
    return <img src={asset.src} srcSet={srcSetOf(asset)} sizes={sizes} alt={alt ?? asset.alt}
      width={asset.width} height={asset.height} loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined} decoding="async"
      className={`block h-full w-full ${objectFit} ${className ?? ""}`} />;
  }
  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      unoptimized={isUnoptimizable(asset)}
      placeholder={asset.blurDataURL ? "blur" : "empty"}
      blurDataURL={asset.blurDataURL}
      className={`block h-full w-full ${objectFit} ${className ?? ""}`}
    />
  );
}

/** Small attribution line, shown only when the asset's licence asks for it. */
export function MediaCreditLine({ asset, className }: { asset: MediaAsset; className?: string }) {
  if (!asset.credit.attribution_required) return null;
  return (
    <p className={className ?? "type-legal text-text-3"}>
      {asset.credit.source_url ? (
        <a href={asset.credit.source_url} className="link" rel="noopener noreferrer">
          {asset.credit.creator}
        </a>
      ) : (
        asset.credit.creator
      )}
      {asset.credit.license ? ` · ${asset.credit.license}` : null}
    </p>
  );
}
