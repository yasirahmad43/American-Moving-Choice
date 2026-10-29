# Compact SEO corpus and interrupted-bootstrap recovery

Migration `230_compact_seo_corpus.sql` replaces the derived row-per-shingle index with `seo_page_shingles`: one page URL, family, source content hash, packed `integer[]` and revision per page. It drops only `seo_shingles`. Page content, leads, accounts, historical consent, publication decisions, links, media ownership and bootstrap checkpoints remain intact. There is no temporary SQL aggregation/copy of the old cache before it is dropped.

## Measured local verification

The complete local catalogue was migrated and rebuilt from its saved content. These figures include relation indexes/TOAST, rather than just estimated array payloads:

| Measure | Before | After |
|---|---:|---:|
| Derived corpus | 1,180,237,824 bytes (1,125.56 MiB) | 28,426,240 bytes (27.11 MiB) |
| Entire local database | 1,386,748,951 bytes (1,322.51 MiB) | 234,953,751 bytes (224.07 MiB) |
| Saved page records | 4,782 | 4,782, unchanged |
| Published/indexable pages | 2,467 | 2,467, unchanged |
| Uniqueness-score differences | — | **0 across all 4,782 pages in eight families** |

Every stored content hash, status, indexability value and uniqueness score matched its baseline exactly. A second bootstrap call skipped generation and returned the current count of 2,467. The observed local WAL increase during migration/backfill was 37,438,784 bytes; WAL is cluster-wide and this is a local measurement, not a production limit or timing guarantee. Full evidence is in `outputs/design-pass-2/seo-storage-report.json`.

The production failure occurred with 51 state pages checkpointed and 2,818 city drafts saved. Read-only metadata later showed approximately 536 MB of database data, including 451 MB of legacy shingle cache, plus approximately 1.36 GB of WAL. Those observations diagnose storage amplification; they do not constitute a production migration result.

## Unchanged quality semantics

The packed values are exactly the existing distinct, signed 32-bit FNV-1a hashes of five-word shingles. They are not rehashed, truncated, sampled, or converted to a different uniqueness metric. Draft pages continue to participate in their family's corpus. The 40% uniqueness threshold, 300-word gate, evidence/intent checks, exact-ZIP coverage rule and Alaska/Hawaii transport restriction are unchanged.

Scoring reads at most 100 packed page records at a time. The first pass fills one typed `Int32Array`, sorts it in place, and builds a typed singleton array. The second pass scores each requested page against those same family singletons. There are no millions of persistent row entries, per-shingle indexes, or large database aggregate sorts.

An ordered SHA-256 fingerprint covers every small corpus metadata record: URL, source hash, revision and hash count. It is checked after scoring and before/after publication-decision batches. A source-hash check separately detects content edited without its cache being refreshed. A sequence maximum alone would be insufficient: a transaction can reserve a lower revision and commit after a later revision. The regression suite exercises that real two-client ordering case.

If the corpus changes, scoring rejects the result. The generator also conditions decision writes on the source content hash and marks the affected family draft/nonindexable on a detected inconsistency, rather than leaving a partly approved family. Regeneration is the retry path.

## Migration and resume

The ordinary production build applies migration 230 before the bootstrap. Cache repair scans saved pages in batches of 100, rebuilding absent or stale packed records from the existing content. Unchanged source hashes do not cause repeated cache rewrites. A source edit occurring during repair is detected before scoring.

Repair runs before skipped/bootstrap-completed phases are considered initialized, so the 51 previously published state pages are included even though their generation checkpoint is complete. A focused test reproduces 51 published state records plus 2,818 unfinished city records: all 2,869 compact records are recovered, state publication and city draft status are retained, and the saved phase list remains intact. Missing cache rows with an unchanged source hash and stale rows following content edits are tested separately.

The build entrypoint logs the actual application role's transaction/default read-only modes, database bytes, and legacy/compact cache sizes before migration, using the same resolved database URL/TLS configuration. It prints no credentials and does not override read-only settings.

## Read-only recovery boundary

Supabase documents read-only protection at high physical disk usage; the 500 MB database billing quota alone is a different limit. WAL contributes to physical usage. A current read-only check from another role or connection does not prove the application's connection can write. See [Supabase database and disk size, including read-only recovery](https://supabase.com/docs/guides/platform/database-size).

Attempt the ordinary tested migrator first, without project-setting changes or automatic read-only overrides. If the actual application role is still read-only, use a separately reviewed recovery following the provider's instructions and the verified cache-only migration. Do not delete application tables, reset the database, retry the old row-per-shingle writer, or rebuild the old index. Migration 230 must retain all saved content/checkpoints and free the derived legacy cache before the compact rebuild begins.

## Observed production recovery

On 2026-10-28 the fresh application-role preflight reported both read-only flags **off**. The normal
migrator applied 230, repaired all 2,869 saved page records, retained completed state/geo/research
checkpoints and resumed the remaining generation. Bootstrap completed at 20:24:37 UTC with **2,468
published/indexable pages**. No setting override or manual data cleanup was needed.

Independent read-only aggregates confirmed all 17 migrations, 4,782 source/packed records, zero
missing/stale cache entries and zero failed published-page quality/privacy checks. The database
measured 191.08 MiB and the compact cache 27.24 MiB at 20:29:30 UTC. The slight publication difference
from the 2,467-page local baseline is documented in `expansion-verification.md`; it does not reflect
a change to the uniqueness rule. Production reports and filtered recovery logs are included in the
proof package, separately from the local equivalence benchmark above.
