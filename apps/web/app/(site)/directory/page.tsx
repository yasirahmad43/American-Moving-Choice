import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Legacy directory links now start the route-based quote flow; there is no public mover showcase. */
export default function DirectoryPage() {
  permanentRedirect("/get-quotes/");
}
