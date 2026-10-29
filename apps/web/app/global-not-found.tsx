import "@amc/ui/fonts.css";
import "./globals.css";
import "@/components/site/compact-layout.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@amc/ui";
import { ClosingSurvey } from "@/components/site/closing-survey";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Page not found | American Moving Choice",
  robots: { index: false, follow: false },
};

/** The routing-level 404 bypasses dynamic layout queries and works without JavaScript. */
export default function GlobalNotFound() {
  return <html lang="en" data-theme="light"><body className="bg-bg text-text">
    <div className="site-experience flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-24 max-w-content flex-wrap items-center justify-between gap-4 py-3 gutter">
          <Wordmark href="/" className="max-w-[min(52vw,15rem)]" />
          <Link href="/explore/" className="inline-flex min-h-12 items-center font-semibold text-link underline underline-offset-4">Browse moving guides</Link>
        </div>
      </header>
      <main id="main" className="flex-1"><NotFoundContent /><ClosingSurvey /></main>
      <footer className="border-t border-border bg-surface">
        <nav aria-label="Recovery navigation" className="mx-auto flex max-w-content flex-wrap gap-x-6 gap-y-2 py-5 gutter">
          <Link href="/" className="inline-flex min-h-11 items-center text-link underline">Home</Link>
          <Link href="/get-quotes/" className="inline-flex min-h-11 items-center text-link underline">Get moving quotes</Link>
          <Link href="/contact/" className="inline-flex min-h-11 items-center text-link underline">Contact us</Link>
          <Link href="/privacy/" className="inline-flex min-h-11 items-center text-link underline">Privacy policy</Link>
        </nav>
      </footer>
    </div>
  </body></html>;
}
