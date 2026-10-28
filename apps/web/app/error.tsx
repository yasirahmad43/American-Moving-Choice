"use client";

import { Alert, Button } from "@amc/ui";
import { PreviewBanner } from "@/components/preview-banner";

/**
 * Shown when a page fails. Says what happened without technical detail; retry re-fetches the page.
 * It replaces the route-group layouts, so it renders the preview notice itself (build plan §8).
 */
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PreviewBanner />
      <main id="main" className="mx-auto grid max-w-reading gap-5 py-14 gutter">
        <h1 className="type-display-l text-text">Something went wrong</h1>
        <Alert tone="error" role="none">
          This page couldn&apos;t load. Try again, or come back in a few minutes. If you were sending a quote request and didn&apos;t reach
          the confirmation page, it may not have been sent.
        </Alert>
        <div>
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </main>
    </>
  );
}
