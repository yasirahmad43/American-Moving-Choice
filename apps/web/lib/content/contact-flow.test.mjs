// Public editorial promises must agree with the request flow, not archived directory designs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseFrontMatter } from "./front-matter.ts";
import { renderMarkdown } from "./markdown.ts";
import { createTokenResolver } from "./tokens.ts";

const contentPath = (relative) => fileURLToPath(new URL(`../../../../content/${relative}`, import.meta.url));
const storedSource = readFileSync(contentPath("stored-texts.md"), "utf8");
const stored = new Map([...storedSource.matchAll(/^#{2,3} (ST-\d+[a-z]?)\b[^\n]*\n(?:(?!^#{1,3} )[\s\S])*?^> (.+)$/gm)].map((match) => [match[1], match[2]]));
const tokens = JSON.parse(readFileSync(contentPath("tokens.json"), "utf8"));
const resolveToken = createTokenResolver(tokens, { storedText: (key) => stored.get(key) ?? null });

describe("current public request explanation", () => {
  for (const file of ["which-companies-receive-my-request", "how-amc-makes-money", "how-we-verify-movers", "movers-vs-brokers", "review-methodology", "editorial-policy"]) {
    it(`${file} renders without archived pre-contact identity promises or company links`, () => {
      const parsed = parseFrontMatter(readFileSync(contentPath(`pages/trust/${file}.md`), "utf8"));
      const { html } = renderMarkdown(parsed.content, { resolveToken, mode: "public", linkLabels: { "How AMC makes money": "/advertising-disclosure/", "How we verify movers": "/how-we-verify-movers/" } });
      expect(html).not.toMatch(/\{\{|named on (?:your|the) Review and send screen|by name and USDOT|Preferred Mover/);
      expect(html).not.toMatch(/href="\/(?:companies|directory)\//);
      expect(html).not.toMatch(/review-note|token-pending/);
    });
  }
});
