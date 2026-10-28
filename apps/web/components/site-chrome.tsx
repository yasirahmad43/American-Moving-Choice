import { SkipLink } from "@amc/ui";
import type { ReactNode } from "react";
import { PreviewBanner } from "./preview-banner";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Skip link, preview banner, header, main landmark and footer around public pages. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PreviewBanner />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
