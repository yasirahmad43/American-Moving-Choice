/**
 * Renders a manifest asset: images through next/image (sized, lazy below the fold, priority when
 * it is the LCP element) and videos through the lazy ambient player with a poster. The frame
 * covers its box, so callers decide the aspect ratio.
 */
import Image from "next/image";
import { AmbientVideo } from "./ambient-video";
import { isUnoptimizable, type MediaAsset } from "@/lib/media";

export interface MediaFrameProps {
  asset: MediaAsset;
  /** The hero's LCP image: eager, high priority. */
  priority?: boolean;
  /** Sizes hint for responsive images (defaults to full width). */
  sizes?: string;
  /** Cover the box (default) or keep the asset's own aspect ratio. */
  fit?: "cover" | "contain";
  className?: string;
}

export function MediaFrame({ asset, priority = false, sizes = "100vw", fit = "cover", className }: MediaFrameProps) {
  const objectFit = fit === "cover" ? "object-cover" : "object-contain";
  if (asset.kind === "video") {
    return <AmbientVideo asset={asset} className={className} />;
  }
  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      unoptimized={isUnoptimizable(asset)}
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
