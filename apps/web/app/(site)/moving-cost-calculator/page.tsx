import { Alert, Breadcrumbs, Container } from "@amc/ui";
import type { Metadata } from "next";
import { Calculator } from "@/components/calculator/calculator";
import { calculatorPageContent, renderTokens } from "@/components/calculator/content";
import { COPY, MOVING_COSTS } from "@/components/calculator/copy";
import { storedText, storedTextParts } from "@/lib/stored-texts";

export function generateMetadata(): Metadata {
  const page = calculatorPageContent();
  // The front-matter title has no site suffix (site architecture §8.2 template, 55 characters).
  // Results render client-side after a POST and never get their own URL, so they can't be indexed.
  return { title: { absolute: page.title }, description: page.metaDescription };
}

/** Styles for the drafted copy rendered from Markdown (headings, lists, links and review notes). */
const proseClasses =
  "grid gap-4 text-text [&_h2]:mt-6 [&_h2]:type-h3 [&_h2]:text-text [&_p]:max-w-[68ch] [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1 [&_ul]:pl-6 " +
  "[&_a]:link [&_.review-note]:mt-1 [&_.review-note]:block [&_.review-note]:rounded-control [&_.review-note]:border-l-4 " +
  "[&_.review-note]:border-l-warning [&_.review-note]:bg-warning-bg [&_.review-note]:px-3 [&_.review-note]:py-2 [&_.review-note]:type-small";

/**
 * /moving-cost-calculator/ (build plan §7.3; site architecture §1.2). The H1 and intro render on
 * the server from the drafted copy; the calculator is a client island whose results stay off the
 * URL. The method page (/moving-cost-calculator/method/) is rendered from content by the site shell.
 */
export default function MovingCostCalculatorPage() {
  const page = calculatorPageContent();
  const tokenCopy = {
    "form.services.storage.help": renderTokens("Storage for {{cost.method.storage_assumption}}."),
    "form.services.specialty_items.help": renderTokens("Covers {{cost.method.specialty_items}}."),
    "state.no_data.body": renderTokens(
      "A range needs rate cards from at least {{cost.method.min_movers}} different movers for a move like this in this area, and we have fewer. A range resting on too few movers could mislead you, so we don't show one.",
    ),
    "state.stale.body": renderTokens(
      "Rate cards stop counting once they're more than {{cost.method.max_data_age_months}} months old, and too few recent ones cover this move. There's no range until enough movers send newer ones.",
    ),
  };
  return (
    <Container className="grid gap-8 section-pad">
      <div className="grid gap-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Moving cost calculator" }]} />
        <Alert tone="warning" role="none" title={`Draft (${page.status}): not reviewed`}>
          This page and its calculator copy await owner and counsel review. Review notes on the page mark open decisions.
        </Alert>
        <h1 className="type-display-l text-text">{page.h1}</h1>
        <div className={proseClasses} dangerouslySetInnerHTML={{ __html: page.introHtml }} />
      </div>

      <noscript>
        <p className="text-text">
          The calculator needs JavaScript. You can turn it on in your browser, or read{" "}
          <a href={MOVING_COSTS} className="link">
            Moving costs
          </a>{" "}
          to see what affects the price of a move.
        </p>
      </noscript>

      <section aria-label={COPY["form.name"]} className="max-w-[48rem]">
        <Calculator tokenCopy={tokenCopy} st7={storedText("ST-7")} st6={storedText("ST-6")} st1b={storedTextParts("ST-1b")} />
      </section>

      <div className={proseClasses} dangerouslySetInnerHTML={{ __html: page.outroHtml }} />
    </Container>
  );
}
