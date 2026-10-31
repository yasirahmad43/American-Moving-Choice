/** Offline export from a read-only public-page snapshot. No database or provider credentials. */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import type { SeoPageRecord } from "../packages/server/src/seo/types";
import { publicSeoPage } from "../apps/web/components/seo/public-content";
import { publicNetworkSummary } from "../apps/web/components/seo/public-network-evidence";
import { seoAssistantFaq } from "../apps/web/lib/assistant-faq/seo";
import { STATIC_ASSISTANT_FAQ_PAGES, staticAssistantFaq } from "../apps/web/lib/assistant-faq/static";
import { hubAssistantFaq, moversIndexAssistantFaq, catalogAssistantFaq } from "../apps/web/lib/assistant-faq/hubs";
import { assistantFaqOutputs, escapeFaqHtml } from "../apps/web/lib/assistant-faq/outputs";
import type { AssistantFaqItem } from "../apps/web/lib/assistant-faq/types";
import { PUBLIC_STATIC_LINKS } from "../apps/web/lib/site";
import { ROUTES_HUB } from "../apps/web/components/seo/routes-hub-spec";
import { QUESTIONS_HUB, PLANNING_HUB } from "../apps/web/components/seo/editorial-hub-specs";

async function main() {
  const { values } = parseArgs({ options: { snapshot: { type: "string" }, out: { type: "string" }, "web-url": { type: "string", default: "https://amc-web-three.vercel.app" }, "validate-only": { type: "boolean", default: false } }, strict: true });
  if (!values.snapshot || !values.out) throw new Error("Use --snapshot <public-pages.json> --out <new-output-directory> [--web-url <origin>]");
  const origin = new URL(values["web-url"]!);
  if (origin.username || origin.password || origin.pathname !== "/" || !/^https?:$/u.test(origin.protocol)) throw new Error("Use a public web origin without credentials");
  const destination = resolve(values.out);
  if (await stat(destination).then(() => true, () => false)) throw new Error("Refusing to overwrite an earlier export");
  await mkdir(join(destination, "html"), { recursive: true });
  await mkdir(join(destination, "jsonld"), { recursive: true });
  const snapshotBytes = await readFile(resolve(values.snapshot));
  const snapshot = JSON.parse(snapshotBytes.toString("utf8"));
  const rawRows: Record<string, unknown>[] = Array.isArray(snapshot) ? snapshot : snapshot.pages;
  if (!Array.isArray(rawRows) || !rawRows.length) throw new Error("Public-page snapshot is empty");
  const decode = (value: unknown) => typeof value === "string" ? JSON.parse(value) : value;
  const records = rawRows.map(raw => publicSeoPage({
    ...raw, url: String(raw.url), slug: String(raw.slug ?? String(raw.url).split("/").filter(Boolean).at(-1)),
    family: raw.family, h1: raw.h1, title: raw.title ?? raw.h1,
    primaryKeyword: raw.primaryKeyword ?? raw.primary_keyword, metaDescription: raw.metaDescription ?? raw.meta_description ?? "",
    stateCode: raw.stateCode ?? raw.state_code ?? null, zip: raw.zip ?? null,
    content: decode(raw.content), sources: decode(raw.sources ?? []), mediaIds: [],
  } as unknown as SeoPageRecord));
  if (new Set(records.map(record => record.url)).size !== records.length) throw new Error("Duplicate source URLs");
  const supported = new Set(["state", "city", "route", "zip", "service", "cost", "question", "planning"]);
  if (records.some(record => !supported.has(record.family) || !/^\/(?:movers|routes|services|moving-costs|questions|planning)\/[a-z0-9/-]+\/$/u.test(record.url))) throw new Error("Snapshot contains a non-public guide identity");
  const exports = new Map<string, { title: string; family: string; items: readonly AssistantFaqItem[] }>();
  const held: { url: string; error: string }[] = [];
  const add = (url: string, title: string, family: string, make: () => readonly AssistantFaqItem[]) => {
    try {
      if (exports.has(url)) throw new Error("duplicate exported URL");
      const items = make(); assistantFaqOutputs(origin.origin, url, items);
      exports.set(url, { title, family, items });
    } catch (error) { held.push({ url, error: error instanceof Error ? error.message : "FAQ source validation failed" }); }
  };
  for (const record of records) add(record.url, record.h1, record.family, () => seoAssistantFaq(record));
  const staticPaths = Array.isArray(STATIC_ASSISTANT_FAQ_PAGES) ? STATIC_ASSISTANT_FAQ_PAGES : Object.keys(STATIC_ASSISTANT_FAQ_PAGES);
  for (const url of staticPaths) add(url, PUBLIC_STATIC_LINKS.find(link => link.href === url)?.label ?? url, "page", () => staticAssistantFaq(url)!);
  const summaries = rawRows.map(record => publicNetworkSummary({ url: String(record.url), h1: String(record.h1), title: String(record.title ?? record.h1), family: String(record.family), stateCode: (record.stateCode ?? record.state_code ?? null) as string | null }));
  // Snapshot SELECT uses ORDER BY url: preserve database collation for exact hub boundaries.
  for (const spec of [ROUTES_HUB, QUESTIONS_HUB, PLANNING_HUB]) {
    const entries = summaries.filter(page => page.family === spec.family).map(page => spec.family === "route" ? { ...page, h1: page.title } : page);
    for (let page = 1; page <= Math.max(1, Math.ceil(entries.length / spec.perPage!)); page++) {
      const url = page === 1 ? spec.url : `${spec.url}page/${page}/`;
      add(url, page === 1 ? spec.h1 : `${spec.h1} (page ${page})`, "hub", () => hubAssistantFaq({ ...spec, title: spec.h1, page, total: entries.length, entries: entries.slice((page - 1) * spec.perPage!, page * spec.perPage!) }));
    }
  }
  const services = summaries.filter(page => page.family === "service");
  add("/services/", "Moving services", "hub", () => hubAssistantFaq({ family: "service", url: "/services/", title: "Moving services", description: "Local, long-distance, interstate, packing, storage and specialty moving guides.", total: services.length, entries: services }));
  add("/movers/", "State moving guides", "hub", () => moversIndexAssistantFaq({ states: summaries.filter(page => page.family === "state") }));
  const staticEntries = [...new Map(PUBLIC_STATIC_LINKS.map(link => [link.href, { url: link.href, title: link.label, family: "page" }])).values()].sort((a,b) => a.title.localeCompare(b.title));
  const catalogByUrl = new Map([...staticEntries, ...summaries].map(page => [page.url, page]));
  const catalog = Array.isArray(snapshot.publicCatalogOrder)
    ? snapshot.publicCatalogOrder.map((url: string) => { const page = catalogByUrl.get(url); if (!page) throw new Error("Public catalog order contains an unknown URL"); return page; })
    : [...staticEntries, ...summaries];
  if (catalog.length !== catalogByUrl.size || new Set(catalog.map((page: { url: string }) => page.url)).size !== catalogByUrl.size) throw new Error("Incomplete public catalog order");
  for (let page = 1; page <= Math.ceil(catalog.length / 60); page++) {
    const url = page === 1 ? "/explore/" : `/explore/?page=${page}`;
    add(url, `All moving guides${page > 1 ? ` (page ${page})` : ""}`, "catalog", () => catalogAssistantFaq({ filters: { query: "", type: "all", page }, total: catalog.length, perPage: 60, entries: catalog.slice((page - 1) * 60, page * 60) }));
  }
  const manifest: { url: string; title: string; family: string; questions: number; html: string; jsonld: string; sha256: string }[] = [];
  let index = 0;
  for (const [url, entry] of exports) {
    const name = String(++index).padStart(5, "0");
    const output = assistantFaqOutputs(origin.origin, url, entry.items);
    const html = `html/${name}.html`, jsonld = `jsonld/${name}.json`;
    if (!values["validate-only"]) {
      await writeFile(join(destination, html), output.html, { flag: "wx" });
      await writeFile(join(destination, jsonld), output.json, { flag: "wx" });
    }
    manifest.push({ url, title: entry.title, family: entry.family, questions: entry.items.length, html, jsonld, sha256: createHash("sha256").update(JSON.stringify(entry.items)).digest("hex") });
  }
  const report = { exportedAt: new Date().toISOString(), webUrl: origin.origin, sourceSnapshotSha256: createHash("sha256").update(snapshotBytes).digest("hex"), sourceGuideCount: records.length, exportedPages: manifest.length, questionCount: manifest.reduce((sum, item) => sum + item.questions, 0), held, scope: "All published public guide records, canonical core pages, and unfiltered hub/catalog pagination. Interactive filter/query combinations use the same helpers live; private/token/retired/redirect-only routes are excluded.", pages: manifest };
  await writeFile(join(destination, "faq-content.json"), JSON.stringify([...exports].map(([url, page]) => ({ url, items: page.items }))) + "\n", { flag: "wx" });
  await writeFile(join(destination, "manifest.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  const rows = manifest.map(page => `<tr><td>${escapeFaqHtml(page.title)}<small>${escapeFaqHtml(page.url)}</small></td><td><a href="${page.html}">HTML</a></td><td><a href="${page.jsonld}">JSON-LD</a></td></tr>`).join("\n");
  await writeFile(join(destination, "index.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>American Moving Choice FAQs</title><style>body{font:16px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:0 20px;color:#102641}table{width:100%;border-collapse:collapse}td{padding:16px;border-bottom:1px solid #dae3ed;overflow-wrap:anywhere}small{display:block;color:#53657a}a{color:#074e94}</style><h1>American Moving Choice: page-specific questions</h1><p>${manifest.length.toLocaleString("en-US")} pages; ${report.questionCount.toLocaleString("en-US")} questions. Each answer is 40–80 words; both outputs use identical text.</p><table><tbody>${rows}</tbody></table></html>`, { flag: "wx" });
  console.log(JSON.stringify({ exportedPages: report.exportedPages, questionCount: report.questionCount, sourceGuides: records.length, held: held.length, report: join(destination, "manifest.json") }));
  if (held.length) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : "FAQ export failed"); process.exitCode = 1; });
