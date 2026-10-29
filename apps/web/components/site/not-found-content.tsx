import { Container, LinkButton } from "@amc/ui";
import Link from "next/link";

/** The surrounding route layout owns site chrome; render the recovery content once. */
export function NotFoundContent() {
  return <Container size="reading" className="grid gap-5 section-pad">
    <p className="type-overline text-text-2">Error 404</p>
    <h1 className="type-display-l text-text">We can't find that page</h1>
    <p className="type-lede text-text-2">The address may have changed, or this page is no longer available.</p>
    <div className="flex flex-wrap gap-3">
      <LinkButton href="/" variant="primary">Go to the home page</LinkButton>
      <Link href="/contact/" className="link inline-flex min-h-12 items-center">Contact us</Link>
    </div>
  </Container>;
}
