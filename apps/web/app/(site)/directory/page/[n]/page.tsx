import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Preserve old paginated links without rendering company identities or requesting directory data. */
export default function DirectoryPageN() {
  permanentRedirect("/get-quotes/");
}
