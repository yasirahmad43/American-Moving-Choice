/** Prepare a source-bound candidate artifact. This command has no publication or provider access. */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { adaptPilotDrafts, type PilotAdaptation } from "./claude-pilot-adapter";

async function boundedJson(path: string, label: string): Promise<unknown> {
  if ((await stat(path)).size > 5_000_000) throw new Error(`${label} exceeds the bounded pilot artifact size`);
  const raw = await readFile(path, "utf8");
  try { return JSON.parse(raw); } catch { throw new Error(`${label} is not valid JSON`); }
}

export async function prepareClaudeCohort(input: { manifestPath: string; draftsPath: string; outputPath: string; selectedBriefIds?: string[] }): Promise<PilotAdaptation> {
  const manifest = await boundedJson(input.manifestPath, "Source manifest");
  const drafts = await boundedJson(input.draftsPath, "Validated drafts");
  const result = adaptPilotDrafts(manifest, drafts, { selectedBriefIds: input.selectedBriefIds });
  await mkdir(dirname(input.outputPath), { recursive: true });
  // Refuse to overwrite an earlier review artifact or publication proof.
  await writeFile(input.outputPath, JSON.stringify(result, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  return result;
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { manifest: { type: "string" }, drafts: { type: "string" }, out: { type: "string" }, only: { type: "string" } }, strict: true });
  if (!values.manifest || !values.drafts || !values.out) throw new Error("Usage: prepare-claude-cohort --manifest <reviewed.json> --drafts <validated-drafts.json> --out <new-candidate.json> [--only brief-id,brief-id]");
  const result = await prepareClaudeCohort({ manifestPath: resolve(values.manifest), draftsPath: resolve(values.drafts), outputPath: resolve(values.out), selectedBriefIds: values.only?.split(",") });
  console.log(`Prepared ${result.entries.length} candidate entries; ${result.held.length} held of ${result.selected}. Source review and explicit catalog import are required before publication.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => {
  console.error(error instanceof Error ? error.message : "Cohort preparation failed"); process.exitCode = 1;
});
