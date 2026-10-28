"use client";

/**
 * Shown when the root layout itself fails. It replaces the whole document, so it brings its own
 * html, body and styles. No technical detail is shown.
 */
import "@amc/ui/fonts.css";
import "./globals.css";

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg text-text">
        <title>Something went wrong | American Moving Choice</title>
        <meta name="robots" content="noindex, nofollow" />
        <main id="main" className="mx-auto grid max-w-reading gap-5 py-14 gutter">
          <h1 className="type-display-l text-text">Something went wrong</h1>
          <p className="text-text-2">This page couldn&apos;t load. Try again, or come back in a few minutes.</p>
          <div>
            <button type="button" className="link min-h-11" onClick={() => retry()}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
