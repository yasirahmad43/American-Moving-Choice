import "@amc/ui/fonts.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Company portal | American Moving Choice", template: "%s | American Moving Choice" },
  description: "Company portal and administration for American Moving Choice.",
  applicationName: "American Moving Choice",
  // Private app: never indexed (site architecture §8.6). The X-Robots-Tag header says the same.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1222" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg text-text">{children}</body>
    </html>
  );
}
