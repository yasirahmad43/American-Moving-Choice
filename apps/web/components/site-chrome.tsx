import { IconSprite, ScrollProgress, SkipLink } from "@amc/ui";
import { Suspense, type ReactNode } from "react";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";
import { MotionProvider } from "./motion/motion-provider";
import { ReviewModeFlag } from "./site/review-mode-flag";
import { ClosingSurvey } from "./site/closing-survey";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * Skip link, header, main landmark and footer around public pages. The preview notice lives in
 * the footer; reviewer notes are revealed only in development with ?review=1. Pass 2 adds the
 * line-icon sprite, the scroll progress line and the lazy GSAP MotionProvider.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <IconSprite />
      <SkipLink />
      <ScrollProgress />
      {REVIEW_NOTES_IN_HTML ? (
        <Suspense fallback={null}>
          <ReviewModeFlag />
        </Suspense>
      ) : null}
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
        <ClosingSurvey />
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <MotionProvider />
      </Suspense>
    </div>
  );
}
