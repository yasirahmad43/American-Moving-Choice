# Source-bound Claude content pilot

Offline/server-only Node 22+ tools. They create draft artifacts; they never modify the public catalog, publish pages, enable indexing or change lead forms. No external packages are required.

Run from the repository root:

```text
node --test tools/claude-content/runner.test.mjs
node tools/claude-content/runner.mjs plan --manifest tools/claude-content/briefs/amc-reviewed-2026-10-30.json --run amc-2026-10-30-v1 --limit 24
node tools/claude-content/runner.mjs submit --run amc-2026-10-30-v1
node tools/claude-content/runner.mjs poll --run amc-2026-10-30-v1
node tools/claude-content/runner.mjs results --run amc-2026-10-30-v1
```

Supply `ANTHROPIC_API_KEY` and `ANTHROPIC_WORKSPACE_ID` privately through the process environment for submit, poll and initial result collection. Never put a key in arguments, a manifest or a committed file. On this Windows host the approved private wrapper supplies these values from local encrypted storage. Normal Windows file permissions are needed for atomic renames; the restricted process can return `EPERM`. Tests make only mocked network calls.

## Spending and replay behavior

The pinned model is `claude-sonnet-5-5`, with 6,000 maximum output tokens per request. Input reservations use UTF8 prompt bytes plus 8,192 envelope tokens. The ledger reserves **full standard rates of $2/million input and $10/million output**, even though the batch API is discounted. No tools, browsing or caching are configured. The model's default adaptive thinking shares this same output limit; the parser discards `thinking` and `redacted_thinking` blocks and validates only completed text. See Anthropic's [Sonnet 5.5 migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide) and [thinking response format](https://platform.claude.com/docs/en/build-with-claude/thinking).

All runs share one fixed `$50` ledger at `work/claude-pilot/runner/ledger.json`. `plan` is free and does not reserve funds. `submit` obtains an exclusive file lock, persists its reservation and the submitting state, and only then sends one paid POST. Replaying a confirmed run returns its existing batch ID. An interrupted, timed-out, rejected or otherwise uncertain submission keeps its full reservation and cannot be submitted again automatically. There are no automatic network retries, an alternate API origin, or a CLI option to reset/change the ledger location.

Usage is accounted at full standard rates after results arrive; missing or failed results keep their full request reservations. Any reported cost above a reservation freezes new submissions. A stale lock is never automatically deleted. After a crash, verify the owning process and reconcile the provider batch before repairing local state. Keep this ledger and its run folders together; deleting/resetting them would discard the spending protection. The ledger protects this pilot's requests, not unrelated account activity or another checkout.

## Input and output

A version 1 manifest contains `sources[{id,label,url,accessedOn}]`, immutable verified `claims[{id,sourceId,text}]`, and briefs with fixed `id/family/slug`, source/claim IDs, reader goal, outline, claim boundary and related URLs. Only `readiness: "draft_ready"` is selected. `--limit` defaults to 12 and accepts 1–100. Held and deferred IDs remain in the immutable plan.

Each run lives under `work/claude-pilot/runner/runs/<run-id>/`:

- `plan.json`: immutable prompts, selected brief IDs, manifest snapshot, conservative reservation and hash.
- `requests.json`: reviewable batch payload, containing no credentials.
- `submission.json`: confirmed batch ID, retained for crash recovery.
- `results.json`: one status per selected brief, safe hold/error codes, usage and validated drafts.
- `validated-drafts.json`: array of `{briefId,...draft}` for the separate editorial adapter.

The generated draft contract has only `family`, `slug`, `title`, `h1`, `metaDescription`, `answer`, `sections`, `faq`, and `sourceClaimIds`. Sections support paragraph, note, list and compact table blocks. Validation requires the assigned identity, 40–80 answer words, 600–1,800 main words, 3–7 sections, 2–5 FAQs, approved claim IDs and an explicit URL allowlist. It rejects unsupported blocks, HTML, generated images, secret-like material, malformed/truncated messages and unbounded usage. The publication adapter injects verified facts and source references from the manifest; model output cannot supply them.

Passing structural validation is **not factual or editorial approval**. Review claims, usefulness, originality and query overlap; then use the separate scoped editorial bridge and existing publication gates. No ranking, indexing or lead-volume promise is implied by generated drafts.

## Offline response revalidation

Previously cached results remain immutable when a parser is corrected. Revalidate an already accounted run from its saved, stripped provider results into a new review revision:

```text
node tools/claude-content/revalidate.mjs --run amc-2026-10-30-v1 --provider-results work/claude-pilot/runner/runs/amc-2026-10-30-v1/provider-results-review.json --revision parser-v2
```

The input may be a bounded JSON array or JSONL. This command has no API/credential access and does not update the ledger, original cache, plan or request payload. It verifies the original artifact hashes and unchanged usage accounting, then writes `revalidations/<revision>/results.json` and `validated-drafts.json`. Existing revision folders cannot be overwritten. Opaque thinking content is discarded from the resulting artifacts. Unknown blocks, tool-use responses, incomplete answers and structural/source failures remain held for separate editorial review.
