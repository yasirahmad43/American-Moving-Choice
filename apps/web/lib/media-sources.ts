/**
 * Media types and the pure helpers that client components need (no manifest import, so the
 * 400-asset manifest never reaches the browser bundle). The loader itself is lib/media.ts.
 */
export type MediaKind = "image" | "video";

export interface MediaCredit {
  creator: string;
  source_url?: string;
  license: string;
  attribution_required: boolean;
}

export interface MediaSource {
  src: string;
  type: string;
  /** A smaller tier for small viewports; absent for the full-size encoding. */
  width?: number;
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string;
  srcset?: { src: string; width: number }[];
  sources?: MediaSource[];
  poster?: string;
  width: number;
  height: number;
  alt: string;
  autoplay?: boolean;
  duration?: number;
  blurDataURL?: string;
  credit: MediaCredit;
  generator?: { provider?: string; model?: string; prompt?: string; job_id?: string; generated_at?: string };
  tags: string[];
  usedOn: string[];
  placeholder?: boolean;
  generated?: boolean;
}

/** The video sources in playback order for a viewport: the smaller tier first on narrow screens. */
export function videoSourcesFor(asset: MediaAsset, viewportWidth: number): MediaSource[] {
  const sources = asset.sources?.length ? asset.sources : [{ src: asset.src, type: "video/mp4" }];
  const small = viewportWidth > 0 && viewportWidth < 900;
  const tier = (source: MediaSource) => (source.width && source.width < asset.width ? "small" : "full");
  return [...sources].sort((a, b) => {
    const pa = tier(a) === (small ? "small" : "full") ? 0 : 1;
    const pb = tier(b) === (small ? "small" : "full") ? 0 : 1;
    return pa - pb;
  });
}
