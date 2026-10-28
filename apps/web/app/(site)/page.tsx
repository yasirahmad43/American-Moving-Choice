import { Alert, Container, LinkButton } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { GET_QUOTES, MONEY_LINK } from "@/lib/site";
import { storedText, storedTextParts } from "@/lib/stored-texts";

export const metadata: Metadata = {
  title: { absolute: "American Moving Choice" },
  description: storedText("ST-1c"),
};

/** Placeholder home page for the preview shell. The public-shell slice (S1) replaces it. */
export default function HomePage() {
  const moneyLine = storedTextParts("ST-1b");
  return (
    <Container className="grid gap-8 section-pad">
      <div className="grid max-w-[60ch] gap-4">
        <p className="type-overline text-text-2">Moving carriers only · No brokers</p>
        <h1 className="type-display-xl text-text">Request quotes from moving companies in our network</h1>
        <p className="type-lede text-text-2">
          American Moving Choice works only with moving carriers: companies with household-goods carrier authority and no
          broker authority on their FMCSA record. You choose how many movers can contact you.
        </p>
        <p className="type-small text-text-2">
          {moneyLine.map((part, index) =>
            part.kind === "text" ? (
              <span key={index}>{part.text}</span>
            ) : (
              <Link key={index} href={MONEY_LINK.href} className="link">
                {part.label}
              </Link>
            ),
          )}
        </p>
        <div>
          <LinkButton href={GET_QUOTES.href} variant="cta">
            Start a quote request
          </LinkButton>
        </div>
      </div>
      <Alert tone="info" title="Placeholder page">
        This home page is a placeholder in the preview build. The quote survey, cost pages and mover directory arrive as
        they are built.
      </Alert>
    </Container>
  );
}
