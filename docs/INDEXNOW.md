# Public search ownership and IndexNow

Search ownership uses public verification tokens; it does not require DNS changes for URL-prefix properties. Set `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` on the web production deployment. The root metadata emits `google-site-verification` and `msvalidate.01` only when `SITE_INDEXABLE=true`. These settings do not create or verify provider accounts on their own.

Set a randomly generated `INDEXNOW_KEY` on that deployment. The public UTF-8 proof file is `/indexnow-key.txt`. Its root location covers all public paths and is included as `keyLocation` in every submission. The key file returns 404 on a non-indexable preview or when the key is absent/invalid. This key is intentionally public and is separate from account credentials.

The server-only runner reads the live canonical `robots.txt` and segmented sitemap. It accepts only same-origin, canonical, public sitemap URLs, with no query strings, private request tokens, company profiles, or retired business pages. It refuses a closed preview, off-site/nested arbitrary files, oversized responses and excessive inventory. It does not connect to a database.

From the repository root, plan the initial public submission:

```powershell
pnpm --filter @amc/server exec tsx scripts/indexnow.ts --site https://www.americanmovingchoice.com --key-file work/tracking/indexnow-key.txt
```

The command defaults to a plan and writes public-only evidence under ignored `work/tracking/indexnow`. After the key file is deployed and the plan is reviewed, run the same command with `--submit`. The runner checks the live proof file before any IndexNow POST. It sends sequential batches of 1,000 URLs by default, at most 10,000 URLs and 10 batches per run. `--batch-size` and `--limit` can reduce a run. Re-run to progress through a larger inventory.

The persistent ledger skips URL versions already received. A version uses the canonical URL and sitemap `lastmod`. For substantive changes to undated core content, supply a deliberate `--revision meaningful-content-version`; do not change it merely because an infrastructure deployment occurred. Use the same ledger directory on subsequent runs. A changed domain or ownership key requires a separate evidence directory.

HTTP 200 records delivery; HTTP 202 records delivery with key validation pending. Neither means the page was crawled, indexed, ranked, or selected by an AI assistant. The shared IndexNow endpoint distributes notifications to participating engines; Google Search Console sitemap submission remains separate. Transport-uncertain delivery is held instead of automatically repeated. Inspect its evidence before intentionally using `--retry-uncertain`. Rate-limit responses stop the run and respect `Retry-After` before the next attempt.

The runner creates an exclusive directory lock, records each attempted batch before sending, then atomically stores receipts after the response. It stops at the first delivery failure. Evidence includes the inventory digest, sitemap digests, planned public URLs, batch outcomes and timestamps. It stores a hash of the public key rather than its value. A receipt is delivery evidence, never an indexing promise.

No scheduled submission job is installed. No external notification is sent by the web key route or a normal site build.

Protocol references: [IndexNow documentation](https://www.indexnow.org/documentation), [IndexNow FAQ](https://www.indexnow.org/faq), [Next.js verification metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#verification).
