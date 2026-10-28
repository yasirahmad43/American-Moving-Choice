# Durable admin media uploads

Migration `210_media_storage.sql` adds `media_assets`, the database manifest for runtime
uploads and editorial overrides. The checked-in 418-asset library remains bundled and
read-only. New uploads never write to `apps/web/public` or change a JSON file in a running
deployment. SEO media ownership remains authoritative in `seo_media_usage`.

## Verified setup status — 2026-10-28, before release

- Supabase project `american-moving-choice` has an empty `amc-media` bucket, verified public,
  restricted to `image/webp`, with a **4 MiB (4,194,304-byte)** object limit.
- Vercel `amc-app` has `SUPABASE_URL=https://ctpqgtststuxabtvejyi.supabase.co` and
  `SUPABASE_MEDIA_BUCKET=amc-media` configured for **Production and Preview**.
- **Only the server credential is missing.** The owner has been asked to add
  `SUPABASE_SECRET_KEY` directly in Vercel for those environments. Do not paste it into chat.
- Production still runs the previous `main` application. Migration 210 and the completed upload
  implementation await release. After the key is configured, redeploy and verify a live upload.
  **Uploads are not yet enabled or verified in production.** The integrated admin implementation
  hides the upload form with an unavailable reason while the key is absent.
- Local focused verification passed **23/23 tests** with mocked Storage in a disposable database;
  no live storage upload was made. The final integration suite passed 487 automated tests and all
  package TypeScript checks. Those results do not replace post-deployment storage verification.

The setup instructions below describe the full configuration for a fresh environment. For the
current project, bucket creation and the two non-secret variables are already complete; the
remaining configuration action is the server key, followed by deployment and verification.

## Configure the app server

1. Apply migration 210 through the normal deployment migrator.
2. Create a **public** Supabase Storage bucket named `amc-media`. Allow `image/webp` only;
   a 4 MiB (4,194,304-byte) bucket file limit is sufficient for the generated variants. Keep browser writes
   disabled: do not add anonymous or authenticated INSERT/UPDATE/DELETE policies.
3. Set these server environment variables on **amc-app**:
   - `SUPABASE_URL=https://ctpqgtststuxabtvejyi.supabase.co`
   - `SUPABASE_MEDIA_BUCKET=amc-media`
   - `SUPABASE_SECRET_KEY`: a server secret key (`sb_secret_…`), preferably dedicated to AMC media.
     A legacy `SUPABASE_SERVICE_ROLE_KEY` JWT is also accepted as a fallback; set only one.
4. Redeploy the app. Never put the credential in Git, client props, a `NEXT_PUBLIC_` variable,
   logs, or the web project. New secret keys are sent only in the `apikey` header; legacy
   service-role JWTs also use `Authorization: Bearer`. See the official
   [API key guide](https://supabase.com/docs/guides/getting-started/api-keys). The public web app needs only its existing database connection;
   it resolves recorded public image URLs and serves the pre-optimized WebP tiers directly.

This bucket is for public editorial images. Public buckets permit anyone with a URL to read
their files. Do not upload customer documents or private survey photos. See Supabase's
[bucket access model](https://supabase.com/docs/guides/storage/buckets/fundamentals) and
[server key behavior](https://supabase.com/docs/guides/storage/security/access-control).

The admin upload form is unavailable with an explanatory message when configuration is
absent or invalid. Every upload checks that the bucket exists and has public reads. Storage
errors prevent success; provider response bodies and credentials never enter admin errors.

## Processing and consistency

Uploads accept PNG/JPEG/WebP up to 3 MB and 40 megapixels, with a minimum oriented size of
800×450. Actual decoded type must match the declared type; animated/multipage files are
refused. Sharp applies orientation, strips original metadata, and generates capped-width
and 800px WebP tiers plus an inline blur. If both tiers are 800px, only one object is written.
The app allows a 4 MB multipart action body, leaving room below
[Vercel's 4.5 MB request limit](https://vercel.com/docs/functions/limitations#request-body-size).

Object keys contain a random upload ID and are immutable (`x-upsert: false`). A successful
Storage upload is followed by a transaction recording the manifest, SHA-256, object paths,
byte counts, uploader and audit event. A unique SHA-256 constraint also catches concurrent
duplicates. If any tier or the transaction fails, the fresh keys are removed and no library
entry is created. A failed cleanup is reported explicitly; administrators can reconcile that
random upload prefix against `media_assets.storage_objects` before deleting an orphan.
An interrupted process can likewise leave unreferenced objects; it cannot create a valid
library entry pointing at an unfinished upload. Storage uses Supabase's
[standard upload API](https://supabase.com/docs/guides/storage/uploads/standard-uploads).

Assignments, rejection, restoration and their audits are transactional and serialized per
asset. Runtime resolvers require the actual page claim and skip rejected assets. The SEO CLI,
admin generator and production bootstrap use the same merged manifest. `media-sync` now
reconciles DB records; `media:check` continues validating the untouched bundled library.
Hand-built pages pin bundled images at build time; the admin explains that replacing those
images requires an editorial site deployment instead of claiming a DB rejection hides them.

## Optional production-build storage proof

The default is off. To verify the actual provider without downloading its server key or using a
private admin login, first add the server key directly in Vercel, then set
`AMC_VERIFY_MEDIA_STORAGE=true` on `amc-app` **Production** and trigger a production deployment.
No successful live probe has been recorded in this handoff; the flag's default and mocked test
results are not evidence of a working production upload.

`db/scripts/vercel-deploy.ts` calls the probe after SEO bootstrap, only in its existing production
execution path. With the flag unset or false, it performs no storage request or extra logging.
With the flag true, missing configuration fails the build clearly instead of reporting success.
It checks public-bucket status, generates a solid navy 800×450 WebP, writes one immutable fresh
`uploads/storage-check-<UUID>/readiness.webp` object, and fetches that public URL **without
credentials**. Both the response content type and the exact bytes must match. A finally block
removes only that fresh key, including after a failed or ambiguous read/write. Explicitly refused
writes are never deleted. The probe creates no manifest/DB row and uses no customer information.

Only a successful write, matching public read and confirmed cleanup emit this proof line:

`media-storage-probe: verified write/read/delete (800x450 WebP; temporary object removed)`

Failures emit `media-storage-probe: failed (<safe error code>)` and fail the deployment. Provider
exception bodies and credentials are never logged. Cleanup failure never emits success; its safe
error identifies only the fresh temporary key for inspection. After capturing successful deployment
proof, remove the flag or set it to false to avoid a probe on every production deployment.

## Verification

`test/media-storage.test.ts` covers the REST protocol, public-bucket requirement, immutable
writes, sanitized failures and scoped cleanup using mocked responses. The media section of
`test/admin-content.test.ts` checks the DB manifest, unchanged bundled JSON, duplicate upload
protection, role/claim rules and rendered asset resolution. All tests use disposable local
data and mocked Storage responses. No live storage credential is needed to run them. The
protocol/probe suite now passes 12 cases: the original six protocol tests plus six new deployment
probe checks covering opt-in/missing config, public byte/type verification, failed reads with cleanup,
wrong type, wrong bytes, cleanup failure and sanitized logs.
