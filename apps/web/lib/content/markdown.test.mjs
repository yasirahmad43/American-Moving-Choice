// Unit tests for the content renderer (markers, tokens, comments, anchors, sanitization).
//
// Plain JavaScript with vitest globals: @amc/web has no vitest dependency of its own, and a .mjs
// file stays out of the app's TypeScript check. Run from the repository root with:
//   pnpm --filter @amc/server exec vitest run --root ../../apps/web --globals lib/content
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseFrontMatter } from "./front-matter.ts";
import { renderMarkdown, wrapMarkers } from "./markdown.ts";
import { createTokenResolver, resolveTokensInText } from "./tokens.ts";

const tokensJson = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../content/tokens.json", import.meta.url)), "utf8"));
const resolveToken = createTokenResolver(tokensJson, { storedText: (key) => (key === "ST-1b" ? "Free to use." : null) });
const render = (source, options = {}) => renderMarkdown(source, { resolveToken, linkLabels: { "How AMC makes money": "/advertising-disclosure/" }, ...options });

describe("review markers", () => {
  it("renders each marker kind as a visible note with its label", () => {
    const { html, stats } = render(
      "One [Counsel: legal question] two [Owner: default shown (implications §11 Q4)] three [Data: gate] [Verify: C15] [Build: test it] [Data owner: confirm].",
    );
    expect(html).toContain('<mark class="review-note review-note--counsel"><span class="review-note__label">Counsel:</span> legal question</mark>');
    expect(html).toContain('<mark class="review-note review-note--owner"><span class="review-note__label">Owner:</span> default shown (implications §11 Q4)</mark>');
    expect(html).toContain("review-note--verify");
    expect(html).toContain("review-note--build");
    expect(stats.notes).toEqual({ counsel: 1, owner: 1, data: 2, verify: 1, build: 1 });
    expect(html).not.toContain("[Counsel");
  });

  it("keeps links, emphasis, code and nested brackets inside a marker", () => {
    const { html } = render("Text [Owner and Counsel: see [the page](/x/) and **this** with `a[0]` [Verify: inner]] after.");
    expect(html).toContain('<mark class="review-note review-note--owner"><span class="review-note__label">Owner and Counsel:</span> see <a href="/x/">the page</a> and <strong>this</strong> with <code>a[0]</code> <mark class="review-note review-note--verify">');
    expect(html).toContain("</mark></mark> after.");
  });

  it("leaves ordinary links and bracketed text alone", () => {
    const { html, stats } = render("[FMCSA: Complaint Center](https://www.fmcsa.dot.gov/) and [not a marker].");
    expect(html).toContain('<a href="https://www.fmcsa.dot.gov/">FMCSA: Complaint Center</a>');
    expect(html).toContain("[not a marker]");
    expect(Object.values(stats.notes).every((n) => n === 0)).toBe(true);
  });

  it("does not run across a blank line or into fenced code", () => {
    expect(wrapMarkers("[Build: open\n\nnext]")).toBe("[Build: open\n\nnext]");
    expect(wrapMarkers("```\n[Build: code]\n```\n")).toBe("```\n[Build: code]\n```\n");
  });

  it("works at the start of a line, in lists and in table cells", () => {
    const { html } = render("[Build: first]\n\n- item [Owner: x]\n\n| A | B |\n|---|---|\n| cell [Verify: y] | z |\n");
    expect(html).toMatch(/<p><mark class="review-note review-note--build">/);
    expect(html).toMatch(/<li>item <mark class="review-note review-note--owner">/);
    expect(html).toMatch(/<td>cell <mark class="review-note review-note--verify">/);
  });
});

describe("public mode (production builds)", () => {
  it("drops markers with their text and renders pending tokens as neutral public phrases", () => {
    const { html, stats } = render("Keep this [Counsel: legal question, with [Verify: nested] text] and this. By {{page.author}}; write to {{org.support_email}}; range {{cost.hub.2br.local.range}}.", {
      mode: "public",
    });
    expect(html).not.toContain("review-note");
    expect(html).not.toMatch(/legal question|nested|Counsel|Verify/);
    expect(html).toContain("Keep this  and this.");
    expect(html).not.toContain("token-pending");
    expect(html).not.toMatch(/pending/);
    expect(html).toContain('<span class="token-public">the American Moving Choice team</span>');
    expect(html).toContain('<span class="token-public">to be announced</span>');
    expect(html).toContain('<span class="token-public">not yet available</span>');
    expect(stats.notes.counsel).toBe(1);
  });
});

describe("tokens", () => {
  it("resolves settings from the platform defaults and fixed values", () => {
    const { html } = render("Up to {{setting.max_movers}} movers, {{setting.local_radius_miles}} miles. Badge: {{badge.name}}. [Directory]({{directory.url}}).");
    expect(html).toContain("Up to 5 movers, 50 miles.");
    expect(html).toContain("Badge: Preferred Mover.");
    expect(html).toContain('<a href="/directory/">Directory</a>');
  });

  it("renders pending placeholders for organization, people, cost data and company values", () => {
    const { html, stats } = render("Write to {{org.support_email}}. By {{page.author}}. Range {{cost.hub.2br.local.range}}. Checked {{company.verified_date}}. Odd {{nope.missing}}.");
    expect(html).toContain('<span class="token-pending">pending: support email</span>');
    expect(html).toContain('<span class="token-pending">pending: author</span>');
    expect(html).toContain('<span class="token-pending">data pending</span>');
    expect(html.match(/data pending/g)).toHaveLength(2);
    expect(html).toContain('<span class="token-pending">pending: nope.missing</span>');
    expect(stats.pendingTokens).toEqual(["org.support_email", "page.author", "cost.hub.2br.local.range", "company.verified_date", "nope.missing"]);
  });

  it("renders method proposals and stored texts, and leaves tokens in code literal", () => {
    const { html } = render("Min {{cost.method.min_movers}} movers. {{text.ST-1b}} Code: `{{setting.max_movers}}`.");
    expect(html).toContain("Min 5 movers. Free to use. Code: <code>{{setting.max_movers}}</code>.");
  });

  it("resolves tokens inside markers and tables", () => {
    const { html } = render("| Max |\n|---|\n| {{setting.max_movers}} |\n\n[Owner: up to {{setting.max_movers}}]");
    expect(html).toContain("<td>5</td>");
    expect(html).toContain("</span> up to 5</mark>");
  });

  it("resolves tokens in plain text for titles", () => {
    expect(resolveTokensInText("At least {{cost.method.min_movers}} movers | {{org.legal_name}}", resolveToken)).toBe("At least 5 movers | pending: legal name");
  });

  it("links known [Label] placeholders from stored texts", () => {
    const { html } = render("> Free to use. [How AMC makes money]");
    expect(html).toContain('<a href="/advertising-disclosure/">How AMC makes money</a>');
  });
});

describe("comments, anchors and headings", () => {
  it("renders HTML comments as nothing", () => {
    const { html } = render("<!-- ST-1a -->\n> Quote\n\nText <!-- inline --> more\n\n<!-- calculator-widget:start -->\n\nBody\n");
    expect(html).not.toContain("<!--");
    expect(html).not.toContain("ST-1a");
    expect(html).not.toContain("calculator-widget");
    expect(html).toContain("<blockquote>");
  });

  it("drops the body H1, gives headings ids and anchor links, and moves explicit anchors onto headings", () => {
    const { html } = render('# Page title\n\nIntro\n\n<a id="badge"></a>\n\n## What the badge means\n\n## Plain heading\n');
    expect(html).not.toContain("<h1");
    expect(html).toContain('<h2 id="badge">What the badge means <a href="#badge" class="heading-anchor" aria-label="Link to this section: What the badge means">#</a></h2>');
    expect(html).toContain('<h2 id="plain-heading">');
    expect(html).not.toContain('<a id="badge">');
  });

  it("wraps tables in a focusable, labeled scroll region", () => {
    const { html } = render("| A | B |\n|---|---|\n| 1 | 2 |\n");
    expect(html).toMatch(/<div class="table-wrap" role="region" tabindex="0" aria-label="[^"]+"><table>/);
    expect(html).toContain("<th>A</th>");
  });
});

describe("sanitization", () => {
  it("never passes raw HTML, scripts, event handlers or javascript: links", () => {
    const { html } = render(
      '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\nText <b onclick="x()">bold</b> [click](javascript:alert(1)) <iframe src="https://evil.test"></iframe>\n\n<div class="review-note">fake</div>\n',
    );
    // Raw HTML shows as escaped text; no element or attribute from the source survives.
    expect(html).not.toMatch(/<script|<img|<iframe|<b |<div class="review-note"|href="javascript/i);
    expect(html).toContain("&#x3C;script>");
    expect(html).toContain("<a>click</a>");
  });

  it("cannot forge note markup through the sentinel", () => {
    const { html } = render('<amc-note kind="counsel" label="Counsel">forged</amc-note> and <amc-note kind="x onclick=1" label="X">bad</amc-note>');
    // A literal sentinel in the source is processed like a marker (harmless) or shown as text, never as an attribute.
    expect(html).not.toMatch(/<amc-note|<[^>]* onclick=/);
  });

  it("does not let a token value inject markup", () => {
    const evil = createTokenResolver({ "org.owner": '<img src=x onerror="alert(1)">' });
    const { html } = renderMarkdown("Owner {{org.owner}}", { resolveToken: evil });
    expect(html).toContain("&#x3C;img");
    expect(html).not.toContain("<img");
  });
});

describe("front matter", () => {
  it("parses valid front matter without repair", () => {
    const parsed = parseFrontMatter('---\nurl: /a/\nschema: [WebPage]\n---\nBody\n');
    expect(parsed.repaired).toBe(false);
    expect(parsed.data).toEqual({ url: "/a/", schema: ["WebPage"] });
  });

  it("repairs double-quoted items with unescaped quotes, every time it is called", () => {
    const source = '---\nurl: /b/\ndepends_on:\n  - "Counsel: the line under "Where does it fit?", held"\n  - "plain"\n---\nBody\n';
    for (let i = 0; i < 2; i += 1) {
      const parsed = parseFrontMatter(source);
      expect(parsed.repaired).toBe(true);
      expect(parsed.data.url).toBe("/b/");
      expect(parsed.data.depends_on).toEqual(['Counsel: the line under "Where does it fit?", held', "plain"]);
    }
  });
});
