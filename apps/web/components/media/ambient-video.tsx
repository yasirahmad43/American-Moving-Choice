"use client";

/** Poster-first ambient video with explicit motion control. No video request is made until the
 * frame is visible, the document is visible, motion is permitted and playback is wanted. */
import { useEffect, useRef, useState } from "react";
import { videoSourcesFor, type MediaAsset } from "@/lib/media-sources";

export function AmbientVideo({ asset, className }: { asset: MediaAsset; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userPaused, setUserPaused] = useState(!asset.autoplay);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let mounted = true;
    let inView = false;
    let pausedByUser = !asset.autoplay;
    let generation = 0;
    let idle: { id: number; native: boolean } | null = null;
    let observer: IntersectionObserver | null = null;

    const allowed = () => mounted && inView && !document.hidden && !preference.matches && !pausedByUser;
    const cancelIdle = () => {
      if (!idle) return;
      if (idle.native) window.cancelIdleCallback(idle.id);
      else window.clearTimeout(idle.id);
      idle = null;
    };
    const pause = () => {
      generation += 1;
      video.pause();
      if (mounted) setPlaying(false);
    };
    const posterOnly = () => {
      if (video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    };
    const play = () => {
      idle = null;
      // Visibility or the user's choice can change while an idle callback is waiting.
      if (!allowed()) return;
      if (!video.hasAttribute("src")) {
        const candidates = videoSourcesFor(asset, window.innerWidth);
        const source = candidates.find((candidate) => video.canPlayType(candidate.type)) ?? candidates[0];
        if (!source) return;
        video.src = source.src;
        video.load();
      }
      const attempt = ++generation;
      void video.play().then(() => {
        // A pending play promise must never undo Pause, a tab change or reduced motion.
        if (!mounted || generation !== attempt) return;
        if (!allowed()) video.pause();
        else setPlaying(true);
      }).catch(() => {
        if (!mounted || generation !== attempt) return;
        pausedByUser = true;
        setUserPaused(true);
        setPlaying(false);
      });
    };
    const reconcile = (immediate = false) => {
      cancelIdle();
      if (!allowed()) {
        pause();
        return;
      }
      if (immediate) play();
      else if (typeof window.requestIdleCallback === "function") {
        idle = { id: window.requestIdleCallback(play, { timeout: 1200 }), native: true };
      } else {
        idle = { id: window.setTimeout(play, 300), native: false };
      }
    };
    const checkViewport = () => {
      const rect = video.getBoundingClientRect();
      inView = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      reconcile();
    };
    const onMotionChange = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) {
        cancelIdle();
        pause();
        posterOnly();
      } else reconcile();
    };
    const onVisibility = () => reconcile();
    const onPlaying = () => {
      if (!allowed()) pause();
      else setPlaying(true);
    };
    const onPause = () => { if (mounted) setPlaying(false); };
    const onError = () => {
      cancelIdle();
      pause();
      pausedByUser = true;
      setUserPaused(true);
      setFailed(true);
      posterOnly();
    };

    toggleRef.current = () => {
      pausedByUser = !pausedByUser;
      setUserPaused(pausedByUser);
      setFailed(false);
      reconcile(true);
    };
    setInitialized(true);
    setReducedMotion(preference.matches);
    setUserPaused(pausedByUser);
    setFailed(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVisibility);
    preference.addEventListener("change", onMotionChange);

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => {
        if (!mounted || !entry) return;
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        reconcile();
      }, { threshold: [0, 0.1] });
      observer.observe(video);
    } else {
      window.addEventListener("scroll", checkViewport, { passive: true });
      window.addEventListener("resize", checkViewport, { passive: true });
      checkViewport();
    }

    return () => {
      mounted = false;
      cancelIdle();
      pause();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onMotionChange);
      window.removeEventListener("scroll", checkViewport);
      window.removeEventListener("resize", checkViewport);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      toggleRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [asset]);

  const status = reducedMotion
    ? "Background video disabled for reduced motion. A still image is shown."
    : failed ? "Background video unavailable. A still image is shown."
    : playing ? "Background video playing." : "Background video paused.";

  return (
    <div className="relative h-full w-full">
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
      />
      {initialized && !reducedMotion ? (
        <button
          type="button"
          data-video-control=""
          onClick={() => toggleRef.current?.()}
          aria-label={userPaused ? "Play background video" : "Pause background video"}
          className="absolute right-4 top-4 z-20 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-white/40 bg-[#061c38]/90 px-3 text-white shadow-lg transition-colors hover:bg-[#061c38] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {userPaused ? <path d="M4 2.5v11L13 8 4 2.5Z" /> : <><rect x="3" y="2" width="3" height="12" rx="1" /><rect x="10" y="2" width="3" height="12" rx="1" /></>}
          </svg>
          <span className="text-xs font-semibold">{userPaused ? "Play" : "Pause"}</span>
        </button>
      ) : null}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{initialized ? status : "Background still image."}</span>
    </div>
  );
}
