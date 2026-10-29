import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
