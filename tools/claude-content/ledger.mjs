import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { CAP_MICRO_USD, MODEL, INPUT_MICRO_USD_PER_TOKEN, OUTPUT_MICRO_USD_PER_TOKEN, buildPlan, verifyPlan, fail, usd } from "./contracts.mjs";

export async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(value, null, 2) + "\n"); await file.sync(); }
    finally { await file.close(); }
    await rename(temporary, path);
    // Flush the directory rename on systems that expose directory fsync. Windows flushes the file before its NTFS rename.
    if (process.platform !== "win32") {
      const directory = await open(dirname(path), "r");
      try { await directory.sync(); } finally { await directory.close(); }
    }
  }
  finally { await rm(temporary, { force: true }).catch(() => undefined); }
}
async function optionalJson(path) { try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; } }
export const runDirectory = (root, runId) => {
  if (typeof runId !== "string" || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(runId)) fail("run_id", "Invalid run ID.");
  return join(root, "runs", runId);
};
export async function withLock(root, task, { attempts = 100, delayMs = 50 } = {}) {
  await mkdir(root, { recursive: true });
  const path = join(root, "ledger.lock");
  let lock;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { lock = await open(path, "wx", 0o600); break; }
    catch (error) { if (error.code !== "EEXIST") throw error; await new Promise(resolve => setTimeout(resolve, delayMs)); }
  }
  if (!lock) fail("ledger_locked", "The pilot ledger is locked. No call was made; inspect the owning process before manual recovery.");
  try { await lock.writeFile(JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })); return await task(); }
  finally { await lock.close(); await rm(path, { force: true }); }
}

const initialLedger = () => ({ schemaVersion: 1, capMicroUsd: CAP_MICRO_USD, model: MODEL, rates: { inputMicroUsdPerToken: INPUT_MICRO_USD_PER_TOKEN, outputMicroUsdPerToken: OUTPUT_MICRO_USD_PER_TOKEN }, frozen: false, entries: [] });
export const commitment = entry => entry.accounting?.committedMicros ?? entry.reserveMicros;
export const totalCommitment = ledger => ledger.entries.reduce((sum, entry) => sum + commitment(entry), 0);
export async function readLedger(root) {
  const ledger = await optionalJson(join(root, "ledger.json")) ?? initialLedger();
  if (ledger.schemaVersion !== 1 || ledger.capMicroUsd !== CAP_MICRO_USD || ledger.model !== MODEL || ledger.rates?.inputMicroUsdPerToken !== INPUT_MICRO_USD_PER_TOKEN || ledger.rates?.outputMicroUsdPerToken !== OUTPUT_MICRO_USD_PER_TOKEN || !Array.isArray(ledger.entries)) fail("ledger_invalid", "The pilot ledger configuration changed; no requests may be sent.");
  const ids = new Set();
  for (const entry of ledger.entries) {
    if (!entry || typeof entry.runId !== "string" || ids.has(entry.runId) || !Number.isSafeInteger(entry.reserveMicros) || entry.reserveMicros < 0 || !Number.isSafeInteger(commitment(entry)) || commitment(entry) < 0) fail("ledger_invalid", "Invalid ledger reservation.");
    ids.add(entry.runId);
  }
  if (!ledger.frozen && totalCommitment(ledger) > CAP_MICRO_USD) fail("ledger_invalid", "The recorded budget exceeds the approved cap.");
  return ledger;
}
export async function loadPlan(root, runId) {
  const plan = await optionalJson(join(runDirectory(root, runId), "plan.json"));
  if (!plan) fail("plan_missing", "Run plan first; no request was sent.");
  return verifyPlan(plan);
}
export async function prepare(root, manifest, runId, limit) {
  const plan = buildPlan(manifest, runId, limit);
  return withLock(root, async () => {
    const directory = runDirectory(root, runId);
    await mkdir(directory, { recursive: true });
    const previous = await optionalJson(join(directory, "plan.json"));
    if (previous && verifyPlan(previous).planHash !== plan.planHash) fail("run_exists", "A different immutable plan already owns this run ID.");
    if (!previous) {
      await atomicJson(join(directory, "plan.json"), plan);
      await atomicJson(join(directory, "requests.json"), { requests: plan.requests.map(request => ({ custom_id: request.customId, params: request.params })) });
    }
    const ledger = await readLedger(root);
    return { runId, status: "planned", planHash: plan.planHash, selectedBriefIds: plan.selectedBriefIds, requestCount: plan.requests.length, heldCount: plan.heldBriefIds.length, deferredCount: plan.deferredBriefIds.length, reserveUsd: usd(plan.reserveMicros), remainingLedgerUsd: usd(CAP_MICRO_USD - totalCommitment(ledger)), capUsd: 50, standardRateReservation: true, noApiCallMade: true };
  });
}

export async function claim(root, runId) {
  return withLock(root, async () => {
    const plan = await loadPlan(root, runId), ledger = await readLedger(root);
    const previous = ledger.entries.find(entry => entry.runId === runId);
    if (previous) {
      if (previous.planHash !== plan.planHash) fail("ledger_plan_mismatch", "The reserved plan differs from the current plan.");
      if (previous.batchId) return { plan, entry: previous, reused: true };
      fail("submission_unresolved", "An earlier submission outcome is unresolved. Its reservation is retained; never submit it again automatically.");
    }
    if (ledger.frozen) fail("budget_frozen", "The pilot ledger is frozen; no new paid calls may be made.");
    if (totalCommitment(ledger) + plan.reserveMicros > CAP_MICRO_USD) fail("budget", "This run would exceed the shared $50 cap; no paid call was made.");
    const entry = { runId, planHash: plan.planHash, reserveMicros: plan.reserveMicros, requestCount: plan.requests.length, status: "submitting", createdAt: new Date().toISOString(), batchId: null };
    ledger.entries.push(entry);
    // This single durable record reserves funds and marks the submission in flight BEFORE POST.
    await atomicJson(join(root, "ledger.json"), ledger);
    return { plan, entry, reused: false };
  });
}
export async function updateEntry(root, runId, updater) {
  return withLock(root, async () => {
    const ledger = await readLedger(root), entry = ledger.entries.find(item => item.runId === runId);
    if (!entry) fail("reservation_missing", "The run has no reserved budget.");
    await updater(entry, ledger);
    entry.updatedAt = new Date().toISOString();
    await atomicJson(join(root, "ledger.json"), ledger);
    return entry;
  });
}
export async function entryFor(root, runId) {
  const plan = await loadPlan(root, runId), ledger = await readLedger(root);
  let entry = ledger.entries.find(item => item.runId === runId);
  if (!entry || entry.planHash !== plan.planHash) fail("reservation_missing", "The run has not reserved its budget.");
  if (!entry.batchId) {
    const recovered = await optionalJson(join(runDirectory(root, runId), "submission.json"));
    if (!recovered || recovered.planHash !== plan.planHash || !/^msgbatch_[A-Za-z0-9_-]{1,120}$/.test(recovered.batchId)) fail("submission_unresolved", "No confirmed batch ID is recorded. Keep the reservation and reconcile manually; do not resubmit.");
    entry = await updateEntry(root, runId, item => { item.batchId = recovered.batchId; item.status = "submitted"; });
  }
  return { plan, entry };
}
function setAccounting(entry, ledger, { knownMicros, unknownReservedMicros, resultHash }) {
    if (![knownMicros, unknownReservedMicros].every(value => Number.isSafeInteger(value) && value >= 0)) fail("usage_invalid", "Invalid accounting totals.");
    const committedMicros = knownMicros + unknownReservedMicros;
    entry.accounting = { knownMicros, unknownReservedMicros, committedMicros, standardRatesUsed: true, resultHash };
    entry.status = committedMicros > entry.reserveMicros ? "budget_exception" : "results_saved";
    if (committedMicros > entry.reserveMicros || totalCommitment(ledger) > CAP_MICRO_USD) ledger.frozen = true;
}
export async function settle(root, runId, accounting) {
  return updateEntry(root, runId, (entry, ledger) => setAccounting(entry, ledger, accounting));
}
export async function saveResults(root, runId, processed, resultHash) {
  return withLock(root, async () => {
    const ledger = await readLedger(root), entry = ledger.entries.find(item => item.runId === runId);
    if (!entry || entry.planHash !== processed.results.planHash) fail("reservation_missing", "Result identity differs from its reserved run.");
    // Concurrent downloads may finish together. Only the first writer owns the immutable result snapshot.
    if (entry.accounting?.resultHash) return entry;
    const directory = runDirectory(root, runId);
    await atomicJson(join(directory, "results.json"), processed.results);
    await atomicJson(join(directory, "validated-drafts.json"), processed.drafts);
    setAccounting(entry, ledger, { knownMicros: processed.knownMicros, unknownReservedMicros: processed.unknownReservedMicros, resultHash });
    entry.updatedAt = new Date().toISOString();
    await atomicJson(join(root, "ledger.json"), ledger);
    return entry;
  });
}
