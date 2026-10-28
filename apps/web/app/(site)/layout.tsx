import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site-chrome";

/** Public pages: preview banner, header, footer (build plan §8). Pages render inside <main>. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
