#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MODEL, MAX_OUTPUT_TOKENS, INPUT_MICRO_USD_PER_TOKEN, OUTPUT_MICRO_USD_PER_TOKEN, PilotError, fail, digest, usd, redact, parseModelJson, validateDraft } from "./contracts.mjs";
import { atomicJson, prepare, claim, updateEntry, entryFor, saveResults, runDirectory } from "./ledger.mjs";
import { credentials, createBatch, getBatch, resultLines } from "./api.mjs";

export { prepare };
export const STATE_ROOT = fileURLToPath(new URL("../../work/claude-pilot/runner/", import.meta.url));
const safeCode = error => error instanceof PilotError ? error.code : "unexpected_error";
const summary = entry => ({ runId: entry.runId, status: entry.status, batchId: entry.batchId, reservedUsd: usd(entry.reserveMicros), ...(entry.accounting ? { accountedUsd: usd(entry.accounting.committedMicros) } : {}) });
export const RESULT_PARSER_VERSION = "text-with-opaque-thinking-v2";

export function extractMessageText(message) {
  if (message?.model !== MODEL || message.role !== "assistant" || message.stop_reason !== "end_turn" || !Array.isArray(message.content) || !message.content.length) fail("message_shape", "The response was incomplete or used an unexpected format.");
  const texts = [];
  for (const block of message.content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) fail("message_shape", "The response contains an unsupported content block.");
    if (block.type === "text" && typeof block.text === "string") texts.push(block.text);
    // These opaque provider blocks are never read, copied, logged or included in draft artifacts.
    else if (block.type !== "thinking" && block.type !== "redacted_thinking") fail("message_shape", "The response contains an unsupported content block.");
  }
  if (!texts.length || !texts.some(value => value.trim())) fail("message_shape", "The response contains no completed text answer.");
  return texts.join("\n");
}

export async function submit(root, runId, options = {}) {
  credentials(options.env); // A missing key must not consume an otherwise unused reservation.
  const reserved = await claim(root, runId);
  if (reserved.reused) return { ...summary(reserved.entry), replay: true, noApiCallMade: true };
  let batch;
  try { batch = await createBatch(reserved.plan.requests, options); }
  catch (error) {
    await updateEntry(root, runId, entry => { entry.status = error.code === "api_http" ? "submission_rejected" : "submission_unknown"; entry.lastErrorCode = safeCode(error); });
    throw new PilotError("submission_unresolved", "The batch submission has no confirmed accepted ID. Its full budget is retained; this run cannot auto-submit again.", { providerCode: safeCode(error), ...(error.details?.status ? { status: error.details.status } : {}) });
  }
  // Write recovery information before updating the ledger; a crash can never justify another POST.
  await atomicJson(join(runDirectory(root, runId), "submission.json"), { schemaVersion: 1, runId, planHash: reserved.plan.planHash, batchId: batch.id, confirmedAt: new Date().toISOString() });
  const entry = await updateEntry(root, runId, item => { item.status = "submitted"; item.batchId = batch.id; item.processingStatus = batch.processingStatus; item.requestCounts = batch.requestCounts; });
  return { ...summary(entry), requestCount: reserved.plan.requests.length, processingStatus: batch.processingStatus };
}

export async function poll(root, runId, options = {}) {
  const { plan, entry } = await entryFor(root, runId);
  const batch = await getBatch(entry.batchId, options);
  if (Object.values(batch.requestCounts).reduce((sum, count) => sum + count, 0) !== plan.requests.length) fail("api_counts", "Provider counts differ from the immutable batch plan.");
  const updated = await updateEntry(root, runId, item => { item.processingStatus = batch.processingStatus; item.requestCounts = batch.requestCounts; if (item.status !== "results_saved" && item.status !== "budget_exception") item.status = batch.processingStatus === "ended" ? "ended" : "processing"; });
  return { ...summary(updated), processingStatus: batch.processingStatus, requestCounts: batch.requestCounts };
}

function usageCost(message) {
  const usage = message?.usage;
  if (!usage || ![usage.input_tokens, usage.output_tokens].every(value => Number.isSafeInteger(value) && value >= 0)) return null;
  const creation = usage.cache_creation_input_tokens ?? 0, read = usage.cache_read_input_tokens ?? 0;
  if (![creation, read].every(value => Number.isSafeInteger(value) && value >= 0)) return null;
  // Caching is never requested. If the provider reports it, conservatively price any writes above standard input rates.
  const micros = usage.input_tokens * INPUT_MICRO_USD_PER_TOKEN + creation * 3 + read * INPUT_MICRO_USD_PER_TOKEN + usage.output_tokens * OUTPUT_MICRO_USD_PER_TOKEN;
  if (!Number.isSafeInteger(micros)) return null;
  return { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, cacheCreationTokens: creation, cacheReadTokens: read, micros };
}
export function processResults(plan, lines) {
  if (!Array.isArray(lines)) fail("api_results", "Expected a result list.");
  const expected = new Map(plan.requests.map(request => [request.customId, request])), observed = new Map();
  for (const line of lines) {
    if (!line || !expected.has(line.custom_id) || observed.has(line.custom_id)) fail("api_results", "The result batch contains unknown or duplicate request IDs.");
    observed.set(line.custom_id, line);
  }
  const items = [], drafts = [];
  let knownMicros = 0, unknownReservedMicros = 0;
  for (const request of plan.requests) {
    const line = observed.get(request.customId), result = line?.result;
    const item = { briefId: request.briefId, customId: request.customId, status: "held", reasons: [], usage: null };
    const usage = result?.type === "succeeded" ? usageCost(result.message) : null;
    if (usage) { knownMicros += usage.micros; item.usage = usage; }
    else unknownReservedMicros += request.reserveMicros;
    if (!line) item.reasons.push("missing_provider_result");
    else if (result?.type !== "succeeded") { item.status = "errored"; item.reasons.push(["errored", "canceled", "expired"].includes(result?.type) ? `provider_${result.type}` : "provider_result_shape"); }
    else {
      try {
        const message = result.message;
        if (!usage) fail("usage_missing", "Usage was not reported; budget remains reserved.");
        const text = extractMessageText(message);
        if (usage.outputTokens > MAX_OUTPUT_TOKENS || usage.inputTokens + usage.cacheCreationTokens + usage.cacheReadTokens > request.inputUpperBoundTokens || usage.micros > request.reserveMicros) fail("usage_bound", "Reported usage exceeded the conservative request bound.");
        const draft = parseModelJson(text);
        const brief = plan.manifest.briefs.find(brief => brief.id === request.briefId);
        const validated = validateDraft(draft, brief, plan.manifest);
        item.status = "validated"; item.draft = validated.draft; item.words = validated.words;
        drafts.push({ briefId: request.briefId, ...validated.draft });
      } catch (error) { item.reasons.push(safeCode(error)); }
    }
    items.push(item);
  }
  const results = { schemaVersion: 1, parserVersion: RESULT_PARSER_VERSION, runId: plan.runId, planHash: plan.planHash, model: MODEL, generatedAt: new Date().toISOString(), requiresEditorialReview: true, selectedBriefIds: plan.selectedBriefIds, items, totals: { planned: plan.requests.length, validated: drafts.length, held: items.filter(item => item.status === "held").length, errored: items.filter(item => item.status === "errored").length, knownStandardRateUsd: usd(knownMicros), unresolvedReservedUsd: usd(unknownReservedMicros), accountedUsd: usd(knownMicros + unknownReservedMicros) } };
  return { results, drafts, knownMicros, unknownReservedMicros };
}

export async function results(root, runId, options = {}) {
  const { plan, entry } = await entryFor(root, runId);
  const directory = runDirectory(root, runId);
  if (entry.accounting?.resultHash) {
    const cached = JSON.parse(await readFile(join(directory, "results.json"), "utf8"));
    const drafts = JSON.parse(await readFile(join(directory, "validated-drafts.json"), "utf8"));
    const expectedDrafts = cached.items.filter(item => item.status === "validated").map(item => ({ briefId: item.briefId, ...item.draft }));
    if (digest(cached) !== entry.accounting.resultHash || cached.planHash !== plan.planHash || !Array.isArray(drafts) || digest(drafts) !== digest(expectedDrafts)) fail("artifact_changed", "A completed artifact changed; review the run without re-submitting.");
    return { ...summary(entry), totals: cached.totals, replay: true, artifact: join(directory, "validated-drafts.json"), noApiCallMade: true };
  }
  const batch = await getBatch(entry.batchId, options);
  if (batch.processingStatus !== "ended") fail("batch_pending", "The batch has not ended. Poll it later; no new paid call was made.");
  if (Object.values(batch.requestCounts).reduce((sum, count) => sum + count, 0) !== plan.requests.length) fail("api_counts", "Provider counts differ from the immutable plan.");
  const processed = processResults(plan, await resultLines(entry.batchId, options));
  const updated = await saveResults(root, runId, processed, digest(processed.results));
  return { ...summary(updated), totals: processed.results.totals, artifact: join(directory, "validated-drafts.json"), requiresEditorialReview: true };
}

function argumentsFor(argv) {
  const [command, ...args] = argv;
  if (!["plan", "submit", "poll", "results"].includes(command) || args.length % 2) fail("arguments", "Use plan --manifest <path> --run <id> [--limit <1..100>], or submit|poll|results --run <id>.");
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!["--manifest", "--run", "--limit"].includes(key) || key in values || !args[i + 1]) fail("arguments", "Unknown, duplicate or missing command arguments.");
    values[key] = args[i + 1];
  }
  if (!values["--run"] || (command === "plan" ? !values["--manifest"] : Boolean(values["--manifest"] || values["--limit"]))) fail("arguments", "Each run needs an ID; only plan accepts manifest and limit.");
  return { command, runId: values["--run"], manifest: values["--manifest"], limit: values["--limit"] === undefined ? undefined : Number(values["--limit"]) };
}
export async function main(argv = process.argv.slice(2)) {
  const args = argumentsFor(argv);
  if (args.command === "plan") {
    const manifest = JSON.parse(await readFile(resolve(args.manifest), "utf8"));
    return prepare(STATE_ROOT, manifest, args.runId, args.limit);
  }
  return ({ submit, poll, results })[args.command](STATE_ROOT, args.runId);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(redact({ ok: true, ...await main() }))); }
  catch (error) { console.error(JSON.stringify({ ok: false, code: safeCode(error), message: error instanceof PilotError ? error.message : "The command failed without printing private provider data.", ...(error instanceof PilotError ? { details: redact(error.details) } : {}) })); process.exitCode = 1; }
}
