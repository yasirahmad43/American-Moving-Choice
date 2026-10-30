/** Model output is data, never publication authority. Source facts are injected from the reviewed brief. */
import { createHash } from "node:crypto";
import { z } from "zod";
import { CATALOG, type CatalogEntry } from "./catalog";
import { normalizeKeyword } from "./slugs";
import type { ContentBlock, SourceRef } from "./types";

const short = (max: number) => z.string().trim().min(1).max(max);
const sourceSchema = z.object({ id: short(100), label: short(240), url: z.url(), accessedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const claimSchema = z.object({ id: short(100), sourceId: short(100), text: short(3000) });
const briefSchema = z.object({
  id: short(100), family: z.enum(["question", "planning"]), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  primaryKeyword: short(180), intent: z.enum(["informational", "commercial", "transactional"]),
  supportingKeywords: z.array(short(180)).max(8), related: z.array(short(300)).max(12),
  relatedExistingUrls: z.array(short(300)).max(12), factTopics: z.array(short(100)).max(8),
  sourceIds: z.array(short(100)).min(1).max(12), sourceClaimIds: z.array(short(100)).min(1).max(12), readiness: short(100),
});
const manifestSchema = z.object({ version: z.literal(1), sources: z.array(sourceSchema).min(1).max(100), claims: z.array(claimSchema).min(1).max(200), briefs: z.array(briefSchema).min(1).max(100) });
const prose = short(12000);
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: prose }).strict(),
  z.object({ type: z.literal("note"), text: prose }).strict(),
  z.object({ type: z.literal("list"), items: z.array(short(2000)).min(1).max(20), ordered: z.boolean().optional() }).strict(),
  z.object({ type: z.literal("table"), caption: short(500).optional(), columns: z.array(short(200)).min(2).max(5), rows: z.array(z.array(short(2000)).min(2).max(5)).min(1).max(20) }).strict(),
]);
const draftSchema = z.object({
  briefId: short(100), family: z.enum(["question", "planning"]), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(10).max(120), h1: z.string().trim().min(8).max(140), metaDescription: z.string().trim().min(40).max(320),
  answer: short(1800), sections: z.array(z.object({ heading: short(160), blocks: z.array(blockSchema).min(1).max(10) }).strict()).min(3).max(10),
  faq: z.array(z.object({ question: short(240), answer: short(2000) }).strict()).min(1).max(6), sourceClaimIds: z.array(short(100)).min(1).max(12),
}).strict();

export interface PilotEntryAudit {
  briefId: string; url: string; manifestSha256: string; draftSha256: string; sourceClaimIds: string[]; sourceIds: string[];
  modelWords: number; answerWords: number;
}
export interface PilotAdaptation {
  entries: CatalogEntry[]; audit: PilotEntryAudit[]; held: { briefId: string; url: string | null; reasons: string[] }[];
  selected: number; manifestSha256: string; publicationAuthorized: false;
}
export interface PilotAdaptOptions { selectedBriefIds?: string[]; knownCatalog?: readonly CatalogEntry[] }

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}
export const pilotSha256 = (value: unknown): string => createHash("sha256").update(canonicalJson(value)).digest("hex");
export const pilotEntryUrl = (entry: Pick<CatalogEntry, "family" | "slug">): string => `/${entry.family === "question" ? "questions" : entry.family === "planning" ? "planning" : "services"}/${entry.slug}/`;
const words = (value: string) => (value.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
const badText = /<\/?[a-z][^>]*>|(?:javascript|data):|sk-ant-|sb_secret_|github_pat_|-----BEGIN|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e\u2066-\u2069]/i;
const precisePrice = /(?:\$\s*\d|\bUSD\s*\d|\d(?:[\d,.]*\d)?\s*%|\bUSDOT\s*#?\s*\d)/i;
const staticLinks = new Set(["/get-quotes/", "/moving-cost-calculator/", "/which-companies-receive-my-request/"]);

function duplicates(items: readonly string[], label: string): void {
  if (new Set(items).size !== items.length) throw new Error(`claude-pilot: duplicate ${label}`);
}
function sourceRef(source: z.infer<typeof sourceSchema>): SourceRef {
  const parsed = new URL(source.url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hostname === "localhost" || /^\d/.test(parsed.hostname)) throw new Error("claude-pilot: source must be a public HTTPS reference");
  if (Number.isNaN(Date.parse(source.accessedOn)) || new Date(source.accessedOn).toISOString().slice(0, 10) !== source.accessedOn) throw new Error("claude-pilot: invalid source access date");
  return { label: source.label, url: source.url, accessedOn: source.accessedOn };
}
function modelText(draft: z.infer<typeof draftSchema>): string[] {
  return [draft.title, draft.h1, draft.metaDescription, draft.answer, ...draft.faq.flatMap(item => [item.question, item.answer]), ...draft.sections.flatMap(section => [section.heading, ...section.blocks.flatMap(block => block.type === "list" ? block.items : block.type === "table" ? [block.caption ?? "", ...block.columns, ...block.rows.flat()] : [block.text])])];
}
function relatedRef(url: string, catalog: readonly CatalogEntry[]): string {
  const found = catalog.find(entry => pilotEntryUrl(entry) === url);
  if (found) return `${found.family}:${found.slug}`;
  if (url === "/movers/") return "movers:index";
  if (url === "/moving-costs/local/") return "cost:local";
  if (url === "/moving-costs/long-distance/") return "cost:long-distance";
  throw new Error("claude-pilot: related URL is not in the reviewed catalog");
}

/** The manifest is researcher-reviewed input; never populate it from a model response. */
export function adaptPilotDrafts(manifestInput: unknown, draftsInput: unknown, options: PilotAdaptOptions = {}): PilotAdaptation {
  const manifest = manifestSchema.parse(manifestInput);
  const known = options.knownCatalog ?? CATALOG;
  const manifestSha256 = pilotSha256(manifestInput);
  duplicates(manifest.sources.map(item => item.id), "source ID");
  duplicates(manifest.claims.map(item => item.id), "claim ID");
  duplicates(manifest.briefs.map(item => item.id), "brief ID");
  duplicates(manifest.briefs.map(pilotEntryUrl), "brief URL");
  const sources = new Map(manifest.sources.map(source => [source.id, sourceRef(source)]));
  const claims = new Map(manifest.claims.map(claim => [claim.id, claim]));
  for (const claim of claims.values()) if (!sources.has(claim.sourceId)) throw new Error("claude-pilot: claim references an unknown source");
  const selectedIds = options.selectedBriefIds ?? manifest.briefs.filter(brief => brief.readiness === "draft_ready").map(brief => brief.id);
  if (!selectedIds.length || selectedIds.length > 100) throw new Error("claude-pilot: select between one and 100 briefs");
  duplicates(selectedIds, "selected brief ID");
  const briefById = new Map(manifest.briefs.map(brief => [brief.id, brief]));
  if (selectedIds.some(id => !briefById.has(id))) throw new Error("claude-pilot: unknown selected brief");
  if (!Array.isArray(draftsInput) || draftsInput.length > 100) throw new Error("claude-pilot: drafts must be a bounded array");
  const drafts = new Map<string, unknown>();
  for (const raw of draftsInput) {
    const id = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>).briefId : null;
    if (typeof id !== "string" || !selectedIds.includes(id) || drafts.has(id)) throw new Error("claude-pilot: unknown, duplicate or unselected draft ID");
    drafts.set(id, raw);
  }
  const result: PilotAdaptation = { entries: [], audit: [], held: [], selected: selectedIds.length, manifestSha256, publicationAuthorized: false };
  const intentKeys = new Set<string>();
  for (const id of selectedIds) {
    const brief = briefById.get(id)!;
    const url = pilotEntryUrl(brief);
    try {
      if (brief.readiness !== "draft_ready") throw new Error("brief is held for additional source research");
      const draft = draftSchema.parse(drafts.get(id));
      if (draft.family !== brief.family || draft.slug !== brief.slug) throw new Error("draft changed its fixed identity");
      if (known.some(entry => pilotEntryUrl(entry) === url)) throw new Error("URL already belongs to the source catalog");
      duplicates(draft.sourceClaimIds, "used claim ID");
      if (draft.sourceClaimIds.some(claimId => !brief.sourceClaimIds.includes(claimId) || !claims.has(claimId))) throw new Error("draft uses an unapproved claim");
      if (brief.sourceIds.some(sourceId => !sources.has(sourceId)) || brief.sourceClaimIds.some(claimId => !claims.has(claimId) || !brief.sourceIds.includes(claims.get(claimId)!.sourceId))) throw new Error("brief claim/source binding is invalid");
      if (brief.factTopics.length) throw new Error("pilot facts must come from explicit reviewed claims, not implicit fact topics");
      const related = brief.related.map(href => relatedRef(href, known));
      const allowed = new Set([...staticLinks, ...brief.relatedExistingUrls, ...brief.related, ...brief.sourceIds.map(sourceId => sources.get(sourceId)!.url)]);
      for (const href of [...brief.relatedExistingUrls, ...brief.related]) if (!staticLinks.has(href)) relatedRef(href, known);
      const texts = modelText(draft);
      for (const text of texts) {
        if (badText.test(text) || /!\[[^\]]*\]\(/.test(text)) throw new Error("draft contains unsafe markup or a credential pattern");
        if (precisePrice.test(text)) throw new Error("draft contains unsupported pricing, percentage or company-ID precision");
        for (const link of text.matchAll(/\]\(([^)]*)\)/g)) if (!allowed.has(link[1]!)) throw new Error("draft links outside the brief's reviewed URL allowlist");
        for (const link of text.matchAll(/https?:\/\/[^\s)"<>\\]+/g)) if (!allowed.has(link[0].replace(/[.,;]+$/, ""))) throw new Error("draft contains an external URL outside the reviewed source allowlist");
      }
      for (const section of draft.sections) for (const block of section.blocks) if (block.type === "table" && block.rows.some(row => row.length !== block.columns.length)) throw new Error("table rows do not match their column headings");
      const answerWords = words(draft.answer);
      const modelWords = words([draft.answer, ...draft.sections.flatMap(section => [section.heading, ...section.blocks.flatMap(block => block.type === "list" ? block.items : block.type === "table" ? [block.caption ?? "", ...block.columns, ...block.rows.flat()] : [block.text])]), ...draft.faq.flatMap(item => [item.question, item.answer])].join(" "));
      if (answerWords < 40 || answerWords > 80 || modelWords < 600 || modelWords > 1800) throw new Error("draft does not meet the 40–80 word answer and 600–1800 word article bounds");
      const intentKey = `${normalizeKeyword(brief.primaryKeyword)}|${brief.intent}`;
      if (intentKeys.has(intentKey) || known.some(entry => `${normalizeKeyword(entry.primaryKeyword)}|${entry.intent}` === intentKey)) throw new Error("primary keyword and intent already belong to another article");
      intentKeys.add(intentKey);
      const usedClaims = draft.sourceClaimIds.map(claimId => claims.get(claimId)!);
      const usedSourceIds = [...new Set(usedClaims.map(claim => claim.sourceId))];
      const evidence: ContentBlock = { type: "facts", items: usedClaims.map(claim => ({ claim: claim.text, source: { ...sources.get(claim.sourceId)! } })) };
      result.entries.push({ family: brief.family, slug: brief.slug, primaryKeyword: brief.primaryKeyword, intent: brief.intent, supportingKeywords: [...brief.supportingKeywords], title: draft.title, h1: draft.h1, metaDescription: draft.metaDescription, answer: draft.answer,
        sections: [...draft.sections, { heading: "Sourced reference points", blocks: [evidence] }], factTopics: [...brief.factTopics], sources: usedSourceIds.map(sourceId => ({ ...sources.get(sourceId)! })), faq: draft.faq, related });
      result.audit.push({ briefId: id, url, manifestSha256, draftSha256: pilotSha256(drafts.get(id)), sourceClaimIds: [...draft.sourceClaimIds], sourceIds: usedSourceIds, modelWords, answerWords });
    } catch (error) {
      const reasons = error instanceof z.ZodError ? error.issues.map(issue => `${issue.path.join(".") || "draft"}: ${issue.message}`) : [error instanceof Error ? error.message : "draft validation failed"];
      result.held.push({ briefId: id, url, reasons });
    }
  }
  return result;
}
