import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Public profile links use the central quote flow. Company identity is introduced during contact. */
export default function CompanyProfilePage() {
  permanentRedirect("/get-quotes/");
}
