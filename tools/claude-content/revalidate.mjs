#!/usr/bin/env node
import { mkdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { digest, fail, PilotError, redact } from "./contracts.mjs";
import { atomicJson, loadPlan, readLedger, runDirectory } from "./ledger.mjs";
import { processResults, RESULT_PARSER_VERSION, STATE_ROOT } from "./runner.mjs";

// Deliberately has no network API, credential reader, ledger updater, or publication dependency.
export async function revalidate(root, runId, providerResultsPath, revision) {
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(revision ?? "")) fail("revision", "Use a short lowercase revision ID.");
  const plan = await loadPlan(root, runId), ledger = await readLedger(root);
  const entry = ledger.entries.find(item => item.runId === runId);
  if (!entry?.accounting?.resultHash || entry.planHash !== plan.planHash) fail("revalidation_state", "Revalidation requires an already accounted immutable run.");
  const directory = runDirectory(root, runId);
  const originalResults = JSON.parse(await readFile(join(directory, "results.json"), "utf8"));
  const originalDrafts = JSON.parse(await readFile(join(directory, "validated-drafts.json"), "utf8"));
  const expectedDrafts = originalResults.items.filter(item => item.status === "validated").map(item => ({ briefId: item.briefId, ...item.draft }));
  if (digest(originalResults) !== entry.accounting.resultHash || digest(originalDrafts) !== digest(expectedDrafts)) fail("artifact_changed", "An original cached artifact changed; revalidation cannot replace it.");
  if ((await stat(providerResultsPath)).size > 32 * 1024 * 1024) fail("api_size", "Saved provider results exceed the bounded pilot size.");
  const raw = await readFile(providerResultsPath, "utf8");
  let lines;
  try { lines = raw.trim().startsWith("[") ? JSON.parse(raw) : raw.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line)); }
  catch { fail("api_results", "Saved provider results must be a JSON array or JSONL stream."); }
  const processed = processResults(plan, lines);
  if (processed.knownMicros !== entry.accounting.knownMicros || processed.unknownReservedMicros !== entry.accounting.unknownReservedMicros) fail("revalidation_usage", "Saved result usage differs from the already-accounted provider results.");
  processed.results.revalidation = { revision, parserVersion: RESULT_PARSER_VERSION, originalResultHash: entry.accounting.resultHash, providerFileSha256: createHash("sha256").update(raw).digest("hex"), noApiCallMade: true, ledgerUnchanged: true };
  const output = join(directory, "revalidations", revision);
  await mkdir(join(directory, "revalidations"), { recursive: true });
  try { await mkdir(output); } catch (error) { if (error.code === "EEXIST") fail("revision_exists", "This revalidation revision already exists; never overwrite it."); throw error; }
  await atomicJson(join(output, "results.json"), processed.results);
  await atomicJson(join(output, "validated-drafts.json"), processed.drafts);
  return { runId, revision, parserVersion: RESULT_PARSER_VERSION, totals: processed.results.totals, artifact: join(output, "validated-drafts.json"), requiresEditorialReview: true, noApiCallMade: true, ledgerUnchanged: true };
}
export async function main(argv = process.argv.slice(2)) {
  const values = {};
  if (argv.length !== 6) fail("arguments", "Use --run <id> --provider-results <saved JSONL path> --revision <new id>.");
  for (let i = 0; i < argv.length; i += 2) {
    if (!["--run", "--provider-results", "--revision"].includes(argv[i]) || argv[i] in values || !argv[i + 1]) fail("arguments", "Unknown or duplicate revalidation argument.");
    values[argv[i]] = argv[i + 1];
  }
  if (Object.keys(values).length !== 3) fail("arguments", "Missing revalidation arguments.");
  return revalidate(STATE_ROOT, values["--run"], resolve(values["--provider-results"]), values["--revision"]);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(redact({ ok: true, ...await main() }))); }
  catch (error) { console.error(JSON.stringify({ ok: false, code: error instanceof PilotError ? error.code : "unexpected_error", message: error instanceof PilotError ? error.message : "Offline revalidation failed without printing provider content." })); process.exitCode = 1; }
}
