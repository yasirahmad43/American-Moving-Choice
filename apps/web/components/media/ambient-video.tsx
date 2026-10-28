"use client";

/**
 * Ambient background video: poster first, `preload="none"`, muted and silent, no controls. The
 * file loads and plays only when the element is in view, only when the manifest marks the asset
 * `autoplay`, and never under prefers-reduced-motion (the poster stays). Decorative: aria-hidden.
 */
import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/media";

export function AmbientVideo({ asset, className }: { asset: MediaAsset; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !asset.autoplay) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    let observer: IntersectionObserver | undefined;
    const idle = (cb: () => void) => ("requestIdleCallback" in window ? (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(cb) : setTimeout(cb, 600));
    idle(() => {
      if (typeof IntersectionObserver === "undefined") {
        setReady(true);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) {
            setReady(true);
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(video);
    });
    const onChange = () => {
      if (reduced.matches) video.pause();
    };
    reduced.addEventListener("change", onChange);
    return () => {
      observer?.disconnect();
      reduced.removeEventListener("change", onChange);
    };
  }, [asset.autoplay]);

  return (
    <video
      ref={ref}
      className={`block h-full w-full object-cover ${className ?? ""}`}
      poster={asset.poster}
      width={asset.width}
      height={asset.height}
      muted
      loop
      playsInline
      autoPlay={false}
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
      disableRemotePlayback
    >
      {ready
        ? (asset.sources ?? [{ src: asset.src, type: "video/mp4" }]).map((source) => <source key={source.src} src={source.src} type={source.type} />)
        : null}
    </video>
  );
}
