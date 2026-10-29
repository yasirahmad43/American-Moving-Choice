import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { PUBLIC_ROLE_STATEMENT } from "../public-copy.ts";

// Frozen before this presentation change: every substantive h2/p/li from the real pages on
// 96aa811, normalized for whitespace. New status copy may be added; existing facts and links
// must remain. Five request-flow blocks were updated for the owner's 2026-10-29 button-submit
// journey; all unrelated facts and links stay frozen. Shared layout/business data are isolated.
const ORIGINAL_PUBLIC_BODY_HASHES = {
  "privacy": [
    "310311a0bafe03b6419bf580d8e810f410b42012dbba1275b19edc52f8ecd8a9",
    "1b6d323cbb0695745e347af4e19db1139d9493bb1432b3924a53036ec91a8777",
    "9a12f71ada5e1b6f6f1d598efe16713265a06fb9581a7e30963cb4f32c624f72",
    "415a7abbe0f6396ed52be582835ddd472f29cac06f4c5592514ef01b4b655902",
    "2493842c7565d6c10228c7c8a577d9ff0f733c345448672c1e91267f2373d09b",
    "db61662f48ad47fe0462a562a5a2e4df07582a426493db77ae6330312bcdbd91",
    "931ec5b4e112009e094b53cc635b9590872a4e44a522ef7fc715c2dade9f5a09",
    "0080f1f7836dfd64fb2d6f7fd6efb09c78ec0ede84eccbb03f5bd33698b154a3",
    "17a0799f4fccfb2393f24c75d32f1143d3613c0f840c9c6f8dfe0f5a09f26e2d",
    "954ce89afdd761372d6c7f922a58163d3d13940342ed0c4db52e5aaef1c2cbf2",
    "438889a45d8839e7417ba13ae713ffc55169d1900f03a9910eea556824f1451d",
    "3976cd8247f622a4ffeec16c78eb38cf2faa2040b88fc2cbb80fc786aa82ba3d",
    "1fac4a9c71cf5ff2774409f54c6944c4d2febd469fa95b7e29ecca6a512a398e",
    "0d5ab89db744ae82faa124f6b35d2d4e6d7c29e62d0f0aaa6f4ba429b2f2e444",
    "71fef78174078e7e5ccd6cf65d0271a808210ce31333bc6f7600902f4f13ef7a",
    "b36cb4ac0aec198caa8975ea03da77d951521d0f30b24aa1c76806e6159bc491"
  ],
  "terms": [
    "b5ba8c3ec342e5b83d7cb662f9a4125e72c029a306f1a87528916bc37c8b47ad",
    "7b27ccbc6a076abf338d49738735c70dc287a0feade5ce20d3bcdcc6ac9b2dca",
    "bbee3b62c367d7d373274aee1d9b2f10114c170e1985e3235122dfff517ee3dc",
    "a30b0d1f3142c284d7aafcfe57044061440890586b99c21b6775d37b099f94a4",
    "c8d61f6857d926c19f1e461c2cfdee168ccd8127db0a64aea9c51ab2a01077da",
    "e762e9f38305dca4dc01e40fc6a7d7b1b822e676118f90fcc44292587ac1c01b",
    "391cb176e2435f3dad6b8e251c3f5c88b05a9112762751ba7587d7602030b0c4",
    "3d085baf3b4c41179e3719a3f2c94beeaa28ca307369856aab4a1f56a86878f6",
    "1b953be56cf46e8ce7d316b3b0a20cc9f5fca5a624481f48d11e0308a64d85d8",
    "a390893286ad00bc50491858debfd1e6512410ab0fdf71a4271c43765da0caf3",
    "d87790fcf1cfab726fdbdc3067b7c52adea2221779687a2529f8ecef82e71d50",
    "054baa7d546e9ee8c1f66e37b85da8da1d7d5859715788fa931daceeb6326221"
  ]
};

function renderPage(name, review = false) {
  const source = readFileSync(new URL(`../../app/(site)/${name}/page.tsx`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  const module = { exports: {} };
  const Link = ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children);
  const mocks = {
    "next/link": { default: Link },
    "@/components/site/page-frame": { PageFrame: ({ h1, lede, children }) => React.createElement("main", null, React.createElement("h1", null, h1), React.createElement("p", { "data-legal-lede": "" }, lede), React.createElement("article", null, children)) },
    "@/components/site/page-meta": { pageMetadata: (url, title, description) => ({ url, title, description }) },
    "@/components/site/review-notes": { Note: ({ children }) => review ? React.createElement("mark", { className: "review-note" }, children) : null },
    "@/components/site/business-details": { BusinessIdentity: () => React.createElement("span", null, "American Moving Choice"), BusinessContactChannels: () => null },
    "@/lib/public-copy": { PUBLIC_ROLE_STATEMENT },
    "@/lib/review-mode": { REVIEW_NOTES_IN_HTML: review },
  };
  runInNewContext(compiled, { React, module, exports: module.exports, require: (id) => { if (!(id in mocks)) throw new Error(`Unreviewed page dependency: ${id}`); return mocks[id]; } });
  const html = renderToStaticMarkup(React.createElement(module.exports.default));
  return { html, body: /<article>([\s\S]*)<\/article>/.exec(html)?.[1] ?? "", metadata: module.exports.metadata };
}

const bodyHashes = (html) => new Set([...html.matchAll(/<(h2|p|li)\b[^>]*>[\s\S]*?<\/\1>/g)]
  .map(match => match[0].replace(/\s+/g, " ").trim())
  .filter(fragment => fragment.replace(/<[^>]*>/g, "").trim())
  .map(fragment => createHash("sha256").update(fragment).digest("hex")));

describe("reader-facing preview legal information", () => {
  // The owner retired the public mover-terms page and the consumer terms' final
  // Moving companies heading/link, and replaced one archived buyer-wording privacy item.
  // All unaffected consumer legal blocks stay frozen; new withdrawal wording is checked below.
  it("describes the current button-submitted call-and-email request", () => {
    const privacy = renderPage("privacy").body;
    const terms = renderPage("terms").body;
    expect(privacy).toContain("when you clicked Send my request");
    expect(terms).toContain("for calls and email about your move");
    expect(`${privacy} ${terms}`).not.toMatch(/contact channels you (?:chose|select)|shown you the number of eligible movers/);
    expect(privacy).toContain("contact details are never stored in your browser");
    expect(terms).toContain('href="/which-companies-receive-my-request/"');
  });
  for (const name of ["privacy", "terms"]) {
    it(`${name} explains the preview and legal-review status without internal instructions or empty paragraphs`, () => {
      const { html, body, metadata } = renderPage(name);
      expect(metadata.description).toMatch(/preview/i);
      expect(metadata.description).toMatch(/awaiting legal review/i);
      expect(html).not.toMatch(/placeholder|counsel writes|counsel drafts|consent draft|compliance facts|site architecture|review-note/i);
      expect(html).toMatch(/awaiting (?:final )?legal review/i);
      expect(body).not.toMatch(/<p>\s*<\/p>/);
      expect(body).toMatch(/^<h2>/);
    });
    it(`${name} retains every prior substantive paragraph, list item, heading and embedded link`, () => {
      const hashes = bodyHashes(renderPage(name).body);
      for (const [index, hash] of ORIGINAL_PUBLIC_BODY_HASHES[name].entries()) expect(hashes.has(hash), `${name}: preserved public body block ${index + 1}`).toBe(true);
    });
    it(`${name} keeps the review notes available in reviewer builds`, () => {
      const { html } = renderPage(name, true);
      expect(html).toContain('class="review-note"');
      expect(html).toMatch(/counsel (?:writes|drafts)|summary follows consent draft/i);
    });
  }

  it("keeps the consumer terms free of links to retired company sales and terms pages", () => {
    expect(renderPage("terms").html).not.toMatch(/href="\/(?:for-movers|mover-terms)(?:\/|")/);
  });

  it("explains withdrawal without buyer wording or promising to erase shared details", () => {
    const html = renderPage("privacy").body;
    expect(html).toContain("This stops additional movers from receiving your contact details");
    expect(html).toContain("It cannot take back details already shared");
    expect(html).not.toMatch(/already bought|buyers|purchas/i);
  });

  it("gives the unfinished privacy and dispute sections an honest status and a working next step", () => {
    const privacy = renderPage("privacy").body;
    const providers = /<h2>Service providers<\/h2>([\s\S]*?)(?=<h2>|$)/.exec(privacy)?.[1] ?? "";
    const retention = /<h2>How long we keep your details<\/h2>([\s\S]*?)(?=<h2>|$)/.exec(privacy)?.[1] ?? "";
    const disputes = /<h2>Acceptable use, liability and disputes<\/h2>([\s\S]*?)(?=<h2>|$)/.exec(renderPage("terms").body)?.[1] ?? "";
    expect(providers).toContain("still under legal review");
    expect(retention).toContain("not yet been finalized in this preview policy");
    expect(disputes).toContain("not finalized in this preview");
    for (const section of [providers, retention, disputes]) expect(section).toContain('href="/report-a-concern/"');
    expect(privacy).toContain("My personal details");
  });
});
