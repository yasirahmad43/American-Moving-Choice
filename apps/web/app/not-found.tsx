import { Container, LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteChrome>
      <Container size="reading" className="grid gap-5 section-pad">
        <p className="type-overline text-text-2">Error 404</p>
        <h1 className="type-display-l text-text">We can't find that page</h1>
        <p className="type-lede text-text-2">
          The address may be mistyped, or the page may not be published yet. This preview build is still adding pages.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/" variant="primary">
            Go to the home page
          </LinkButton>
          <Link href="/contact/" className="link inline-flex min-h-12 items-center">
            Contact us
          </Link>
        </div>
      </Container>
    </SiteChrome>
  );
}
