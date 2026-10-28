import "@/components/site/prose.css";
import { env } from "@amc/server/env";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { JsonLd, organizationId } from "@/components/site/json-ld";
import { storedText } from "@/lib/stored-texts";

/**
 * Public pages: preview banner, header, footer (build plan §8), and the sitewide Organization
 * JSON-LD (site architecture §7.1, §8.5): one node with the canonical @id, the exact name and the
 * role-and-money statement (ST-1a) as its description. Legal name, address, contact points and
 * sameAs are left out until the owner supplies real ones; nothing is invented.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  const { WEB_URL } = env();
  return (
    <SiteChrome>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": organizationId(WEB_URL),
          name: "American Moving Choice",
          url: `${WEB_URL}/`,
          description: storedText("ST-1a"),
        }}
      />
      {children}
    </SiteChrome>
  );
}
