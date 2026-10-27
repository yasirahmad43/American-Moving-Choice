# Direct-capture evidence packs

Each `<slug>.md` file here is an evidence pack generated from a direct capture made on 2026-10-27:
headless Chromium 131 (puppeteer-core 23.11.1, @sparticuz/chromium 131.0.1) running in a Vercel Sandbox
(region iad1) in the owner's Vercel account, using `tools/reference-capture/capture.js` (commit cf52955)
and condensed by `tools/reference-capture/pack.js` (commit 6f75d5f).

- Public pages only; robots.txt respected.
- Quote flows were walked automatically with test ZIPs (30303 → 33101) and stopped before any step that
  asks for contact details. No personal data was entered anywhere.
- Sites that refused automated access are recorded as blocked. No attempt was made to bypass bot
  protection.
- Packs contain short verbatim excerpts used as evidence, with page paths. Raw captures and screenshots are
  kept privately outside the repository.
