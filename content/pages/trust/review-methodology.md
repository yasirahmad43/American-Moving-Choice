---
id: trust-review-methodology
url: /review-methodology/
family: Trust page
title: "Review Methodology | American Moving Choice"
meta_description: "Only people whose move request a mover bought can review it. See our three evidence labels, moderation rules and how 1-to-5 ratings are calculated."
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
stored_texts: []
tokens: [setting.quote_invite_delay_days, setting.post_move_invite_days, setting.rank_min_reviews, setting.ai_summary_min_reviews, setting.reviews_subpage_min, org.support_email]
depends_on:
  - "Owner: post-move review invitation, a rule change to mover verification §6 (implications §4.4)"
  - "Owner: minimum sample before any rank or 'top' claim (implications §11 Q15; setting.rank_min_reviews)"
  - "Owner: whether the five rejection reasons are the complete list (mover verification §6)"
  - "Owner: the neutral excerpt rule, not yet written (implications §4.4; site architecture §1.2)"
  - "Owner: uploaded review evidence is never published (no AMC document states it yet)"
  - "Owner: appeal route, decider, timing and scope (mover verification §6)"
  - "Counsel: material-connection disclosure beside ratings (compliance facts §4)"
  - "Counsel: mover-agreement clauses on review incentives and replies (consent draft §11 item 5)"
last_updated: null
---

# How reviews work on American Moving Choice

Only people whose move request a mover bought through American Moving Choice can review that mover, and only through a single-use link we send. We check each review against our purchase records and any uploaded documents, and label it by what they prove. Ratings are a simple 1-to-5 average, calculated separately for the quote experience and the move.

## Who can review a mover

You can review a mover only if it bought your move request through American Moving Choice. [Which companies receive my request](/which-companies-receive-my-request/) explains how a mover comes to buy a request.

- **Invitation only.** We send each invitation with a link that works once, and the review form opens only from that link. [Build: the review form at /companies/{slug}/review/ opens only with a valid single-use invitation token, refuses a reused token, and no public page links to an open form (site architecture §1.2 Utility row; backlog 6.5.3)]
- **No open review link.** There's no "Write a review" button anywhere on our site, so no one can post a review without an invitation.
- **Movers don't choose who's invited.** Movers can't send invitations or pick which customers get one. We send every invitation ourselves, so a company can't invite only the customers it expects to be happy. [Owner: true only under the post-move invitation default in "How review invitations work". Under the current rule, movers ask us to invite customers they mark Booked or Completed — default shown (implications §4.4)]
- **Your contact details stay private.** They never appear with your review, and the mover gets no contact details beyond those it received when it bought your request.

## Does payment affect reviews?

Movers in our network pay us for the move requests they buy. Because you can only review a mover that bought your request, every mover with reviews here has bought requests from us.

Payment never changes which reviews appear or how ratings are calculated. A mover can't pay to remove a review, raise its rating or change the order of its reviews.

Buying more requests does mean more people are invited to review that mover, so it may collect more reviews. That's why we never sort movers by review count by default.

We don't call our reviews "independent," because the movers being reviewed pay us. They're reviews collected by American Moving Choice from people whose requests a mover bought. [Counsel: compliance facts §4 asks whether movers' request fees are a material connection that must be disclosed next to ratings or rankings. Confirm this section, the "independent" sentence, and whether a short paid-relationship line belongs beside each rating on profiles and lists] [How AMC makes money](/advertising-disclosure/) explains who pays us and what payment never changes.

## How review invitations work

Each invitation is about one mover that bought your request, and each comes with its own single-use link.

- **After a mover buys your request.** About {{setting.quote_invite_delay_days}} days after a mover buys your request, we invite you to review the quote and sales experience with that mover, if your contact preferences allow it. We do this whether or not you hired the mover, so people who were unhappy are asked too, not only the ones a company would pick.
- **After your move date.** {{setting.post_move_invite_days}} days after the move date in your request, we send a second invitation, so you can review the move itself if you moved with that mover. We send it whatever the mover has recorded about your job, so a company can't decide whose move gets reviewed by how it records its jobs. [Owner: post-move invitation, a rule change to mover verification §6. Current rule: move-experience invitations go only to customers a company marks Booked or Completed, at the company's request; AMC sends them, logs every request and monitors for selective patterns (such as inviting only a small share of booked customers), which can trigger an audit. If the current rule stays, rewrite this item and the "Movers don't choose who's invited" item under "Who can review a mover" — default shown (implications §4.4)]

## Two experiences, rated separately

Each review is about one of two experiences, and each experience has its own rating:

- **The quote and sales experience:** how the mover dealt with you before the move, from its first contact and estimate to signing you up, if you hired it.
- **The moving experience:** the move itself.

We never blend the two into one overall score. A mover can be good at quoting and poor at moving, or the reverse, and a single number would hide that.

## How reviews are checked

Every published review carries one of three evidence labels. The label tells you what we could prove about the reviewer's dealings with the mover, so you can decide how much weight to give the review.

| Label | What proves it | What it can rate |
|---|---|---|
| Verified platform inquiry | Our records show the reviewer sent the request and this mover bought it through American Moving Choice. | The quote and sales experience only |
| Verified customer | All of the above, plus a document from this mover showing the reviewer did business with it: a written estimate, an order for service or a deposit receipt. | The quote and sales experience, including hiring the mover |
| Verified completed move | All of the above, plus proof the move happened: a bill of lading, a final invoice or a delivery receipt. | The moving experience |

- **Documents are checked.** Reviewers upload documents themselves, and each document is checked in moderation before the label is given. So every rating of the moving experience rests on a checked document showing the move happened. [Build: labels come only from collected evidence, and the label shown always matches the evidence record (mover verification §8; backlog 6.5.4)]
- **Documents stay private.** We never publish the documents themselves, because they often carry private details such as addresses and prices. [Owner: no AMC document says uploaded review evidence stays private. Confirm and add it to mover verification §6 — default shown (by analogy with mover verification §5, "without exposing documents", and §6, contact details never shown)]
- **A purchase isn't proof of a move.** A mover buying your request doesn't show that you moved with it, and neither does a mover marking your job "Completed" in its own records. Only a checked bill of lading, final invoice or delivery receipt earns Verified completed move. [Build: a CRM "Completed" stage alone never yields Verified completed move (mover verification §6, §8; backlog 6.5.4)]
- **No label, no publication.** We don't publish a review that doesn't qualify for one of these labels.

## No rewards for good reviews

We never offer anything in return for a positive review, and nothing we offer depends on the rating you give or what you write. If we ever offer a reward for reviewing, such as a prize draw open to every reviewer, it will be offered whatever your rating, and every review it applies to will say so.

Movers in our network may not offer you anything for a good review either. If one does, please [report it](/report-a-concern/). [Counsel: the mover agreement isn't drafted. Consent draft §11 item 5 lists "no review gating, no incentives conditioned on sentiment, no fake reviews" for counsel to word]

## How moderation works

Every review goes through moderation before it's published, under the rules on this page. We reject a review only for one of these reasons: [Owner: mover verification §6 gives these five reasons as examples ("e.g."). Confirm the list is complete, or add reasons, before "only for one of these reasons" publishes. The full content guidelines, including what counts as abusive, are not yet written]

- **No evidence:** we can't tie it to a request this mover bought through us.
- **Unrelated:** it isn't about this mover or the writer's dealings with it.
- **Abusive:** it contains threats, harassment or hateful language.
- **Private data:** it shares someone's personal details, such as a phone number or home address.
- **Conflict of interest:** the writer has a tie to the mover or to a competitor, such as working for one.

We never reject or remove a review for being negative. Every moderation action is logged with its reason and the moderator who took it. [Build: every moderation action writes a log entry with reason and moderator (mover verification §6)]

## What movers can and can't do

- **They can't change reviews.** Movers can't edit, delete or hide a review, or change its rating. [Build: companies have no write access to reviews through any endpoint; permission tests per mover verification §8 ("cannot alter reviews or suppress valid criticism") and backlog 6.5.6]
- **They can reply in public.** A mover's owner or manager can post a public reply, which appears under the review with its date. Before a reply posts, they're warned not to include details the reviewer didn't share, such as contact details or addresses. Our mover terms also require replies to be truthful and to leave out customers' private information. [Build: show the warning before any reply posts, and date every reply (implications §4.4, §8.3; backlog 6.5.5)] [Counsel: consent draft §11 item 5 says replies "must be truthful and must not disclose customer private information"; the wording follows the final mover agreement]
- **They can report a review.** A mover that believes a review breaks our rules can report it, giving a reason. The report goes to our moderators, who decide.
- **Both sides can appeal.** When we decide on a report, the reviewer and the mover can each appeal the decision. [Owner: mover verification §6 gives both sides an appeal path on reports but sets no route, decider or timing. Decide those, and whether a reviewer can also appeal a rejection made at first moderation]

## How ratings are calculated

A mover has up to two ratings, one for each experience. Each is built from that experience's eligible reviews: published reviews that carry an evidence label and haven't been removed under the rules on this page.

- **A simple average.** The rating is the plain average of reviewers' own 1-to-5 star ratings. Every eligible review counts the same, and there's no hidden weighting.
- **Shown with context.** Next to each rating we show how many eligible reviews it comes from, how those reviews spread across 1 to 5 stars, the date of the latest one and how many arrived in the last 12 months.
- **Full dates.** Every review shows its full date, with month, day and year, never "3 months ago."
- **From the first review.** A rating appears as soon as a mover has one eligible review of that experience. The count beside it shows how much the rating rests on.
- **No placeholder ratings.** A mover with no eligible reviews shows "No customer reviews yet" in place of a rating. We never show empty stars or a 0.0. [Build: no stars, "0.0" or count render without an eligible review, and one rating record per experience type feeds every surface (mover verification §8; implications §4.4)]
- **Removals.** A review leaves a rating only if it's removed under the rules on this page.

### Minimum sample before any ranking

A rating built on a few reviews can change a lot with the next one. So until a mover has at least {{setting.rank_min_reviews}} eligible reviews of an experience:

- we make no rank, "top" or "best" claim based on that rating; and
- sorting a list by that rating gives the mover no priority.

We don't give movers awards or "best" badges. [Build: rating sorts, ranks and any "top" wording check {{setting.rank_min_reviews}} per experience type (site architecture §1.2 directory row, §2.4 rule 3)]

## What we don't do

- **Import reviews.** We don't bring in reviews or ratings from Google, Yelp, BBB, Trustpilot or anywhere else. Every review here came through one of our invitations.
- **Blend ratings.** We don't combine the quote and moving ratings into one score.
- **Add our own score.** We don't publish an editorial score or grade, or mix our opinion into customer ratings.
- **Rate ourselves.** We don't show ratings for American Moving Choice or for our own tools, such as [our cost calculator](/moving-cost-calculator/).
- **Pick excerpts by stars.** Where short excerpts from reviews appear, such as on city pages, a fixed rule chooses them, and the star rating plays no part. The rule will be published on this page before any excerpt appears. [Owner: no excerpt rule is written yet. Write it, add it to this page and remove this line before any excerpt renders (implications §4.4; site architecture §1.2 City page row)]
- **Sort by review count.** We never order lists of movers by review count by default, because counts grow with the number of requests a mover buys.
- **Summarize reviews with AI.** We don't publish AI-written summaries of reviews. We won't until a written policy for them is added to this page, and then only for a mover with at least {{setting.ai_summary_min_reviews}} reviews.

## Where reviews appear

- **On the mover's profile**, with its ratings. Reviews are listed newest first by default, so low ratings aren't buried.
- **On a separate reviews page**, once a mover has {{setting.reviews_subpage_min}} eligible reviews. Until then, all of its reviews are on its profile. [Build: /companies/{slug}/reviews/ exists only at {{setting.reviews_subpage_min}} eligible reviews (site architecture §1.2 Company profile row, §2.1)]
- **As short excerpts** on some pages, such as city pages, under the excerpt rule above.

Reviews and ratings play no part in the badge a mover gets for passing our checks. [How we verify movers](/how-we-verify-movers/) lists those checks.

## How to report a review

If you think a review breaks the rules on this page, tell us through [Report a concern](/report-a-concern/). Say which review it is and which rule you think it breaks. You can also email us at {{org.support_email}}.

Each report opens a case. Someone on our team is assigned to it, it has a target time for a decision, and the outcome is recorded. Movers report reviews from their account, giving a reason. Either side can appeal a decision on a report. [Build: each report opens a case with an assignee, a target time and a recorded outcome (mover verification §7; data model §8 `cases`, `review_reports`)]

## Changes to this method

When we change how reviews are collected, checked, shown or rated, we update this page and record the change here with its date.

| Version | Date | What changed |
|---|---|---|
| 1 | Set on first publish [Build: the CMS stamps each version's date when an approved change publishes, the first on the first approved publish (README §2 `last_updated`)] | First published |
