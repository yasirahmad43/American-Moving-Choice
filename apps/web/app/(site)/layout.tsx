import "@/components/site/prose.css";
import "@/components/site/compact-layout.css";
import { env } from "@amc/server/env";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { JsonLd, organizationId } from "@/components/site/json-ld";
import { PUBLIC_ROLE_STATEMENT } from "@/lib/public-copy";
import { token } from "@/lib/content/pages";

/**
 * Public pages: preview banner, header, footer (build plan §8), and the sitewide Organization
 * JSON-LD (site architecture §7.1, §8.5): one node with the canonical @id, the exact name and the
 * public role statement as its description. Publish the supplied legal name and exact logo;
 * omit address, contact points and sameAs until the owner supplies real ones.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  const { WEB_URL } = env();
  const legalName = token("org.legal_name");
  return (
    <SiteChrome>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": organizationId(WEB_URL),
          name: "American Moving Choice",
          ...(legalName.kind === "value" ? { legalName: legalName.text } : {}),
          url: `${WEB_URL}/`,
          logo: { "@type": "ImageObject", url: `${WEB_URL}/brand/american-moving-choice-logo.png`, width: 1774, height: 887 },
          description: PUBLIC_ROLE_STATEMENT,
        }}
      />
      {children}
    </SiteChrome>
  );
}
