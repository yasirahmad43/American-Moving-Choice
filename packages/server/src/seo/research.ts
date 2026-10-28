/**
 * `pnpm seo:import-research <csv>`: ingests a research CSV into seo_research. Recognized shapes
 * (by header) are the research agent's files in docs/research/:
 *   keyword-inventory.csv, competitor-gaps.csv, mover-leads-b2b.csv (kind = keyword)
 *   question-library.csv (kind = question)
 * and docs/seo/keyword-to-page-map.csv. Rows whose status says "hypothesis" keep volume null:
 * nothing is invented for unmeasured keywords.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Queryable } from "../db/pool";
import { STATES } from "../geo/states";
import { normalizeKeyword, slugify, type SeoFamily } from "./slugs";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  const header = (rows.shift() ?? []).map((h) => h.trim().replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const INTENTS = new Set(["informational", "commercial", "transactional", "navigational"]);

function intentOf(raw: string): string | null {
  const first = raw.toLowerCase().split(/[+/,]/)[0]?.trim() ?? "";
  if (INTENTS.has(first)) return first;
  if (first.startsWith("unknown")) return "unknown";
  return null;
}

/** The page family a research row points at, or null when it names something outside this system. */
export function familyOf(raw: string): SeoFamily | null {
  const f = raw.toLowerCase();
  if (!f) return null;
  if (f.includes("zip")) return "zip";
  if (f.includes("route")) return "route";
  if (f.includes("city")) return "city";
  if (f.includes("state")) return "state";
  if (f.includes("cost")) return "cost";
  if (f.includes("question") || f.includes("faq") || f.includes("complaint") || f.includes("trust") || f.includes("guide")) return "question";
  if (f.includes("planning") || f.includes("checklist") || f.includes("moving-to")) return "planning";
  if (f.includes("service") || f.includes("pillar") || f.includes("quote landing")) return "service";
  if (f.includes("profile")) return "mover-profile";
  return null;
}

const number = (raw: string): number | null => {
  const n = Number(raw.replace(/[,$]/g, ""));
  return raw.trim() === "" || !Number.isFinite(n) ? null : n;
};

const date = (raw: string): string | null => (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null);

export interface ResearchRowInput {
  kind: "keyword" | "question";
  keyword: string;
  intent: string | null;
  geography: string | null;
  family: SeoFamily | null;
  targetUrl: string | null;
  volume: number | null;
  difficulty: number | null;
  cpcCents: number | null;
  source: string;
  researchedOn: string | null;
  priority: string | null;
  notes: string | null;
}

/** Normalizes one CSV row from any of the recognized shapes. */
export function researchRow(row: Record<string, string>): ResearchRowInput | null {
  const isQuestion = "question_paraphrased" in row;
  const keyword = (isQuestion ? row.question_paraphrased : row.keyword) ?? "";
  if (!keyword.trim()) return null;
  const status = (row.status ?? "").toLowerCase();
  const hypothesis = status.includes("hypothesis");
  const volume = hypothesis ? null : number(row.volume ?? row.volume_us ?? "");
  const kd = hypothesis ? null : number(row.kd ?? "");
  const cpc = hypothesis ? null : number(row.cpc ?? "");
  const familyRaw = row.page_family ?? row.assigned_page_family ?? row.proposed_amc_page_family ?? row.proposed_amc_page ?? "";
  const geography = row.geo_id || row.geo_type || row.geography || row.location_or_service || null;
  return {
    kind: isQuestion ? "question" : "keyword",
    keyword: keyword.trim(),
    intent: intentOf(row.intent ?? ""),
    geography,
    family: familyOf(familyRaw),
    targetUrl: row.mapped_url || row.url || null,
    volume: volume === null ? null : Math.round(volume),
    difficulty: kd === null ? null : Math.max(0, Math.min(100, Math.round(kd))),
    cpcCents: cpc === null ? null : Math.round(cpc * 100),
    source: row.source || "unknown",
    researchedOn: date(row.research_date ?? ""),
    priority: row.priority || row.reachable || (hypothesis ? "hypothesis" : null),
    notes: [row.notes, row.cluster ? `cluster: ${row.cluster}` : "", row.audience ? `audience: ${row.audience}` : "", row.supporting_reference_url ? `reference: ${row.supporting_reference_url}` : "", hypothesis ? "status: hypothesis (no volume measured)" : ""]
      .filter(Boolean)
      .join(" | ") || null,
  };
}

export async function importResearch(db: Queryable, csvPath: string, log: (line: string) => void = () => undefined): Promise<{ read: number; imported: number; skipped: number }> {
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const file = basename(csvPath);
  let imported = 0;
  let skipped = 0;
  for (const raw of rows) {
    const row = researchRow(raw);
    if (!row) {
      skipped++;
      continue;
    }
    await db.query(
      `insert into seo_research (kind, keyword, keyword_normalized, intent, geography, family, target_url, volume, difficulty, cpc_cents, market, source, source_file, researched_on, priority, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'us', $11, $12, $13, $14, $15)
       on conflict (keyword_normalized, market, source_file) do update set intent = excluded.intent, geography = excluded.geography, family = excluded.family,
         target_url = excluded.target_url, volume = excluded.volume, difficulty = excluded.difficulty, cpc_cents = excluded.cpc_cents, source = excluded.source,
         researched_on = excluded.researched_on, priority = excluded.priority, notes = excluded.notes, imported_at = now()`,
      [
        row.kind,
        row.keyword,
        normalizeKeyword(row.keyword),
        row.intent === "unknown" ? "unknown" : row.intent,
        row.geography,
        row.family,
        row.targetUrl,
        row.volume,
        row.difficulty,
        row.cpcCents,
        row.source,
        file,
        row.researchedOn,
        row.priority,
        row.notes,
      ],
    );
    imported++;
  }
  log(`${file}: ${imported} rows imported, ${skipped} skipped`);
  return { read: rows.length, imported, skipped };
}

// ------------------------------------------------------------------ lookups used by the generator

export interface ResearchKeyword {
  keyword: string;
  intent: string | null;
  volume: number | null;
  difficulty: number | null;
  source: string;
  researchedOn: string | null;
  hypothesis: boolean;
}

const toKeyword = (r: { keyword: string; intent: string | null; volume: number | null; difficulty: number | null; source: string; researched_on: string | null; priority: string | null }): ResearchKeyword => ({
  keyword: r.keyword,
  intent: r.intent,
  volume: r.volume,
  difficulty: r.difficulty,
  source: r.source,
  researchedOn: r.researched_on,
  hypothesis: r.volume === null || (r.priority ?? "").includes("hypothesis"),
});

type Row = { keyword: string; intent: string | null; volume: number | null; difficulty: number | null; source: string; researched_on: string | null; priority: string | null; geography: string | null; target_url: string | null; notes: string | null };

/** Every imported keyword row, loaded once per generation run. */
export async function loadResearch(db: Queryable): Promise<Row[]> {
  const result = await db.query<Row>(
    "select keyword, intent, volume, difficulty, source, researched_on, priority, geography, target_url, notes from seo_research where kind = 'keyword' order by volume desc nulls last, keyword",
  );
  return result.rows;
}

const stateByCode = new Map<string, (typeof STATES)[number]>(STATES.map((s) => [s.code, s]));

/** Keywords measured for a state ("TX", "texas", "/movers/texas/"). */
export function researchForState(rows: Row[], code: string): ResearchKeyword[] {
  const state = stateByCode.get(code);
  if (!state) return [];
  const name = state.name.toLowerCase();
  return rows
    .filter((r) => {
      const geo = (r.geography ?? "").toLowerCase();
      const url = r.target_url ?? "";
      const isCity = (r.notes ?? "").includes("cluster: city") || /\(.*\)/.test(geo);
      return !isCity && (geo === code.toLowerCase() || geo === name || url === `/movers/${state.slug}/` || (url.startsWith(`/movers/${state.slug}/`) && url.split("/").length === 4));
    })
    .map(toKeyword);
}

/** Keywords measured for a city ("atlanta (GA)" or a mapped /movers/{state}/{city}/ URL). */
export function researchForCity(rows: Row[], stateSlug: string, stateCode: string, citySlug: string): ResearchKeyword[] {
  const url = `/movers/${stateSlug}/${citySlug}/`;
  return rows
    .filter((r) => {
      const geo = (r.geography ?? "").toLowerCase();
      return r.target_url === url || geo === `${citySlug.replace(/-/g, " ")} (${stateCode.toLowerCase()})` || slugify(geo.replace(/\(.*\)/, "")) === citySlug && geo.includes(`(${stateCode.toLowerCase()})`);
    })
    .map(toKeyword);
}

/** Keywords measured for a directional state route ("NY->FL" or /moving-routes|routes/{a}-to-{b}/). */
export function researchForStateRoute(rows: Row[], originCode: string, destCode: string, slug: string): ResearchKeyword[] {
  return rows
    .filter((r) => {
      const geo = (r.geography ?? "").toUpperCase().replace(/\s+/g, "");
      const url = r.target_url ?? "";
      return geo === `${originCode}->${destCode}` || url.endsWith(`/${slug}/`);
    })
    .map(toKeyword);
}

/** Keywords measured for a city route ("los angeles->dallas"). */
export function researchForCityRoute(rows: Row[], originSlug: string, destSlug: string): ResearchKeyword[] {
  const key = `${originSlug.replace(/-/g, " ")}->${destSlug.replace(/-/g, " ")}`;
  return rows.filter((r) => (r.geography ?? "").toLowerCase().replace(/\s*->\s*/, "->") === key).map(toKeyword);
}

/** Keywords mapped to a URL (service, cost and editorial pages). */
export function researchForUrl(rows: Row[], url: string): ResearchKeyword[] {
  return rows.filter((r) => r.target_url === url).map(toKeyword);
}

/** State demand (sum of measured volume on state-level rows), for batch ordering. */
export function stateDemand(rows: Row[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of STATES) out.set(s.code, researchForState(rows, s.code).reduce((sum, k) => sum + (k.volume ?? 0), 0));
  return out;
}
