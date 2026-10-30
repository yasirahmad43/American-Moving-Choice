import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MODEL, MAX_OUTPUT_TOKENS, CAP_MICRO_USD, buildPlan, verifyPlan, validateDraft, parseModelJson, redact, digest } from "./contracts.mjs";
import { prepare, claim, loadPlan, readLedger, totalCommitment, atomicJson, withLock, settle, runDirectory } from "./ledger.mjs";
import { submit, poll, results, processResults, extractMessageText } from "./runner.mjs";
import { revalidate } from "./revalidate.mjs";
import { apiFetch } from "./api.mjs";

const env = { ANTHROPIC_API_KEY: "test-key-with-no-real-credential", ANTHROPIC_WORKSPACE_ID: "wrkspc_testworkspace" };
const manifest = () => ({ version: 1, sources: [{ id: "fmcsa", label: "FMCSA moving guidance", url: "https://www.fmcsa.dot.gov/protect-your-move", accessedOn: "2026-10-30" }], claims: [{ id: "verify-registration", sourceId: "fmcsa", text: "Check a moving company's registration before making a decision." }], briefs: [{ id: "packing-pilot", family: "question", slug: "what-to-pack-first", title: "What should I pack first for a move?", primaryKeyword: "what to pack first", readerGoal: "Decide which household items to pack before moving day.", claimBoundary: "Use the approved registration guidance only; practical advice is editorial.", outline: ["Choose low-use items", "Keep daily essentials", "Review your plan"], sourceIds: ["fmcsa"], sourceClaimIds: ["verify-registration"], relatedExistingUrls: ["/get-quotes/"], related: ["planning:moving-day-checklist"], readiness: "draft_ready" }] });
const words = count => Array.from({ length: count }, (_, index) => ["Keep", "your", "packing", "plan", "clear", "and", "review", "each", "room", "beforehand"][index % 10]).join(" ");
const draft = () => ({ family: "question", slug: "what-to-pack-first", title: "What should I pack first for a household move?", h1: "Choose what to pack first", metaDescription: "Build a practical packing order, keep essential items accessible and use a room checklist to prepare for your household move.", answer: words(50), sections: ["Choose less-used items", "Keep essentials close", "Review each room"].map(heading => ({ heading, blocks: [{ type: "paragraph", text: words(200) }] })), faq: [{ question: "How can I keep track of boxes?", answer: "Write a short label and keep a room list you can update." }, { question: "What should stay accessible?", answer: "Keep the items you expect to use before and after the move in a separate bag." }], sourceClaimIds: ["verify-registration"] });
const batch = (status = "in_progress") => ({ id: "msgbatch_test123", processing_status: status, request_counts: { processing: status === "ended" ? 0 : 1, succeeded: status === "ended" ? 1 : 0, errored: 0, canceled: 0, expired: 0 } });
const providerLine = plan => ({ custom_id: plan.requests[0].customId, result: { type: "succeeded", message: { role: "assistant", model: MODEL, stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(draft()) }], usage: { input_tokens: 1700, output_tokens: 1600 } } } });
async function state(t) { const root = await mkdtemp(join(tmpdir(), "amc-pilot-test-")); t.after(() => rm(root, { recursive: true, force: true })); return root; }

test("input reservations bound UTF8 bytes plus overhead, full output, and immutable requests", () => {
  const input = manifest(); input.briefs[0].readerGoal += " 日本語 café 📦";
  const plan = buildPlan(input, "unicode", 1), request = plan.requests[0];
  assert.ok(request.inputUpperBoundTokens > Buffer.byteLength(request.params.system + request.params.messages[0].content, "utf8"));
  assert.equal(request.reserveMicros, request.inputUpperBoundTokens * 2 + 6000 * 10);
  assert.equal(request.params.max_tokens, MAX_OUTPUT_TOKENS);
  assert.equal(request.params.model, MODEL);
  assert.equal("tools" in request.params, false);
  assert.deepEqual(verifyPlan(JSON.parse(JSON.stringify(plan))), plan);
  const changed = structuredClone(plan); changed.requests[0].reserveMicros = 1;
  assert.throws(() => verifyPlan(changed), { code: "plan_tampered" });
});

test("draft schema rejects unsupported sources, URLs, identities and markup", () => {
  const input = manifest(), brief = input.briefs[0];
  assert.equal(validateDraft(draft(), brief, input).requiresEditorialReview, true);
  for (const [mutate, code] of [
    [value => { value.sourceClaimIds = ["invented-claim"]; }, "draft_sources"],
    [value => { value.sections[0].blocks[0].text += " https://attacker.invalid/source"; }, "draft_link"],
    [value => { value.sections[0].blocks[0].text += " [bad](javascript:alert)"; }, "draft_link"],
    [value => { value.family = "planning"; }, "draft_identity"],
    [value => { value.sections[0].blocks.push({ type: "facts", items: [] }); }, "draft_block_type"],
    [value => { value.sections[0].blocks[0].text += " <script>alert(1)</script>"; }, "draft_markup"],
    [value => { value.sections[0].blocks.push({ type: "list", items: [""] }); }, "shape"],
  ]) { const value = draft(); mutate(value); assert.throws(() => validateDraft(value, brief, input), { code }); }
  assert.throws(() => parseModelJson("not JSON"), { code: "draft_json" });
  assert.equal(redact("sk-ant-test-abcdefghijklmnop"), "[REDACTED]");
});

test("a replay never creates another billable POST", async t => {
  const root = await state(t); await prepare(root, manifest(), "once", 1);
  let posts = 0;
  const options = { env, fetchImpl: async (url, request) => {
    assert.equal(request.method, "POST"); assert.equal(request.redirect, "error");
    assert.equal(request.headers["anthropic-workspace-id"], env.ANTHROPIC_WORKSPACE_ID);
    assert.equal(JSON.parse(request.body).requests.length, 1); posts++;
    return new Response(JSON.stringify(batch()));
  } };
  await submit(root, "once", options);
  assert.equal((await submit(root, "once", options)).replay, true);
  assert.equal(posts, 1);
  assert.equal((await readLedger(root)).entries.length, 1);
});

test("concurrent submitters cannot double-submit a planned batch", async t => {
  const root = await state(t); await prepare(root, manifest(), "concurrent", 1);
  let posts = 0;
  const options = { env, fetchImpl: async () => { posts++; await new Promise(resolve => setTimeout(resolve, 100)); return new Response(JSON.stringify(batch())); } };
  const responses = await Promise.allSettled([submit(root, "concurrent", options), submit(root, "concurrent", options)]);
  assert.equal(posts, 1);
  assert.ok(responses.some(result => result.status === "fulfilled"));
  assert.equal((await readLedger(root)).entries.length, 1);
});

test("unknown POST outcome retains the entire reservation and prevents retries", async t => {
  const root = await state(t); const prepared = await prepare(root, manifest(), "unknown", 1);
  let posts = 0;
  const options = { env, fetchImpl: async () => { posts++; throw new Error("network interrupted after send"); } };
  await assert.rejects(submit(root, "unknown", options), { code: "submission_unresolved" });
  await assert.rejects(submit(root, "unknown", options), { code: "submission_unresolved" });
  const ledger = await readLedger(root);
  assert.equal(posts, 1); assert.equal(ledger.entries[0].status, "submission_unknown");
  assert.equal(totalCommitment(ledger) / 1e6, prepared.reserveUsd);
});

test("the shared $50 ledger blocks another run before any POST", async t => {
  const root = await state(t); await prepare(root, manifest(), "over-cap", 1);
  const ledger = await readLedger(root);
  ledger.entries.push({ runId: "previous-spend", planHash: "fixture", status: "submission_unknown", reserveMicros: CAP_MICRO_USD - 1 });
  await atomicJson(join(root, "ledger.json"), ledger);
  let calls = 0;
  await assert.rejects(submit(root, "over-cap", { env, fetchImpl: async () => { calls++; } }), { code: "budget" });
  assert.equal(calls, 0); assert.equal((await readLedger(root)).entries.length, 1);
});

test("a stale lock fails closed instead of deleting an uncertain owner's lock", async t => {
  const root = await state(t);
  await writeFile(join(root, "ledger.lock"), "stale fixture");
  await assert.rejects(withLock(root, async () => null, { attempts: 1, delayMs: 1 }), { code: "ledger_locked" });
  assert.equal(await readFile(join(root, "ledger.lock"), "utf8"), "stale fixture");
});

test("source held briefs cannot enter requests and unknown result IDs fail", () => {
  const input = manifest(); input.briefs.push({ ...input.briefs[0], id: "held", slug: "held", readiness: "source_hold" });
  const plan = buildPlan(input, "selection", 100);
  assert.equal(plan.requests.length, 1); assert.deepEqual(plan.heldBriefIds, ["held"]);
  assert.throws(() => processResults(plan, [{ custom_id: "not-known", result: {} }]), { code: "api_results" });
  const line = providerLine(plan);
  assert.throws(() => processResults(plan, [line, line]), { code: "api_results" });
  const missing = processResults(plan, []);
  assert.equal(missing.unknownReservedMicros, plan.reserveMicros); assert.equal(missing.drafts.length, 0);
});

test("validated results account full standard rates, replay offline, and detect artifact edits", async t => {
  const root = await state(t); await prepare(root, manifest(), "results", 1);
  await submit(root, "results", { env, fetchImpl: async () => new Response(JSON.stringify(batch())) });
  const plan = await loadPlan(root, "results");
  const options = { env, fetchImpl: async url => new Response(url.endsWith("/results") ? JSON.stringify(providerLine(plan)) + "\n" : JSON.stringify(batch("ended"))) };
  const saved = await results(root, "results", options);
  assert.equal(saved.totals.validated, 1); assert.equal(saved.accountedUsd, (1700 * 2 + 1600 * 10) / 1e6);
  assert.equal((await results(root, "results", { env, fetchImpl: async () => { throw new Error("must stay offline"); } })).replay, true);
  const path = join(runDirectory(root, "results"), "validated-drafts.json");
  const drafts = JSON.parse(await readFile(path, "utf8")); drafts[0].title = "A changed title"; await atomicJson(path, drafts);
  await assert.rejects(results(root, "results", options), { code: "artifact_changed" });
});

test("provider failures keep reservations; missing usage or truncation cannot become a validated draft", () => {
  const plan = buildPlan(manifest(), "failures", 1);
  const failed = processResults(plan, [{ custom_id: plan.requests[0].customId, result: { type: "errored", error: { message: "never expose a provider body" } } }]);
  assert.equal(failed.unknownReservedMicros, plan.reserveMicros); assert.equal(failed.results.items[0].status, "errored");
  const truncated = providerLine(plan); truncated.result.message.stop_reason = "max_tokens";
  assert.equal(processResults(plan, [truncated]).drafts.length, 0);
  const absent = providerLine(plan); delete absent.result.message.usage;
  const held = processResults(plan, [absent]); assert.equal(held.unknownReservedMicros, plan.reserveMicros); assert.equal(held.drafts.length, 0);
});

test("an unexpected accounting overrun freezes all further reservations", async t => {
  const root = await state(t); await prepare(root, manifest(), "overspend", 1); const reserved = await claim(root, "overspend");
  await settle(root, "overspend", { knownMicros: reserved.entry.reserveMicros + 1, unknownReservedMicros: 0, resultHash: "fixture" });
  assert.equal((await readLedger(root)).frozen, true);
  await prepare(root, manifest(), "next-run", 1);
  await assert.rejects(claim(root, "next-run"), { code: "budget_frozen" });
});

test("credentials cannot be redirected to another host", async () => {
  let calls = 0;
  await assert.rejects(apiFetch("https://attacker.invalid/results", { env, fetchImpl: async () => { calls++; } }), { code: "api_origin" });
  assert.equal(calls, 0);
});

test("thinking and redacted thinking are discarded while only completed text JSON is validated", () => {
  const plan = buildPlan(manifest(), "thinking", 1), line = providerLine(plan);
  line.result.message.content.unshift({ type: "thinking", thinking: "DO NOT COPY THIS PRIVATE PROVIDER BLOCK", signature: "opaque-signature" }, { type: "redacted_thinking", data: "opaque-encrypted-data" });
  assert.equal(extractMessageText(line.result.message), JSON.stringify(draft()));
  const processed = processResults(plan, [line]);
  assert.equal(processed.drafts.length, 1);
  assert.equal(JSON.stringify(processed).includes("DO NOT COPY"), false);
  assert.equal(JSON.stringify(processed).includes("opaque-signature"), false);
  const onlyThinking = structuredClone(line); onlyThinking.result.message.content = [{ type: "thinking", thinking: "", signature: "opaque" }];
  assert.equal(processResults(plan, [onlyThinking]).results.items[0].reasons[0], "message_shape");
  for (const block of [{ type: "tool_use", name: "anything", input: {} }, { type: "future_block", data: "anything" }, { type: "text", text: 123 }, null]) {
    const unknown = structuredClone(line); unknown.result.message.content.push(block);
    assert.equal(processResults(plan, [unknown]).results.items[0].reasons[0], "message_shape");
  }
  const incomplete = structuredClone(line); incomplete.result.message.stop_reason = "max_tokens";
  assert.equal(processResults(plan, [incomplete]).drafts.length, 0);
});

test("offline revalidation writes a new immutable revision and cannot alter cache or ledger", async t => {
  const root = await state(t); await prepare(root, manifest(), "review", 1);
  await submit(root, "review", { env, fetchImpl: async () => new Response(JSON.stringify(batch())) });
  const plan = await loadPlan(root, "review"), line = providerLine(plan);
  const options = { env, fetchImpl: async url => new Response(url.endsWith("/results") ? JSON.stringify(line) + "\n" : JSON.stringify(batch("ended"))) };
  await results(root, "review", options);
  const directory = runDirectory(root, "review"), paths = [join(root, "ledger.json"), join(directory, "results.json"), join(directory, "validated-drafts.json"), join(directory, "plan.json")];
  const before = await Promise.all(paths.map(path => readFile(path, "utf8")));
  line.result.message.content.unshift({ type: "thinking", thinking: "", signature: "already-stripped" });
  const saved = join(directory, "provider-results-stripped.jsonl"); await writeFile(saved, JSON.stringify(line) + "\n");
  const reviewed = await revalidate(root, "review", saved, "parser-v2");
  assert.equal(reviewed.totals.validated, 1); assert.equal(reviewed.noApiCallMade, true);
  assert.deepEqual(await Promise.all(paths.map(path => readFile(path, "utf8"))), before);
  await assert.rejects(revalidate(root, "review", saved, "parser-v2"), { code: "revision_exists" });
  line.result.message.usage.output_tokens++;
  await writeFile(saved, JSON.stringify(line) + "\n");
  await assert.rejects(revalidate(root, "review", saved, "different-usage"), { code: "revalidation_usage" });
});
