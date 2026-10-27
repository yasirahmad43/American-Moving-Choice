# Skills & Integrations Log

Record of the skills and integrations used in each phase, what they produced, and what was unavailable. A skill named in the brief is not assumed to be installed. Each row reflects what this workspace actually offered on the date shown.

## Phase 1: Discovery (2026-10-27)

### Workstreams

| Workstream | Who | Output |
|---|---|---|
| Reference research | Research agent (WebSearch; direct fetching blocked by network policy) | `research/reference-matrix.md` |
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
| product-strategy-session | `anthropic-skills:product-strategy-session` | {product} | |
| jobs-to-be-done | `anthropic-skills:jobs-to-be-done` | {product} | |
| discovery-process | `anthropic-skills:discovery-process` | {product} | |
| prioritization-advisor | `anthropic-skills:prioritization-advisor` | {product} | |
| user-story | `anthropic-skills:user-story` | {product} | |
| roadmap-planning | `anthropic-skills:roadmap-planning` | {product} | |
| write-spec | `product-management:write-spec` | {product} | |
| seo, seo-plan | `anthropic-skills:seo`, `anthropic-skills:seo-plan` | {seo} | |
| seo-sxo | `anthropic-skills:seo-sxo` | {seo} | |
| seo-cluster | `anthropic-skills:seo-cluster` | {seo} | |
| seo-dataforseo | `anthropic-skills:seo-dataforseo` | **Integration missing** | No DataForSEO connector or credentials in this workspace; Semrush used instead |
| seo-backlinks | `anthropic-skills:seo-backlinks` | {seo} | Semrush backlink overview for 4 competitors in `research/keyword-research.md` |
| Semrush | Semrush connector | **Used** | Domain overview (11 domains), top pages, ~104 keyword metrics, top-10 organic results for 6 keywords, backlink overview (4 domains). All calls succeeded |
| seo-programmatic | `anthropic-skills:seo-programmatic` | {seo} | |
| seo-content-brief | `anthropic-skills:seo-content-brief` | {seo} | |
| seo-content | `anthropic-skills:seo-content` | Deferred (Phase 7) | |
| seo-local | `anthropic-skills:seo-local` | {seo} | |
| seo-geo, seo-geo-aeo | `anthropic-skills:seo-geo`, `anthropic-skills:seo-geo-aeo` | {seo} | |
| seo-competitor-pages | `anthropic-skills:seo-competitor-pages` | {seo} | |
| ui-ux-pro-max | — | **Missing** | Not installed; `high-end-visual-design` and `design-taste-frontend-v1` used instead |
| high-end-visual-design | `anthropic-skills:high-end-visual-design` | {design} | |
| brandkit | `anthropic-skills:brandkit` | {design} | |
| gpt-taste | `anthropic-skills:gpt-taste` | {design} | |
| imagegen-frontend-web | `anthropic-skills:imagegen-frontend-web` | {design} | |
| image-to-code | `anthropic-skills:image-to-code` | {design} | |
| stitch-design-taste | `anthropic-skills:stitch-design-taste` | {design} | Google Stitch is not part of the selected workflow |
| seo-technical, seo-schema, seo-sitemap, seo-images, seo-page | `anthropic-skills:*` | {seo} | Specs in `seo/site-architecture.md`; validation runs in Phase 7 |
| seo-image-gen | `anthropic-skills:seo-image-gen` | Deferred (Phase 7) | Image generators are present (Higgsfield, Canva). Generated images are never presented as real people, offices or moves |
| seo-audit, seo-google, seo-drift | `anthropic-skills:*` | Deferred (Phase 7–8) | `seo-google` needs Search Console/GA4 access, which isn't connected |
| seo-maps | `anthropic-skills:seo-maps` | {seo} | |
| seo-hreflang | `anthropic-skills:seo-hreflang` | {seo} | |
| seo-flow | `anthropic-skills:seo-flow` | {seo} | |
| seo-ecommerce | `anthropic-skills:seo-ecommerce` | {seo} | |
| ads-setup, ads-plan, ads-landing, ads-attribution, ads-server-side-tracking, ads-math, platform skills | `anthropic-skills:ads-*` | Deferred | Paid channels are not in scope yet. The attribution data model (evidence levels, click IDs kept admin-only) is designed so these slot in later |
| healthcare-leadgen-site | `anthropic-skills:healthcare-leadgen-site` | **Not applicable** | Excluded per the brief |

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
