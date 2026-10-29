import { readFileSync } from "node:fs";
import { PUBLIC_REQUEST_ASSURANCE, PUBLIC_ROLE_STATEMENT, publicMarketingHtml, publicMarketingText } from "./public-copy.ts";
import { parseFrontMatter } from "./content/front-matter.ts";
import { renderMarkdown } from "./content/markdown.ts";
import { createTokenResolver } from "./content/tokens.ts";

describe("consumer marketing presentation", () => {
  it("describes the current call-and-email request without a channel-picker promise", () => {
    expect(PUBLIC_ROLE_STATEMENT).toContain("calls and email");
    expect(PUBLIC_REQUEST_ASSURANCE).toContain("how many companies");
    expect(`${PUBLIC_ROLE_STATEMENT} ${PUBLIC_REQUEST_ASSURANCE}`).not.toMatch(/channels they|how you'd like to hear/);
    const historical = "You choose the maximum number of movers who may contact you and the contact channels they may use.";
    const current = publicMarketingText(historical);
    expect(current).toContain("calls and email");
    expect(publicMarketingText(current)).toBe(current);
    expect(publicMarketingHtml(`<pre><code>${historical}</code></pre>`)).toBe(`<pre><code>${historical}</code></pre>`);
  });
  it("keeps non-funding prose and HTML byte-for-byte, including code and price whitespace", () => {
    const text = "A crew costs $180   per hour.\n\tA deposit is paid to your mover.";
    const html = '<p class="price">$180   per hour\n\tfor 3 movers.</p>\n<pre><code>line 1\n  line 2\n\tMovers pay us for requests.</code></pre>\n<table><tr><td>$1,200–$1,800</td></tr></table>';
    expect(publicMarketingText(text)).toBe(text);
    expect(publicMarketingHtml(html)).toBe(html);
  });

  it("removes the actual AMC funding variants while retaining roles, choices and moving prices", () => {
    const source = "We are not a moving company or a broker, and movers pay us for requests. Your mover may charge $180 per hour. You pay us nothing.";
    const result = publicMarketingText(source);
    expect(result).not.toMatch(/pay us|broker,|paid by|income/i);
    expect(result).toContain("We are not a moving company or a broker.");
    expect(result).toContain("Your mover may charge $180 per hour.");
    expect(result).toContain("Requesting quotes is free.");
  });

  it("changes only affected prose nodes and preserves nearby price tables and code", () => {
    const rate = '<p class="rate">Movers charge <strong>$180</strong>   per hour.</p>\n<table>\n<tr><td>2br</td><td>$1,200–$1,800</td></tr>\n</table>';
    const literal = '<pre><code>keep  these\n  exact bytes: Movers pay us for requests.</code></pre>';
    const income = '<p>No. Our income comes from movers, who pay us for the requests they buy (<a href="/advertising-disclosure/">How AMC makes money</a> has the details). What movers spend with us never goes into the cost model.</p>';
    const html = publicMarketingHtml(`${income}\n${rate}\n${literal}`);
    expect(html).not.toMatch(/Our income|has the details|href="\/advertising-disclosure/);
    expect(html).toContain(rate);
    expect(html).toContain(literal);
    expect(html).toContain("eligible rate cards");
  });

  it("keeps the factual companion link when a retired funding link shared its paragraph", () => {
    const companion = '<a href="/which-companies-receive-my-request/">Which companies receive my request</a> explains who may receive your request.';
    const html = publicMarketingHtml(`<p><a href="/advertising-disclosure/">How AMC makes money</a> explains how we're paid, and ${companion}</p>`);
    expect(html).not.toMatch(/advertising-disclosure|makes money|how we're paid/);
    expect(html).toContain(companion);
    expect(html).not.toContain("<p>,");
  });

  it("removes funding-only related entries without leaving a dangling explanation", () => {
    const retained = '<li><a href="/moving-costs/">Moving costs</a>: cost factors and planning assumptions.</li>';
    const html = publicMarketingHtml(`<ul><li><a href="/advertising-disclosure/">How AMC makes money</a>: who pays us, and what payment never changes.</li>${retained}</ul>`);
    expect(html).toBe(`<ul>${retained}</ul>`);
  });

  it("presents archived request-sales wording as contact choices without changing moving purchases", () => {
    const source = "Choose 1 and only one mover can receive your details from us; choose more and up to that many can. Only eligible movers recorded for your request may buy it, within your chosen limit and contact permissions. Company names aren't shown before contact. We never resell your request beyond that limit, and every mover in our network agrees not to resell it.";
    const result = publicMarketingText(source);
    expect(result).not.toMatch(/\bbuy\b|resell|purchas/i);
    expect(result).toContain("Choose 1 and only one mover can receive your details from us");
    expect(result).toContain("within your chosen limit and contact permissions");
    expect(result).toContain("Company names aren't shown before contact");
    expect(result).toContain("each mover agrees to keep it within its own company");
    expect(publicMarketingText("Movers agree not to resell your request or hand your move to another company.")).toBe("Movers agree to keep your request within their own company and not hand your move to another company.");
    const movingPurchase = "You may buy packing boxes or purchase separate insurance. The mover charges $180 per hour.";
    expect(publicMarketingText(movingPurchase)).toBe(movingPurchase);
    expect(publicMarketingText(result)).toBe(result);
  });

  it("renders the actual served trust/cost documents without AMC payer promotion", () => {
    const content = (file) => readFileSync(new URL(`../../../content/${file}`, import.meta.url), "utf8");
    const stored = new Map([...content("stored-texts.md").matchAll(/^#{2,3} (ST-\d+[a-z]?)\b[^\n]*\n(?:(?!^#{1,3} )[\s\S])*?^> (.+)$/gm)].map((match) => [match[1], match[2]]));
    const resolveToken = createTokenResolver(JSON.parse(content("tokens.json")), { storedText: (key) => stored.get(key) ?? null });
    const documents = ["trust/editorial-policy", "trust/how-we-verify-movers", "trust/movers-vs-brokers", "trust/which-companies-receive-my-request", "trust/review-methodology", "costs/calculator-method", "costs/how-movers-charge", "costs/moving-costs"];
    for (const document of documents) {
      const parsed = parseFrontMatter(content(`pages/${document}.md`));
      const rendered = renderMarkdown(parsed.content, { resolveToken, mode: "public", linkLabels: { "How AMC makes money": "/advertising-disclosure/", "How we verify movers": "/how-we-verify-movers/" } });
      const html = publicMarketingHtml(rendered.html);
      expect(html, document).not.toMatch(/our income|pay us|paid by movers|makes money|financial relationship|who pays us|has the details\)/i);
      expect(html, document).not.toMatch(/(?:buy|bought|purchas\w*) (?:your |the |new |eligible )?requests?|\bbuyers\b|before buying|request purchases|resell/i);
      expect(html, document).not.toMatch(/href="\/(?:for-movers|mover-terms)(?:\/|")/);
    }
  });
});
