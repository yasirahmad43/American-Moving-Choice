# Brief: Review methodology

## 1. Header

| Field | Value |
|---|---|
| Page file | `content/pages/trust/review-methodology.md` |
| URL | `/review-methodology/` |
| Family | Trust page (site architecture §1.2) |
| Status | draft-v0 |
| Date | 2026-10-28 |
| Author / reviewer | `{{page.author}}` / `{{page.reviewer}}` (brief §11 Q9); data owner n/a, since the page has no data block |

## 2. Purpose and reader

**Purpose.** Publish the review method that mover verification §6 ("Published Review Methodology page covering eligibility, verification labels, moderation, calculation and appeals") and site architecture §7.2 require. This page owns who can review, the evidence labels, invitations, moderation, ratings, minimum samples and AI summaries (content README §9). Every profile, review section and label chip links here (site architecture §3.2 Profile row; visual direction §9.4), so the page has to answer "can I trust this rating?" on its own.

**Readers.**
1. A person on a mover's profile deciding how much weight to give its rating and reviews. This is the main reader.
2. A person who got a review invitation and wants to know what happens to the review and the documents.
3. A mover checking what it can and can't do with reviews. The page covers only the consumer-facing facts. Mover detail belongs on `/for-movers/reviews-and-reputation/`.
4. Counsel, journalists and AI answer engines summarizing AMC's review practice. "American Moving Choice reviews" is one of the brand prompts in site architecture §7.7.

**Job.** Decide whether the reviews are real and fairly shown, know how to review and how to report a review, and see that payment doesn't buy ratings.

## 3. Search intent and target queries

There are none. This is a trust and entity page, and `docs/seo/keyword-to-page-map.csv` maps no keyword to `/review-methodology/`. The two nearby review queries are assigned to the mover directory. The CSV note says "Reviews live on profiles; directory explains review methodology", so this page supports those queries through links and doesn't compete for them.

| Keyword | Volume | KD | Mapped page | Relation to this page |
|---|---|---|---|---|
| moving company reviews | 880 | 43 | `/preferred-movers/` (directory; slug pending, site architecture §0 item 9) | Not targeted. The directory and profiles link here |
| moving companies reviews | 390 | 48 | `/preferred-movers/` (same) | Not targeted |

The brand prompt "American Moving Choice reviews" is in the AI-visibility sample (site architecture §7.7), not the keyword map, so it has no volume. If that prompt surfaces this page, nothing on it may read as a rating of AMC itself. The schema lint already fails any rating or review on AMC's own WebPage (site architecture §8.5).

## 4. Information gain

These are things a reader gets here that the reference sites did not give, at least on the pages captured.

| What this page gives | What the references showed | Sources |
|---|---|---|
| Reviews by AMC invitation only, through single-use links, with the reason (companies can't pick happy customers) | CMR and MyGoodMovers run open "Write a review" links. HomeGuide's pros ask their own customers, which together with its "Best of" badge rewards asking only happy ones | Implications D9, §4.4; matrix §3.5 (HomeGuide row), §5 item 11 |
| Three labels, each defined by what was proved and what it can rate, in a table | EnergySage shows an unexplained "Verified Customer" label. EnergySage, moveBuddha and MyGoodMovers say "verified" without saying what was proved. ConsumerAffairs confirms a person, not a move | Matrix §3.4 (EnergySage row), §3.5 (ConsumerAffairs row); implications §4.4 |
| Proof of a completed move from checked documents, not from the company's own job status | Only HireAHelper says every review comes from a paid move, and it can check that because it takes the payment. AMC uses purchase records plus checked documents instead | Matrix §3.5 (note under the table), §4 ("Evidence-based reviews" row) |
| Quote and move ratings kept apart, with no editorial score and nothing imported | moveBuddha imports reviews from "25+ sources" and blends in its own score. MyGoodMovers mixes in "third-party sources". CMR feeds reviews into an editorial 1-to-10 score, and Move.org publishes editorial ratings | Matrix §3.5; implications §4.4 |
| Full dates on every review, plus the latest date and a 12-month count beside each rating | No captured review showed a full date, and EnergySage's testimonials show only relative dates | Matrix §3.5 (note); implications §4.4, §8.3 |
| A minimum sample before any rank, "top" or "best" claim, with the reason | MyGoodMovers calls a mover with two reviews "BEST LOCAL MOVER". HomeGuide shows listings on 0 to 5 reviews | Matrix §3.4 (MyGoodMovers row), §3.5 (HomeGuide row), §4 ("No 'best' on thin samples"); implications D9, §4.4 |
| Public, dated replies, with a privacy warning before posting | Replies were seen only at HireAHelper | Matrix §3.5 (note); implications §4.4 |
| One rating record per experience type, so the figure can't drift between surfaces | Ratings or review counts drift at four of nine captured sites | Matrix §3.5 (note), §4 ("One rating record"); implications D8, §4.4 |
| On the review page itself: who pays, that every reviewed mover bought requests, that payment changes no rating, and why the reviews aren't called "independent" | No observed flow said how the site itself is paid. Paid or tied companies sit inside rankings at CMR, moveBuddha and Move.org | Matrix §3.1 (note), §5 item 5; compliance facts §4 |
| Why review count never sets the default order: invitations follow purchases | No reference stated this. It is AMC's own reasoning | Implications §4.4 (marked [inference]) |
| Reviews kept apart from the badge | HireAHelper's badge needs "10+ reviews and a 4-star rating" | Matrix §3.4 (HireAHelper row), §5 item 11; implications §4.3 |
| No ratings for AMC itself or its tools | Unpakt marks itself up as rated 4.2 from 36 on every captured page | Matrix §3.5 (Unpakt row); implications §6.5 |
| A threshold and a written policy before any AI summary, and a dated changelog | None observed in the reference review | Implications §4.4; site architecture §7.2 |

## 5. Outline

- H1 How reviews work on American Moving Choice (58-word answer: who can review, how reviews are checked, how ratings are calculated)
- H2 Who can review a mover
- H2 Does payment affect reviews?
- H2 How review invitations work
- H2 Two experiences, rated separately
- H2 How reviews are checked (label table)
- H2 No rewards for good reviews
- H2 How moderation works
- H2 What movers can and can't do
- H2 How ratings are calculated
  - H3 Minimum sample before any ranking
- H2 What we don't do
- H2 Where reviews appear
- H2 How to report a review
- H2 Changes to this method

The section on payment sits second on purpose. A reader who has just learned that only movers that bought a request can be reviewed will ask next whether those movers pay. The FTC platform guide also asks for material connections to be disclosed (compliance facts §4).

**Proposed stable anchors.** Set these as IDs in the CMS so that links survive edits to the headings, the same way site architecture §3.2 uses `/how-we-verify-movers/#badge`: `#who-can-review`, `#payment`, `#invitations`, `#experiences`, `#evidence-labels`, `#incentives`, `#moderation`, `#what-movers-can-do`, `#ratings`, `#minimum-sample`, `#what-we-dont-do`, `#where-reviews-appear`, `#report`, `#changes`.

**Schema.** `WebPage` and `BreadcrumbList` only. No `Review`, `AggregateRating` or `FAQPage` on this page (site architecture §8.5 and its lint).

## 6. Must-cover checklist

| Item | Covered under |
|---|---|
| Answer first: who can review, how reviews are checked, how ratings are calculated | H1 answer paragraph |
| Who can review: only consumers whose request a mover bought; invitation only, by single-use link from AMC; no open link; companies can't send or choose invitations | Who can review a mover (all four items); How review invitations work |
| Three evidence labels as a table; a purchased request alone never proves a completed move; a company marking a job Completed is not enough; unlabeled reviews not published | How reviews are checked (table; "A purchase isn't proof of a move"; "No label, no publication") |
| Two experience types rated separately and never blended | Two experiences, rated separately; What we don't do ("Blend ratings") |
| Invitations: quote-experience about `{{setting.quote_invite_delay_days}}` days after purchase, subject to contact preferences; move-experience under the [Owner] default with the current rule named | How review invitations work (both items, with the [Owner] marker); Who can review a mover (pointer marker) |
| Evidence: which documents count, moderation checks them, never published | How reviews are checked (table; "Documents are checked"; "Documents stay private") |
| Incentives: none conditioned on sentiment; disclosed on each review; offered whatever the rating | No rewards for good reviews |
| Moderation: published criteria; five rejection reasons; never rejected for being negative; every action logged | How moderation works |
| What companies can and can't do: no edits or deletion; owners and managers reply publicly, with a warning; report with a reason; both sides appeal | What movers can and can't do |
| Ratings: simple mean 1 to 5 per type; count, distribution, latest date, 12-month count; no hidden weighting; no rating until the first eligible review ("No customer reviews yet"); full dates | How ratings are calculated |
| Minimum sample: no rank, "top" or "best" claim and no rating-sort priority below `{{setting.rank_min_reviews}}`; no awards or "best" badges | Minimum sample before any ranking |
| What we don't do: import; blend; editorial score; rate AMC's own tools; filter excerpts by stars; sort by review count by default | What we don't do (six items) |
| AI summaries: none until a written policy exists and a company has `{{setting.ai_summary_min_reviews}}` reviews | What we don't do ("Summarize reviews with AI") |
| Paid relationship: every reviewed mover pays for requests; payment never changes which reviews appear or how ratings are calculated; not called independent; [Counsel] marker | Does payment affect reviews? |
| Where reviews appear: profile; separate page at `{{setting.reviews_subpage_min}}` eligible reviews | Where reviews appear |
| How to report a review | How to report a review |
| Versioned "Changes to this method" | Changes to this method (version table) |
| Page rule: explain reasons where they help trust | Reasons given for AMC sending invitations, for the post-move invitation, for the labels, for separate ratings, for the minimum sample, for no review-count sort, for keeping documents private and for listing reviews newest first |
| Page rule: label names exact; no bare "verified review" | Labels appear only by exact name. A scan of the draft found "verified" only inside the three label names |

## 7. Internal links

**Out**

| URL | Anchor | Status |
|---|---|---|
| `/which-companies-receive-my-request/` | Which companies receive my request | Planned (trust set, MVP scope M11) |
| `/advertising-disclosure/` | How AMC makes money | Planned |
| `/report-a-concern/` | report it; Report a concern | Planned (site architecture §1.2 Trust pages) |
| `/moving-cost-calculator/` | our cost calculator | Planned |
| `/how-we-verify-movers/` | How we verify movers | Planned (cluster pillar, site architecture §3.1) |

The page carries no B2B link or CTA (site architecture §1.1). Under publish checklist item 5, each link is held until its target is published and indexable.

**Expected in**

| From | Target | Basis |
|---|---|---|
| Every company profile (rating summary and reviews section) | `/review-methodology/` | Site architecture §3.2 Profile row; visual direction §13.6 |
| Every evidence-label chip | `#evidence-labels` | Visual direction §9.4 ("Each label links to the review methodology") |
| `/companies/{slug}/reviews/` pages | `/review-methodology/` | Site architecture §1.2 Company profile row |
| The review form `/companies/{slug}/review/` (noindex) and invitation emails | `/review-methodology/` | Site architecture §1.2 Utility row |
| Geo index `/movers/` | `/review-methodology/` | Site architecture §1.2 Geo index row ("links to the verification and review methods") |
| City pages with review excerpts | `#what-we-dont-do` (excerpt rule) | Site architecture §1.2 City page row |
| Directory sort rule | `#minimum-sample` | Site architecture §1.2 directory row |
| `/how-we-verify-movers/` (badge explainer: "Customer reviews are shown separately") | `/review-methodology/` | Site architecture §3.1; stored texts ST-5 |
| `/advertising-disclosure/` (payment never changes ratings) | `#payment` | Content README §9; ST-1a |
| `/editorial-policy/` (AI use) | `#what-we-dont-do` | Site architecture §7.2 |
| `/for-movers/reviews-and-reputation/` | `/review-methodology/` | Site architecture §1.2 B2B row |
| Footer (review policy) | `/review-methodology/` | Visual direction §9.10 |

That gives well over the three contextual inbound links that site architecture §3.3 rule 1 requires.

## 8. Decision dependencies

| Statement | Depends on | Default used in the draft | What changes if decided otherwise |
|---|---|---|---|
| "`{{setting.post_move_invite_days}}` days after the move date in your request, we send a second invitation … whatever the mover has recorded about your job" | Owner: implications §4.4 rule change to mover verification §6 (Collection). Also touches JTBD §4 J6 stage 1b, backlog 6.5.1 and 6.5.2, the data model §2 role matrix ("request reviews") and `review_invitations.requested_by` | AMC sends a post-move invitation `{{setting.post_move_invite_days}}` days (proposed 21) after the stated move date to everyone whose request was bought, whatever the CRM stage | **Current rule:** move-experience invitations go only to customers a company marks Booked or Completed, at the company's request. AMC sends them, logs every request and monitors for selective patterns, which can trigger an audit. The item is rewritten to say that, and it names the monitoring |
| "Movers can't send invitations or pick which customers get one" | Same | Same | Under the current rule, the item says movers can ask us to invite customers they have recorded as hired, that we send those invitations ourselves, log every request and watch for selective patterns. The "can't pick" claim then covers only the quote-experience invitation |
| "Every mover with reviews here has bought requests from us"; "We don't call our reviews 'independent'" | Counsel: compliance facts §4 question on whether the lead-fee relationship is a material connection to disclose next to ratings or rankings | Disclosed in this section and on "How AMC makes money"; no line beside each rating | A paid-relationship line may be needed beside every rating, on profiles, lists and excerpts. This section would then describe it |
| "We reject a review only for one of these reasons" | Owner: mover verification §6 lists the five reasons as examples ("e.g.") | The five reasons, presented as the complete list | New reasons join the list. If the list stays open-ended, "only" must go |
| One-line definitions of the five reasons | Owner: the "published content guidelines" (mover verification §6) are not written | Plain-language readings by the drafting agent | They are replaced by, or linked to, the approved guidelines |
| Excerpt rule ("a fixed rule chooses them") | Owner: implications §4.4; site architecture §1.2 City page row | A neutral rule with no star input, with its text not yet written | The rule text is added to this page before any excerpt renders. If excerpts don't ship, the item and the excerpt bullet under "Where reviews appear" are removed |
| "We never publish the documents themselves" | Owner: no AMC document states it for review evidence | Documents stay private | If redacted display were ever allowed, the item changes. Either way, mover verification §6 gains the rule |
| "Both sides can appeal"; "Either side can appeal a decision on a report" | Owner: mover verification §6 gives an appeal path for both sides on reports but no route, decider or timing | Appeal exists; route not stated | The route, who decides and the timing are named. Appeals against rejections at first moderation are added if adopted |
| Minimum sample `{{setting.rank_min_reviews}}` | Owner: implications §11 Q15 | 5 (token) | The token value changes; the copy stays as written |
| Movers may not offer incentives; replies must be truthful and private-safe | Counsel: mover agreement not drafted (consent draft §11 item 5) | The clause as summarized for counsel | The sentences follow the final agreement |
| "If we ever offer a reward for reviewing …" | Owner: whether any reviewer incentive exists at launch (mover verification §6, "if any incentive is ever offered") | None described | If an incentive launches, describe it here, show its disclosure on each review it applies to, and add a changelog row |
| Verified customer "can rate … including hiring the mover"; the quote and sales experience includes signing up | Owner: mover verification §6 gives Verified customer a "booking experience", but only two ratings exist | Booking is folded into the quote and sales experience | If booking gets its own rating, a third rating is added and "two experiences" changes throughout |

## 9. Source record

All rows were accessed on 2026-10-28. Paths are relative to the repository root. Short names: "mover verification" is `docs/business-rules/mover-verification-and-reviews.md`; "implications" is `docs/research/reference-review/implications-for-content-seo-design.md`; "site architecture" is `docs/seo/site-architecture.md`; "compliance facts" is `docs/research/compliance-and-platform-facts.md`; "consent draft" is `docs/business-rules/consent-and-disclosure-copy-draft.md`; "data model" is `docs/architecture/data-model.md`; "JTBD" is `docs/product/jtbd-and-journeys.md`; "backlog" is `docs/product/backlog.md`; "visual direction" is `docs/design/visual-direction.md`. "Verified" here means an AMC document supports the claim as written. It does not mean the owner has approved it. Undecided items carry markers on the page and appear in §8.

| id | question_or_claim | source_url | source_type | accessed_date | intent | answer_evidence | intended_page | status | verified_by / recheck_due |
|---|---|---|---|---|---|---|---|---|---|
| RM-01 | Only people whose move request a mover bought through AMC can review that mover | mover verification §6 (Evidence labels; Collection) | AMC policy | 2026-10-28 | informational | The lowest label needs "a request that this company bought through American Moving Choice"; unlabeled reviews aren't accepted at launch | /review-methodology/ (answer); #who-can-review | verified | drafting agent; human check pending / before publish |
| RM-02 | Reviews are by invitation only, through a single-use link AMC sends | mover verification §6 (Collection); implications §4.4 | AMC policy | 2026-10-28 | informational | "American Moving Choice sends the invitations"; "Secure single-use review links"; "The review form opens only with a single-use token" | /review-methodology/ (answer); #who-can-review | verified | drafting agent; human check pending / before publish |
| RM-03 | There is no open "Write a review" link; the form opens only from an invitation link | site architecture §1.2 (Utility row); implications §4.4 | AMC policy | 2026-10-28 | informational | "The review form opens only with a single-use invitation token; there is no open 'Write a review' link" | #who-can-review | verified | drafting agent; human check pending / before publish |
| RM-04 | Movers can't send invitations or pick who gets one; AMC sends every invitation so a company can't invite only happy customers | mover verification §6 (Collection); implications §4.4 | AMC policy | 2026-10-28 | informational | "AMC sends the invitations, not the company, so companies can't choose only happy customers." For move-experience invitations this holds only under the §4.4 default, because the current rule lets companies request them for customers marked Booked or Completed | #who-can-review | verified (default pending owner, §8) | drafting agent; human check pending / before publish |
| RM-05 | Reviewer contact details never appear with the review, and the mover gets none beyond what it bought | mover verification §6 (Collection) | AMC policy | 2026-10-28 | informational | "reviewer contact details are never shown publicly or to the company beyond what it already purchased" | #who-can-review | verified | drafting agent; human check pending / before publish |
| RM-06 | Movers in the network pay AMC for the move requests they buy | content/stored-texts.md ST-1a; consent draft §7 | AMC policy | 2026-10-28 | informational | "Movers in our network pay us for the move requests they choose to buy." | #payment | verified | drafting agent; human check pending / before publish |
| RM-07 | Every mover with reviews has bought requests from AMC | mover verification §6 (derived from RM-01) | AMC policy | 2026-10-28 | informational | A review needs a purchase by the reviewed company, so every reviewed company has bought at least one request. "Bought" rather than "paid" covers requests later credited | #payment | verified | drafting agent; human check pending / before publish |
| RM-08 | Payment never changes which reviews appear or how ratings are calculated; a mover can't pay to remove a review, raise its rating or change the order of its reviews | mover verification §4; consent draft §7; content/stored-texts.md ST-1a; compliance facts §4 (implications) | AMC policy | 2026-10-28 | informational | Paid placement "cannot change verification results, rating calculations or review visibility"; payment never changes "its ratings, how its reviews are shown"; "Never let a paying mover remove negative reviews. Don't let payment tier affect review display or order." | #payment | verified | drafting agent; human check pending / before publish |
| RM-09 | Buying more requests means more invitations, so more reviews may follow; review count is therefore never the default sort | implications §4.4 (Featuring and disclosure); site architecture §1.2 (directory row) | AMC policy | 2026-10-28 | informational | "invitations follow purchases, so review count stays out of default sorts [inference from mover verification §6]"; "no review-count default" | #payment; #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-10 | AMC doesn't call its reviews "independent"; they are reviews collected by AMC from people whose requests a mover bought | content/README.md §5; compliance facts §4 (16 CFR 465.6) | AMC policy | 2026-10-28 | informational | README: write "Reviews collected by American Moving Choice from consumers whose requests a mover bought", with the paid relationship stated. §465.6 bars misrepresenting independence. Counsel question on material connection stays open | #payment | verified (counsel item open) | drafting agent; human check pending / before publish |
| RM-11 | Each invitation is about one mover that bought the request and has its own single-use link | data model §8 (`review_invitations`: purchase_id, token_hash); mover verification §6 | AMC policy | 2026-10-28 | informational | Each invitation row is tied to one purchase, which is one company, and carries a token | #invitations | verified | drafting agent; human check pending / before publish |
| RM-12 | Quote-experience invitation about `{{setting.quote_invite_delay_days}}` days after a mover buys the request, if contact preferences allow | mover verification §6 (Collection); content/README.md §3 (token "About 7") | AMC policy | 2026-10-28 | informational | "Every consumer whose request was purchased gets a quote-experience invitation after a set delay (e.g. 7 days), subject to their contact preferences." | #invitations | verified | drafting agent; human check pending / before publish |
| RM-13 | The quote-experience invitation goes out whether or not the person hired the mover, so unhappy people are asked too, not only those a company would pick | mover verification §6 (Collection); backlog 6.5.1 | AMC policy | 2026-10-28 | informational | "Every consumer whose request was purchased"; "so that feedback is collected consistently, including from dissatisfied customers" | #invitations | verified | drafting agent; human check pending / before publish |
| RM-14 | AMC sends a second invitation `{{setting.post_move_invite_days}}` days after the move date in the request, whatever the mover has recorded | implications §4.4 (Invitation only); content/README.md §3 (token "Proposed 21") | AMC policy | 2026-10-28 | informational | "AMC sends a second, post-move invitation 21 days after the stated move date (proposed), whatever the CRM stage. This is a rule change." | #invitations | verified (proposed; owner decision pending, §8) | drafting agent; human check pending / before publish |
| RM-15 | Reason for the post-move invitation: a company can't decide whose move gets reviewed by how it records jobs | implications §4.4 | AMC policy | 2026-10-28 | informational | "The change keeps move reviews from depending on which customers a company marks" | #invitations | verified (proposed) | drafting agent; human check pending / before publish |
| RM-16 | Two experiences, each with its own rating, never blended into one score | mover verification §6 | AMC policy | 2026-10-28 | informational | "Quote-experience and move-experience ratings are shown separately and never blended." | #experiences; #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-17 | Each review is about one experience | data model §8 (`reviews.type`); JTBD §4 J6 stage 3 | AMC policy | 2026-10-28 | informational | One `type` per review; the consumer chooses "the quoting experience or an actual move" | #experiences | verified | drafting agent; human check pending / before publish |
| RM-18 | The quote and sales experience runs from first contact and estimate to signing up, if the reviewer hired the mover | mover verification §6 (table: "quoting/sales experience"; Verified customer: "Quoting experience, and booking experience") | AMC policy | 2026-10-28 | informational | A plain-language reading. Booking is folded into the quote and sales rating because only two ratings exist (§8, §10) | #experiences; #evidence-labels | to verify | owner to confirm / before publish |
| RM-19 | Every published review carries one of three labels; unlabeled reviews aren't published | mover verification §6 | AMC policy | 2026-10-28 | informational | "(no label) Not accepted for publication at launch." | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-20 | Verified platform inquiry: purchase and disclosure records; rates the quote and sales experience only | mover verification §6 (table) | AMC policy | 2026-10-28 | informational | "The reviewer is the consumer on a request that this company bought through American Moving Choice (purchase + disclosure records)." "The quoting/sales experience only" | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-21 | Verified customer: also a written estimate, order for service or deposit receipt from the mover, uploaded and checked | mover verification §6 (table) | AMC policy | 2026-10-28 | informational | "documentary evidence of a business relationship: a written estimate, order for service or deposit receipt from this company, uploaded by the reviewer and checked by moderation" | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-22 | Verified completed move: also a bill of lading, final invoice or delivery receipt, checked; rates the moving experience | mover verification §6 (table) | AMC policy | 2026-10-28 | informational | "evidence of completion (bill of lading, final invoice or delivery receipt) checked by moderation"; "The moving experience" | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-23 | Reviewers upload documents, and each is checked in moderation before a label is given | mover verification §6 (table); backlog 6.5.4 | AMC policy | 2026-10-28 | informational | "uploaded by the reviewer and checked by moderation"; "labels assigned only from collected evidence" | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-24 | Every rating of the moving experience rests on a checked completion document | mover verification §6 (table, derived) | AMC policy | 2026-10-28 | informational | Only Verified completed move can rate the moving experience | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-25 | Uploaded documents are never published | mover verification §5 (credentials shown "without exposing documents"), §6 (private-data rejection; contact details never shown) | AMC policy | 2026-10-28 | informational | No AMC document states this for review evidence. Inferred from the cited rules and listed in the task's must-cover; [Owner] marker on the page | #evidence-labels | to verify | owner to confirm / before publish |
| RM-26 | A purchase doesn't prove a move, and a mover marking a job "Completed" isn't enough | mover verification §6 | AMC policy | 2026-10-28 | informational | "A purchased lead alone never proves a completed move."; "A company marking a CRM lead 'Completed' is not sufficient on its own." | #evidence-labels | verified | drafting agent; human check pending / before publish |
| RM-27 | No incentive depends on sentiment; any reward is offered whatever the rating and disclosed on every review it applies to | mover verification §6 (Collection) | AMC policy | 2026-10-28 | informational | "No incentives conditioned on sentiment. If any incentive is ever offered (e.g. a prize draw for all reviewers), it is disclosed on every review it applies to and offered regardless of rating." | #incentives | verified | drafting agent; human check pending / before publish |
| RM-28 | Movers may not offer anything for a good review, and a consumer can report it | consent draft §11 item 5; JTBD §4 J6 (failure modes) | AMC policy | 2026-10-28 | informational | "no review gating, no incentives conditioned on sentiment, no fake reviews"; "prohibited and reportable". The mover agreement isn't drafted | #incentives | verified (counsel item open) | drafting agent; human check pending / before publish |
| RM-29 | Every review goes through moderation before publication, under the rules on the page | mover verification §6 (Moderation and integrity); JTBD §4 J6 stages 4 to 6 | AMC policy | 2026-10-28 | informational | "Published content guidelines"; moderation comes before publication in J6 | #moderation | verified | drafting agent; human check pending / before publish |
| RM-30 | Reviews are rejected only for no evidence, unrelated, abusive, private data or conflict of interest | mover verification §6 | AMC policy | 2026-10-28 | informational | "rejected only for policy reasons (e.g. no evidence, unrelated, abusive, private data, conflict of interest)". The list is given as examples | #moderation | verified (completeness pending owner, §8) | drafting agent; human check pending / before publish |
| RM-31 | One-line definitions of the five reasons | mover verification §6 (names only) | AMC policy | 2026-10-28 | informational | Plain-language readings by the drafting agent; the full content guidelines are not written | #moderation | to verify | owner to confirm / before publish |
| RM-32 | No review is rejected or removed for being negative | mover verification §6; compliance facts §4 (platform guide; §465.7) | AMC policy | 2026-10-28 | informational | "never for being negative"; "Removed reviews are excluded only under the published policy." | #moderation | verified | drafting agent; human check pending / before publish |
| RM-33 | Every moderation action is logged with its reason and moderator | mover verification §6 | AMC policy | 2026-10-28 | informational | "Every moderation action is audit-logged with reason and moderator." | #moderation | verified | drafting agent; human check pending / before publish |
| RM-34 | Movers can't edit, delete or hide a review or change its rating | mover verification §6, §8; backlog 6.5.6 | AMC policy | 2026-10-28 | informational | "Companies cannot edit or delete reviews."; acceptance test "Companies cannot alter reviews or suppress valid criticism" | #what-movers-can-do | verified | drafting agent; human check pending / before publish |
| RM-35 | Owners and managers can reply publicly, and replies are dated | mover verification §6; implications §8.3; backlog 6.5.5 | AMC policy | 2026-10-28 | informational | "They can respond publicly (owner/manager roles)"; "any dated reply"; the reply "appears under the review with my company name and date" | #what-movers-can-do | verified | drafting agent; human check pending / before publish |
| RM-36 | Repliers are warned before posting details the reviewer didn't share | implications §4.4 | AMC policy | 2026-10-28 | informational | "Owners and managers reply publicly, and are warned before posting details the reviewer did not share" | #what-movers-can-do | verified | drafting agent; human check pending / before publish |
| RM-37 | Mover terms require replies to be truthful and to leave out private information | consent draft §11 item 5 | AMC policy | 2026-10-28 | informational | "responses must be truthful and must not disclose customer private information" | #what-movers-can-do | verified (counsel item open) | drafting agent; human check pending / before publish |
| RM-38 | Movers can report a review with a reason, and moderators decide | mover verification §6 | AMC policy | 2026-10-28 | informational | "report a review with a reason. Reports go to admin moderation" | #what-movers-can-do; #report | verified | drafting agent; human check pending / before publish |
| RM-39 | The reviewer and the mover can both appeal a decision on a report | mover verification §6 | AMC policy | 2026-10-28 | informational | "with an appeal path for both sides" | #what-movers-can-do; #report | verified (route pending owner, §8) | drafting agent; human check pending / before publish |
| RM-40 | A rating is the simple average of 1-to-5 stars per experience; each review counts the same; no hidden weighting | mover verification §6 | AMC policy | 2026-10-28 | informational | "simple mean per experience type (1–5) … No hidden weighting." | /review-methodology/ (answer); #ratings | verified | drafting agent; human check pending / before publish |
| RM-41 | An eligible review is published, labeled and not removed | mover verification §6 (derived) | AMC policy | 2026-10-28 | informational | Unlabeled reviews aren't accepted; "Removed reviews are excluded only under the published policy" | #ratings | verified | drafting agent; human check pending / before publish |
| RM-42 | Each rating is shown with count, distribution, latest review date and 12-month count | mover verification §6; implications §4.4 | AMC policy | 2026-10-28 | informational | "with review count, distribution and dates"; "the summary shows the latest date and a 12-month count" | #ratings | verified | drafting agent; human check pending / before publish |
| RM-43 | Every review shows a full date, never a relative one | implications §4.4; site architecture §7.3; content/README.md §4 | AMC policy | 2026-10-28 | informational | "Reviews carry full dates"; "No relative dates" | #ratings | verified | drafting agent; human check pending / before publish |
| RM-44 | A rating appears from the first eligible review of that experience | implications §4.4; mover verification §6 | AMC policy | 2026-10-28 | informational | "Show the mean from the first review."; "displayed only when at least one eligible review exists" | #ratings | verified | drafting agent; human check pending / before publish |
| RM-45 | With no eligible review, the profile shows "No customer reviews yet", never empty stars or 0.0 | mover verification §5, §6; visual direction §9.4 | AMC policy | 2026-10-28 | informational | "otherwise the profile says 'No customer reviews yet'"; "No stars and no '0.0'." | #ratings | verified | drafting agent; human check pending / before publish |
| RM-46 | A review leaves a rating only if removed under the published rules | mover verification §6 | AMC policy | 2026-10-28 | informational | "Removed reviews are excluded only under the published policy." | #ratings | verified | drafting agent; human check pending / before publish |
| RM-47 | Below `{{setting.rank_min_reviews}}` eligible reviews of an experience: no rank, "top" or "best" claim, and no rating-sort priority | implications §4.4, §11 Q15; site architecture §1.2 (directory row), §2.4 rule 3; content/README.md §3 | AMC policy | 2026-10-28 | informational | "Allow no 'top', 'best', rank or rating-sort priority under 5 eligible reviews of that type."; "A rating sort gives no priority to a company with fewer than 5 eligible reviews of that type" | #minimum-sample | verified (value pending owner, §11 Q15) | drafting agent; human check pending / before publish |
| RM-48 | Reason for the minimum sample: a rating on a few reviews can swing with the next one | implications D9; reference matrix §4 ("No 'best' on thin samples") | AMC policy | 2026-10-28 | informational | The rule answers "best" claims on two reviews (MyGoodMovers). The sentence states the reason in plain words | #minimum-sample | verified | drafting agent; human check pending / before publish |
| RM-49 | No awards or "best" badges | implications §4.4, §7.3; mover verification §5 | AMC policy | 2026-10-28 | informational | "No 'best' chips or awards at launch."; "No awards"; never shown without evidence: "awards, or 'top-rated'" | #minimum-sample | verified | drafting agent; human check pending / before publish |
| RM-50 | No reviews or ratings imported from Google, Yelp, BBB, Trustpilot or elsewhere | implications §4.4; compliance facts §4 (implications) | AMC policy | 2026-10-28 | informational | "No Google, Yelp, BBB or Trustpilot reviews go into AMC ratings or markup"; "Don't import movers' Google or Yelp reviews"; invitation-only collection | #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-51 | No editorial score, grade or composite | implications §4.4; site architecture §1.2 (Comparison row) | AMC policy | 2026-10-28 | informational | "No editorial composite"; "no composite score" | #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-52 | No ratings for AMC or its own tools | implications §4.4; site architecture §8.5; compliance facts §5 | AMC policy | 2026-10-28 | informational | "no rating on AMC's own tools"; Never: "ratings for AMC itself"; self-serving review markup is ineligible | #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-53 | Excerpts, such as on city pages, follow a fixed rule with no star input, published here before any excerpt appears | implications §4.4; site architecture §1.2 (City page row) | AMC policy | 2026-10-28 | informational | "Excerpts follow a published neutral rule with no star filter."; "neutral review excerpts under a published rule with no star filter" | #what-we-dont-do; #where-reviews-appear | verified (rule text pending owner, §8) | drafting agent; human check pending / before publish |
| RM-54 | No AI summaries until a written policy is on this page and a mover has at least `{{setting.ai_summary_min_reviews}}` reviews | site architecture §7.2; implications §4.4; content/README.md §3 | AMC policy | 2026-10-28 | informational | The methodology covers "a written policy for any AI review summary, which needs at least 10 reviews" | #what-we-dont-do | verified | drafting agent; human check pending / before publish |
| RM-55 | Reviews appear on the profile, and on a separate reviews page once a mover has `{{setting.reviews_subpage_min}}` eligible reviews | site architecture §1.2 (Company profile row), §2.1; content/README.md §3 | AMC policy | 2026-10-28 | informational | "`/companies/{slug}/reviews/` only once the company has 10 eligible reviews (until then, reviews sit on the profile)" | #where-reviews-appear | verified | drafting agent; human check pending / before publish |
| RM-56 | Reviews on a profile are listed newest first by default, so low ratings aren't buried | visual direction §13.6 | AMC policy | 2026-10-28 | informational | "Sorted by most recent by default, so negatives aren't buried." | #where-reviews-appear | verified | drafting agent; human check pending / before publish |
| RM-57 | Reviews and ratings play no part in the badge | implications §4.3; mover verification §4 | AMC policy | 2026-10-28 | informational | The badge "takes no review, rating, tenure or spend input"; "Customer reviews are shown separately." | #where-reviews-appear | verified | drafting agent; human check pending / before publish |
| RM-58 | A report through Report a concern opens a case with an assignee, a target time and a recorded outcome | mover verification §7; data model §8 (`cases`) | AMC policy | 2026-10-28 | informational | "Each report creates a case with an SLA, an assignee and an outcome" | #report | verified | drafting agent; human check pending / before publish |
| RM-59 | Movers report reviews from their account, giving a reason | mover verification §6; backlog 6.5.6 | AMC policy | 2026-10-28 | informational | "report a review with a reason"; the portal user story in 6.5.6 | #report | verified | drafting agent; human check pending / before publish |
| RM-60 | Support can be reached by email | mover verification §7 | AMC policy | 2026-10-28 | informational | "Accessible support contact (email, phone, web form) on every page footer". The address is `{{org.support_email}}`, still missing (brief §11 Q1) | #report | verified | drafting agent; human check pending / before publish |
| RM-61 | Method changes are recorded on this page, each with its date | site architecture §7.3 (earned dates); implications §4.3 (a versioned text with a changelog, for verification) | AMC policy | 2026-10-28 | informational | No AMC document sets a changelog for this page. The task asks for one, and the cited rules support it by analogy | #changes | to verify | owner to confirm / before publish |

## 10. Open items

1. **Post-move invitation (owner).** This is the main decision (§8, row 1). Adopting it also changes mover verification §6, JTBD §4 J6 stage 1b, backlog 6.5.1 and 6.5.2, the data model §2 role matrix ("request reviews" for owners and managers) and `review_invitations.requested_by`.
2. **Which move date starts the post-move count.** The survey accepts a date or a flexible range (implications §2.1 step 3). Decide which date starts the `{{setting.post_move_invite_days}}` count when a range is given.
3. **Post-move invitations on shared requests.** Does every mover that bought a shared request trigger its own post-move invitation, or only one? The page says each invitation is about one mover and doesn't say how many arrive.
4. **What a review shows about its writer.** Implications §8.3 proposes first name and initial and the states involved. No rule is adopted, so the page is silent.
5. **Failed or missing evidence.** No document says what happens when an uploaded document fails the check, or when a move review arrives with only purchase evidence. Backlog 6.5.4 publishes the latter as Verified platform inquiry, but it doesn't say which rating its stars feed.
6. **The "booking experience".** Mover verification §6 gives Verified customer a "booking experience", but only two ratings exist. The draft folds booking into the quote and sales experience (§8, last row). Also confirm whether a Verified completed move reviewer may rate the quote experience, in the same review or a second one.
7. **Rating display precision.** Rounding (for example to one decimal) isn't set. One record per experience type feeds every surface and the JSON-LD (implications §4.4), so set it once.
8. **Content guidelines.** Mover verification §6 promises published content guidelines. They aren't written, and the page's one-line definitions are placeholders (§8).
9. **The neutral excerpt rule** is not written (§8).
10. **Appeals.** The route, the decider and the timing aren't set, and neither is whether reviewers can appeal rejections at first moderation (§8).
11. **Reviewer incentives at launch.** Confirm whether there are none (§8).
12. **Reviews of suspended movers.** A suspended profile returns 200 with a notice and `noindex` (site architecture §2.5). Decide whether its reviews and ratings stay visible there.
13. **Reviewer edits and withdrawal.** Can a reviewer edit or withdraw a published review? Nothing is decided, so the page is silent.
14. **Evidence privacy rule.** Add "uploaded review evidence is never published" to mover verification §6 (§8).
15. **Reporting channel.** `/report-a-concern/` isn't drafted yet. Confirm that a review report sent to `{{org.support_email}}` also opens a case. The page doesn't claim it does.
16. **Label names in compliance facts.** Compliance facts §4 still says "Verified quote request". Implications §4.4 and §10 rename it to "Verified platform inquiry", which is the name mover verification §6 and this page use.
17. **Directory slug.** The keyword map's directory rows still point to `/preferred-movers/` (site architecture §0 item 9). The directory's link to `#minimum-sample` depends on that slug.
18. **Material connection (counsel).** Counsel decides whether a paid-relationship line must sit beside each rating (§8; compliance facts §4).
19. **The FTC guide is left off the page on purpose.** The page doesn't cite the FTC rule or the platform guide, because the facts on them come from search excerpts (compliance facts, "How this was researched") and would need [Verify] markers, and because naming the regulator risks reading as borrowed authority (visual direction §3). Counsel may still want a link added.
20. **Changelog governance.** Decide the version numbering and who approves a change to the method before a new row publishes.
