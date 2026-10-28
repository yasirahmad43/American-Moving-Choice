import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Review invitations remain token-gated under /review/; there is no public company review showcase. */
export default function CompanyReviewsPage() {
  permanentRedirect("/get-quotes/");
}
