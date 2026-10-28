---
id: trust-review-methodology
url: /review-methodology/
family: Trust page
title: "Review Methodology | American Moving Choice"
meta_description: "Only people whose request a mover bought through us can review that mover, by our invitation. See our three evidence labels and how 1-to-5 ratings work."
h1: "How reviews work on American Moving Choice"
breadcrumb: "Home › Review methodology"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: n/a
ai_assisted: true
ai_role: drafted
stored_texts: []
tokens: [page.author, page.reviewer, setting.quote_invite_delay_days, setting.post_move_invite_days, setting.rank_min_reviews, setting.ai_summary_min_reviews, setting.reviews_subpage_min]
depends_on:
  - "Owner: post-move review invitation, a rule change to mover verification §6 (implications §4.4), sent under the same contact-preference rule as the quote invitation; also which date starts the count when a request gives a date range, and whether each mover that bought a shared request triggers its own invitation"
  - "Owner: whether company-requested move-experience invitations continue beside the post-move invitation; implications §4.4 doesn't propose ending them (mover verification §6; backlog 6.5.2)"
  - "Owner: Verified customer's 'booking experience' folded into the quote and sales rating (mover verification §6)"
  - "Owner: what happens to a move review whose label can't rate the moving experience (mover verification §6; backlog 6.5.3, 6.5.4)"
  - "Owner: what one experience's rating slot shows when only the other experience has eligible reviews (mover verification §6; visual direction §9.4)"
  - "Owner: whether a reviewer can edit or withdraw a published review (no AMC document decides it)"
  - "Owner: minimum sample before any rank or 'top' claim (implications §11 Q15; setting.rank_min_reviews)"
  - "Owner: whether the five rejection reasons are the complete list (mover verification §6)"
  - "Owner: content guidelines not written; the five reason definitions are placeholders (mover verification §6)"
  - "Owner: the neutral excerpt rule, not yet written (implications §4.4; site architecture §1.2)"
  - "Owner: uploaded review evidence is never published (no AMC document states it yet)"
  - "Owner: appeal route, decider, timing and scope (mover verification §6)"
  - "Owner: whether any reviewer incentive exists at launch (mover verification §6)"
  - "Owner: whether a suspended mover's profile keeps showing its reviews and ratings (site architecture §2.5)"
  - "Owner: the evidence documents for Verified customer and Verified completed move; mover verification §6 and data model `review_evidence` still name the order for service and an unsigned bill of lading (consumer-moving-rules C12; How movers charge)"
  - "Build: invitation-coverage monitoring of company review requests, and the 12-month count beside ratings (implications §9.7, §4.4; not in build plan §7.5)"
  - "Owner: changelog numbering, and who approves a change to this method (editorial policy brief §10 item 6)"
  - "Counsel: material-connection disclosure beside ratings, and how to treat the effect of purchase volume on review counts and rating-sort eligibility against ST-1a, ST-1b and ST-3 (compliance facts §4)"
  - "Counsel: mover-agreement clauses on review incentives and replies (consent draft §11 item 5)"
last_updated: null
---

# How reviews work on American Moving Choice

Only people whose move request a mover bought through American Moving Choice can review that mover, and only through a single-use link we send. We check each review against our purchase records and any uploaded documents, and label it by what they prove. Ratings are a simple 1-to-5 average, calculated separately for the quote experience and the move.

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies (content/pages/trust/editorial-policy.md, "How we tell you"; README §2)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown (editorial policy, "How we tell you")]

## Who can review a mover?

You can review a mover only if it bought your move request through American Moving Choice. [Which companies receive my request](/which-companies-receive-my-request/) explains how a mover comes to buy a request.

- **Invitation only.** We send each invitation with a link that works once, and the review form opens only from that link. [Build: the review form at /companies/{slug}/review/ opens only with a valid single-use invitation token, refuses a reused token, and no public page links to an open form (site architecture §1.2 Utility row; backlog 6.5.3)]
- **No open review link.** There's no "Write a review" button anywhere on our site, so no one can post a review without an invitation.
- **Movers don't send invitations.** We send every invitation ourselves. A mover can ask us to invite customers it has recorded as hiring it, and we log and watch those requests, as [How review invitations work](#invitations) explains.
- **Your contact details stay private.** They never appear with your review, and the mover gets no contact details beyond those it received when it bought your request.

<a id="payment"></a>

## Does payment affect reviews?

Movers in our network pay us for the move requests they buy. Because you can only review a mover that bought your request, every mover with reviews here has bought requests from us.

Payment never changes which submitted reviews we publish or how ratings are calculated. A mover can't pay to remove a review, raise its rating or change the order of its reviews.

Buying more requests does mean more people are invited to review that mover, so it may collect more reviews. That's why we never sort movers by review count by default.

We don't call our reviews "independent," because the movers being reviewed pay us. They're reviews collected by American Moving Choice from people whose requests a mover bought. [Counsel: compliance facts §4 asks whether movers' request fees are a material connection that must be disclosed next to ratings or rankings. Confirm this section, the "independent" sentence, and whether a short paid-relationship line belongs beside each rating on profiles and lists. Also decide how to treat the effect of buying more requests: more invitations can bring more reviews, which moves a mover's rating values and how soon it reaches the {{setting.rank_min_reviews}} eligible reviews needed for rating-sort priority (see "Minimum sample before any ranking"). ST-1a, ST-1b and ST-3, and How AMC makes money, say buying never changes a mover's ratings or where it appears; the ST-1 and ST-3 notes in content/stored-texts.md put this to counsel with proposed variants (brief §8)] [How AMC makes money](/advertising-disclosure/) explains who pays us and what payment never changes.

<a id="experiences"></a>

## Two experiences, rated separately

Each review is about one of two experiences, and each experience has its own rating:

- **The quote and sales experience:** how the mover dealt with you before the move, from its first contact and estimate to the point you hired it, if you did. [Owner: mover verification §6 gives Verified customer a "booking experience", but only two ratings exist, so hiring the mover is folded into the quote and sales experience — default shown (brief §8; §10 item 6)]
- **The moving experience:** the move itself.

We never blend the two into one overall score. A mover can be good at quoting and poor at moving, or the reverse, and a single number would hide that.

<a id="invitations"></a>

## How review invitations work

Each invitation is about one mover that bought your request, and each comes with its own single-use link.

- **After a mover buys your request.** About {{setting.quote_invite_delay_days}} days after a mover buys your request, we invite you to review the quote and sales experience with that mover, if your contact preferences allow it. We do this whether or not you hired the mover, so people who were unhappy are asked too, not only the ones a company would pick.
- **After your move date.** {{setting.post_move_invite_days}} days after the move date in your request, we send a second invitation, if your contact preferences allow it. It lets you review the move itself, if you moved with that mover. We send it whatever the mover has recorded about your job, so a company can't decide whose move gets reviewed by how it records its jobs. [Owner: post-move invitation, a rule change to mover verification §6 (implications §4.4). The default sends it under the same contact-preference rule as the quote invitation. Also decide which date starts the count when a request gives a date range rather than one date (implications §2.1 step 3), and whether each mover that bought a shared request triggers its own post-move invitation (brief §10 items 2 and 3). If the current rule stays, delete this item: "When a mover asks" already describes the current rule — default shown (implications §4.4)]
- **When a mover asks.** Once a mover has recorded that you hired it, or that your move is done, it can ask us to invite you to review your move. We send that invitation ourselves. We log every request and watch for signs that a mover is choosing whom to invite, such as asking about only a small share of the customers it has recorded as hiring it. Signs like that can trigger an audit. [Build: log each company review request and show invitation coverage per company in admin, with a threshold that opens a case (mover verification §6; implications §9.7; not in build plan §7.5)] [Owner: implications §4.4 adds the post-move invitation but doesn't end company-requested move-experience invitations (mover verification §6 Collection; JTBD §4 J6 stage 1b; backlog 6.5.2). Ending them would be a separate owner decision that §4.4 doesn't propose. If it's made, delete this item and the second sentence of "Movers don't send invitations" under "Who can review a mover?", and record the change under "Changes to this method" (brief §8)]

## How are reviews checked?

Every published review carries one of three evidence labels. The label tells you what we could prove about the reviewer's dealings with the mover, so you can decide how much weight to give the review.

| Label | What proves it | What it can rate |
|---|---|---|
| Verified platform inquiry | Our records show the reviewer sent the request and this mover bought it through American Moving Choice. | The quote and sales experience only |
| Verified customer | All of the above, plus a document from this mover showing the reviewer did business with it: a written estimate or a deposit receipt. [Owner: mover verification §6 also lists an order for service, which FMCSA's 2022 rule removed for interstate moves (consumer-moving-rules note C12). Confirm the list, and whether a bill of lading signed before loading should count here — default shown] | The quote and sales experience, up to the point the reviewer hired the mover, if they did [Owner: hiring folded into the quote and sales experience, as under "Two experiences, rated separately" — default shown] |
| Verified completed move | All of the above, plus evidence the move was completed: a bill of lading signed at delivery, a final invoice or a delivery receipt. | The moving experience |

[Owner: mover verification §6 and data model `review_evidence` still name the order for service and an unsigned bill of lading; change them with this page (consumer-moving-rules C12; How movers charge, whose documents table has the bill of lading signed before loading and again at delivery)]

- **Documents are checked.** Reviewers upload documents themselves, and each document is checked in moderation before the label is given. Only Verified completed move reviews count toward a moving-experience rating, so every such rating rests on checked evidence that the move was completed. [Build: labels come only from collected evidence, and the label shown always matches the evidence record (mover verification §8; backlog 6.5.4)]
- **Documents stay private.** We never publish the documents themselves, because they often carry private details such as addresses and prices. [Owner: no AMC document says uploaded review evidence stays private. Confirm and add it to mover verification §6 — default shown (by analogy with mover verification §5, "without exposing documents", and §6, contact details never shown)]
- **A purchase isn't proof of a move.** A mover buying your request doesn't show that you moved with it, and neither does a mover marking your job "Completed" in its own records. Verified completed move needs a checked bill of lading signed at delivery, final invoice or delivery receipt, in addition to the document that Verified customer needs. [Build: a CRM "Completed" stage alone never yields Verified completed move (mover verification §6, §8; backlog 6.5.4)]
- **No label, no publication.** We don't publish a review that doesn't qualify for one of these labels.

## No rewards for good reviews

We never offer anything in return for a positive review, and nothing we offer depends on the rating you give or what you write. If we ever offer a reward for reviewing, it will be offered whatever your rating, and every review it applies to will say so.

Movers in our network may not offer you anything for a good review either. If one does, please report it through [Report a concern](/report-a-concern/). [Counsel: the mover agreement isn't drafted. Consent draft §11 item 5 lists "no review gating, no incentives conditioned on sentiment, no fake reviews" for counsel to word]

## How moderation works

Every review goes through moderation before it's published, under the rules on this page. We reject a review only for one of these reasons: [Owner: mover verification §6 gives these five reasons as examples ("e.g."). Confirm the list is complete, or add reasons, before "only for one of these reasons" publishes. The full content guidelines, including what counts as abusive, are not yet written]

- **No evidence:** we can't tie it to a request this mover bought through us.
- **Unrelated:** it isn't about this mover or the writer's dealings with it.
- **Abusive:** it contains threats, harassment or hateful language.
- **Private data:** it shares someone's personal details, such as a phone number or home address.
- **Conflict of interest:** the writer has a tie to the mover or to a competitor, such as working for one.

We never reject or remove a review for being negative, and we apply the same rules to positive and negative reviews. Every moderation action is logged with its reason and the moderator who took it. [Build: every moderation action writes a log entry with reason and moderator (mover verification §6)]

<a id="what-movers-can-do"></a>

## What movers can and can't do

- **They can't change reviews.** Movers can't edit, delete or hide a review, or change its rating. [Build: companies have no write access to reviews through any endpoint; permission tests per mover verification §8 ("cannot alter reviews or suppress valid criticism") and backlog 6.5.6]
- **They can reply in public.** A mover's owner or manager can post a public reply, which appears under the review with its date. Before a reply posts, they're warned not to include details the reviewer didn't share, such as contact details or addresses. Our mover terms also require replies to be truthful and to leave out customers' private information. [Build: show the warning before any reply posts, and date every reply (implications §4.4, §8.3; backlog 6.5.5)] [Counsel: consent draft §11 item 5 says replies "must be truthful and must not disclose customer private information"; the wording follows the final mover agreement]
- **They can report a review.** A mover that believes a review breaks our rules can report it from its account, giving a reason. The report goes to our moderators, who decide.
- **Both sides can appeal.** When we decide on a report, the reviewer and the mover can each appeal the decision. [Owner: mover verification §6 gives both sides an appeal path on reports but sets no route, decider or timing. Decide those, and whether a reviewer can also appeal a rejection made at first moderation]

## How are ratings calculated?

A mover has up to two ratings, one for each experience. Each is built from that experience's eligible reviews: published reviews that haven't been removed under the rules on this page and that carry a label that can rate that experience. [Build: a review's stars count only toward an experience its label can rate, so only Verified completed move reviews feed the moving-experience rating, and a move review with purchase evidence only never does (mover verification §6; backlog 6.5.4)] [Owner: decide what happens to a move review whose label can't rate the moving experience, because its only evidence is the purchase or an estimate or deposit receipt. Backlog 6.5.3 makes proof optional, and 6.5.4 publishes a purchase-only review as Verified platform inquiry, which can rate only the quote and sales experience (mover verification §6). Decide whether it's published without counting toward either rating, held until evidence arrives, or handled another way, and say so here. Also confirm that a Verified completed move label can rate the quote and sales experience too (brief §8; §10 item 6)]

- **A simple average.** The rating is the plain average of reviewers' own 1-to-5 star ratings. Every eligible review counts the same, and there's no hidden weighting.
- **Shown with context.** Next to each rating we show how many eligible reviews it comes from, how those reviews spread across 1 to 5 stars, the date of the latest one and how many arrived in the last 12 months. [Build: the 12-month count comes from the same rating record (implications §4.4)]
- **Full dates.** Every review shows its full date, with month, day and year, never "3 months ago."
- **From the first review.** A rating appears as soon as a mover has one eligible review of that experience. The count beside it shows how much the rating rests on.
- **No placeholder ratings.** A mover with no eligible reviews shows "No customer reviews yet" in place of a rating. We never show empty stars or a 0.0. [Build: no stars, "0.0" or count render without an eligible review, and one rating record per experience type feeds every surface (mover verification §8; implications §4.4)] [Owner: what one experience's rating slot shows when the mover has eligible reviews of the other experience only. Mover verification §6 and visual direction §9.4 define one empty state per profile (brief §8)]
- **Removals.** A review leaves a rating only if it's removed under the rules on this page. [Owner: whether a reviewer can edit or withdraw a published review. No AMC document decides it. If withdrawal is allowed, add it to this page as a removal rule (brief §8)]

<a id="minimum-sample"></a>

### Minimum sample before any ranking

A rating built on a few reviews can change a lot with the next one. So until a mover has at least {{setting.rank_min_reviews}} eligible reviews of an experience, sorting a list by that rating gives the mover no priority.

We publish no rankings or "best" lists, and we give movers no awards or "best" badges. If we ever add any, no mover will be ranked, or called "top" or "best", on a rating with fewer than {{setting.rank_min_reviews}} eligible reviews of that experience, and we'll record the change under [Changes to this method](#changes). [Build: rating sorts, ranks and any "top" wording check {{setting.rank_min_reviews}} per experience type (site architecture §1.2 directory row, §2.4 rule 3)]

<a id="what-we-dont-do"></a>

## What we don't do

- **Import reviews.** We don't bring in reviews or ratings from review sites, search engines or anywhere else. Every review here came through one of our invitations.
- **Blend ratings.** We keep the quote and moving ratings apart, as [Two experiences, rated separately](#experiences) explains.
- **Add our own score.** We don't publish an editorial score or grade, or mix our opinion into customer ratings.
- **Rate ourselves.** We don't show ratings for American Moving Choice or for our own tools, such as [our cost calculator](/moving-cost-calculator/).
- **Pick excerpts by stars.** Where short excerpts from reviews appear, such as on city pages, a fixed rule chooses them, and the star rating plays no part. The rule will be published on this page before any excerpt appears. [Owner: no excerpt rule is written yet. Write it, add it to this page and remove this line before any excerpt renders (implications §4.4; site architecture §1.2 City page row)]
- **Sort by review count.** We never order lists of movers by review count by default. [Does payment affect reviews?](#payment) explains why.
- **Summarize reviews with AI.** We don't publish AI-written summaries of reviews. We won't until a written policy for them is added to this page, and then only for a mover with at least {{setting.ai_summary_min_reviews}} reviews.

## Where reviews appear

- **On the mover's profile**, with its ratings. Reviews are listed newest first by default, so low ratings aren't buried. [Build: profile and reviews page list newest first by default, with no star-based default sort (visual direction §13.6)] [Owner: whether a suspended mover's profile, which stays online with a status notice (site architecture §2.5), keeps showing its reviews and ratings. Decide, then say so here (brief §8)]
- **On a separate reviews page**, once a mover has {{setting.reviews_subpage_min}} eligible reviews. Until then, all of its reviews are on its profile. [Build: /companies/{slug}/reviews/ exists only at {{setting.reviews_subpage_min}} eligible reviews (site architecture §1.2 Company profile row, §2.1)]
- **As short excerpts** on some pages, such as city pages, under the excerpt rule in [What we don't do](#what-we-dont-do).

Reviews and ratings play no part in the badge a mover gets for passing our checks. [How we verify movers](/how-we-verify-movers/) lists those checks.

## How do I report a review?

If you think a review breaks the rules on this page, tell us through [Report a concern](/report-a-concern/). Say which review it is and which rule you think it breaks.

Each report made through Report a concern opens a case. Someone on our team is assigned to it, it has a target time for a decision, and the outcome is recorded. [Build: each report made through Report a concern opens a case with an assignee, a target time and a recorded outcome (mover verification §7; data model §8 `cases`, `review_reports`)]

Reports from movers, and appeals by either side, are covered under [What movers can and can't do](#what-movers-can-do).

<a id="changes"></a>

## Changes to this method

When we change how reviews are collected, checked, shown or rated, we update this page and record the change here with its date.

| Version | Date | What changed |
|---|---|---|
| 1 | Set on first publish | First published |

[Build: the CMS renders each row's version and date from the page record, and stamps the date when an approved change publishes, the first on the first approved publish (README §2 `last_updated`)] [Owner: changelog numbering, and who approves a change to this method before a new row publishes. The draft numbers versions 1, 2, 3, and the pattern for all trust pages is still open (editorial policy brief §10 item 6) — default shown (brief §8)]
