import "@amc/ui/fonts.css";
import "./globals.css";
import { env } from "@amc/server/env";
import { JsFlag } from "@amc/ui";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export function generateMetadata(): Metadata {
  const { WEB_URL, SITE_INDEXABLE } = env();
  return {
    metadataBase: new URL(WEB_URL),
    title: { default: "American Moving Choice", template: "%s | American Moving Choice" },
    // No default description: ST-1c is only for the home, About and "How AMC makes money" pages,
    // which set it themselves (content/stored-texts.md, site architecture §8.2).
    applicationName: "American Moving Choice",
    // Preview: noindex, nofollow on every page unless SITE_INDEXABLE=true (build plan §8).
    robots: SITE_INDEXABLE ? undefined : { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1222" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsFlag />
      </head>
      <body className="min-h-dvh bg-bg text-text">{children}</body>
    </html>
  );
}
