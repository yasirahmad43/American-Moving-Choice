"use client";

import { LinkButton } from "@amc/ui";
import { usePathname } from "next/navigation";
import { GET_QUOTES } from "@/lib/site";

/**
 * The header "Get quotes" button is CTA red only where no quote survey is in the first viewport;
 * on the home page and inside the survey it is secondary (VD §5.3, §13.1).
 */
export function HeaderCta() {
  const pathname = usePathname() ?? "/";
  const surveyInView = pathname === "/" || pathname.startsWith(GET_QUOTES.href.replace(/\/$/, ""));
  return (
    <LinkButton href={GET_QUOTES.href} variant={surveyInView ? "secondary" : "cta"} size="sm" className="whitespace-nowrap">
      {GET_QUOTES.label}
    </LinkButton>
  );
}
