import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** SiteLayout already provides the header, main, closing survey and footer. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
