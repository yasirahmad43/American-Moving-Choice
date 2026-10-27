# Skills & Integrations Log

Record of the skills and integrations used in each phase, what they produced, and what was unavailable. A skill named in the brief is not assumed to be installed. Each row reflects what this workspace actually offered on the date shown.

## Phase 1: Discovery (2026-10-27)

### Workstreams

| Workstream | Who | Output |
|---|---|---|
| Reference research (first pass) | Research agent (WebSearch; direct fetching blocked by network policy) | `research/reference-matrix.md` v1 |
| Reference research (full review) | Multi-agent workflow: per-site inventory, two review lenses, two adversarial verifiers, synthesis, completeness critic | `research/reference-review/*.md`, `research/reference-matrix.md` v2 |
| Keyword & competitor data | Research agent (Semrush connector) | `research/keyword-research.md`, `research/raw/semrush/*` |
| Regulatory & platform facts | Research agent (WebSearch on official domains) | `research/compliance-and-platform-facts.md` |
| Business rules, credit policy, architecture, data model, marketplace core code | Lead (main session) | `business-rules/*`, `architecture/*`, `packages/core`, `db/` |
| SEO architecture | SEO specialist | `seo/site-architecture.md`, `seo/keyword-to-page-map.csv` |
| Product discovery, MVP, backlog | Product specialist | `product/*` |
| Visual direction | Design specialist | `design/visual-direction.md`, `design/style-tile.html` |

### Skills

Status key: **Used** (instructions loaded and applied) · **Evaluated** (loaded or reviewed, not needed yet) · **Deferred** (relevant to a later phase) · **Not applicable** · **Missing** (not installed).

| Skill (as named in the brief) | Installed as | Status | Used by / output |
|---|---|---|---|
| product-strategy-session | `anthropic-skills:product-strategy-session` | **Used** | Positioning, goals and non-goals in `product/mvp-scope.md` §1 and `product/jtbd-and-journeys.md` §1 |
| jobs-to-be-done | `anthropic-skills:jobs-to-be-done` | **Used** | Consumer, mover and ops jobs and proto-personas in `product/jtbd-and-journeys.md` §2–3 |
| discovery-process | `anthropic-skills:discovery-process` | **Used (as a plan)** | No interviews could run yet. The validation plan (8–12 mover interviews, consumer usability tests, concierge pilot, decision gates) is in `product/jtbd-and-journeys.md` §6 |
| prioritization-advisor | `anthropic-skills:prioritization-advisor` | **Used** | MoSCoW boundary with ICE scores and stated assumptions in `product/mvp-scope.md` §2–3 |
| user-story | `anthropic-skills:user-story` | **Used** | Stories with Given/When/Then criteria across all phases in `product/backlog.md` |
| roadmap-planning | `anthropic-skills:roadmap-planning` | **Used** | Now/Next/Later in `product/mvp-scope.md` §4; phase plan and critical path in `product/backlog.md` §3 and §14 |
| write-spec | `product-management:write-spec` | **Used** | Spec structure for `product/mvp-scope.md`; the consolidated Phase 2 spec merges it with your answers |
| seo, seo-plan | `anthropic-skills:seo`, `anthropic-skills:seo-plan` | **Used** (seo-plan as the coordinator) | `seo/site-architecture.md` |
| seo-sxo | `anthropic-skills:seo-sxo` | **Used** | Intent-to-format mapping per page family (`seo/site-architecture.md` §1) |
| seo-cluster | `anthropic-skills:seo-cluster` | **Used** | Topic clusters and internal-linking plan (§3); `seo/keyword-to-page-map.csv` |
| seo-dataforseo | `anthropic-skills:seo-dataforseo` | **Integration missing** | No DataForSEO connector or credentials in this workspace; Semrush used instead |
| seo-backlinks | `anthropic-skills:seo-backlinks` | **Deferred** | Semrush backlink overview for 4 competitors in `research/keyword-research.md`; full earned-link plan in Phase 7 |
| Semrush | Semrush connector | **Used** | Domain overview (11 domains), top pages, ~104 keyword metrics, top-10 organic results for 6 keywords, backlink overview (4 domains). All calls succeeded |
| seo-programmatic | `anthropic-skills:seo-programmatic` | **Used** | Publishing gate, noindex-until-ready, batch rollout and pruning rules (§4) |
| seo-content-brief | `anthropic-skills:seo-content-brief` | **Evaluated** | Source-record format defined (§6). Sample briefs **deferred until the full reference-site review is complete**, per your instruction |
| seo-content | `anthropic-skills:seo-content` | Deferred (Phase 7) | |
| seo-local | `anthropic-skills:seo-local` | **Evaluated** | Local-page data requirements; no physical locations of our own, so no GBP work |
| seo-geo, seo-geo-aeo | `anthropic-skills:seo-geo`, `anthropic-skills:seo-geo-aeo` | **Used** | AI search visibility plan, crawler policy, measurement (§7) |
| seo-competitor-pages | `anthropic-skills:seo-competitor-pages` | **Evaluated** | `/compare/` family only where evidence-based comparisons are justified |
| ui-ux-pro-max | — | **Missing** | Not installed; `high-end-visual-design`, `design-taste-frontend-v1` and `minimalist-ui` (partly) used instead |
| high-end-visual-design | `anthropic-skills:high-end-visual-design` | **Used, with limits** | "Route Ledger" direction in `design/visual-direction.md`; conflicts with accessibility/performance resolved in favour of those (documented table) |
| brandkit | `anthropic-skills:brandkit` | **Skipped for now** | The existing logo is the brand anchor. A vector master and trademark check are needed before launch |
| gpt-taste | `anthropic-skills:gpt-taste` | **Used selectively** | Motion spec: one trigger-once storytelling moment; no pinning or scrubbing |
| imagegen-frontend-web | `anthropic-skills:imagegen-frontend-web` | **Skipped** | Code-first style tile was the better fit for Phase 1 |
| image-to-code | `anthropic-skills:image-to-code` | **Skipped** | No reference image workflow selected |
| stitch-design-taste | `anthropic-skills:stitch-design-taste` | **Not applicable** | Google Stitch is not part of the selected workflow |
| seo-technical, seo-schema, seo-sitemap, seo-images, seo-page | `anthropic-skills:*` | **Evaluated** (technical, schema, sitemap skimmed) | Specs in `seo/site-architecture.md` §8; validation runs in Phase 7 |
| seo-image-gen | `anthropic-skills:seo-image-gen` | Deferred (Phase 7) | Image generators are present (Higgsfield, Canva). Generated images are never presented as real people, offices or moves |
| seo-audit, seo-google, seo-drift | `anthropic-skills:*` | Deferred (Phase 7–8) | `seo-google` needs Search Console/GA4 access, which isn't connected |
| seo-maps | `anthropic-skills:seo-maps` | **Not applicable** | Only for eligible business locations or authorized mover-profile work |
| seo-hreflang | `anthropic-skills:seo-hreflang` | **Not applicable** | No alternate-language versions planned |
| seo-flow | `anthropic-skills:seo-flow` | **Optional** | May organize the evidence-led workflow in Phase 7 |
| seo-ecommerce | `anthropic-skills:seo-ecommerce` | **Not applicable** | No ecommerce feature in scope |
| ads-setup, ads-plan, ads-landing, ads-attribution, ads-server-side-tracking, ads-math, platform skills | `anthropic-skills:ads-*` | Deferred | Paid channels are not in scope yet. The attribution data model (evidence levels, click IDs kept admin-only) is designed so these slot in later |
| healthcare-leadgen-site | `anthropic-skills:healthcare-leadgen-site` | **Not applicable** | Excluded per the brief |
| workflow-authoring | `workflow-authoring` | **Used** | Multi-agent reference-site review with adversarial verification (`research/reference-review/`) |

### Integrations

| Integration | Status in this session | Notes |
|---|---|---|
| GitHub | Working | Branch pushed and CI green. No base branch exists yet for a pull request (see the brief, §11) |
| Semrush | Working | See above |
| Supabase | Available, not used | Creating projects creates billable resources, so it waits for your approval |
| Vercel | Available, not used | Same as Supabase |
| Canva, Higgsfield, Google Drive, Hugging Face, Claude Docs | Available, not used | Possible later use for brand assets/video (with honest labelling) and document sharing |
| Similarweb, Figma, Amplitude, Notion, Linear, Asana, Atlassian, ClickUp, Monday, Intercom, Pendo, Fireflies, Slack, BigQuery | **Failed to connect** | Connection refused at session start; reconnect if needed |
| Stripe, FMCSA QCMobile (WebKey), Twilio, Postmark, Google Search Console / GA4, Bing Webmaster | **Not connected** | Access needed per the backlog's dependency list |
| Web access from the container | **Restricted** | Network policy refused the reference sites, fmcsa.dot.gov and federalregister.gov. WebSearch worked; WebFetch did not |
