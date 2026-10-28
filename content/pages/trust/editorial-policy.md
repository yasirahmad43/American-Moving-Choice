---
id: trust-editorial-policy
url: /editorial-policy/
family: Trust page
title: "Editorial Policy and AI Use | American Moving Choice"
meta_description: "Each guide, cost and location page names its author and a different reviewer, and a named person approves any AI-assisted draft. Our sources and fixes."
h1: "Editorial policy"
breadcrumb: "Home › Editorial policy"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []                      # none mapped in docs/seo/keyword-to-page-map.csv; see the brief §3
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: n/a                          # no data blocks on this page
ai_assisted: true                        # drafted by an AI drafting agent from AMC's documents; human check and approval pending
stored_texts: [ST-6]                     # reference only: quoted as the statement every cost block carries; this page has no cost block
tokens: [org.editorial_email, page.author, page.reviewer, setting.ai_summary_min_reviews, cost.method.refresh_months, cost.method.max_data_age_months]
depends_on:
  - "Owner: the uses AI may have (no AMC document lists them; default shown: research help, first drafts, summaries of government sources, consistency checks)"
  - "Owner: AI disclosure form (default shown: a line in each page's review note)"
  - "Owner: a named reviewer approves every AI-assisted page, against the site architecture §4.1 G9 review sample from Wave 3 (site architecture §7.2, §4.1 G9)"
  - "Owner: no sponsored articles (default shown: none; mover verification §9 decision 5 and site architecture §0 item 5 cover placement only)"
  - "Owner: mover thresholds for location pages, 3 per city, long-distance or route page and 5 per state page (brief §11 Q4; site architecture §4.1 G1)"
  - "Owner: the corrections process and any reply or response time (no AMC document sets one)"
  - "Owner: a version number and changelog on every policy and method page (documented only for the verification text and the calculator method: implications §4.3; site architecture §6.3 rule 5)"
  - "Owner: name authors, reviewers and data owners with credentials that can be checked (brief §11 Q9; implications §11 Q17)"
  - "Owner: the value of {{org.editorial_email}} (brief §11 Q1)"
  - "Counsel: aggregate use of request data under the privacy policy (site architecture §7.5, §6.3 rule 7)"
  - "Counsel: ST-6 wording (site architecture §6.3 rule 3; stored-texts ST-6 notes)"
last_updated: null
---

# Editorial policy

American Moving Choice names the author of each guide, cost page and location page, and a different person who reviewed it. Facts come from primary sources such as federal and state agencies, and every number has a source and a date. Movers can't pay for coverage. AI may help draft pages, but a named person approves each one before publication.

Written by {{page.author}} · Reviewed by {{page.reviewer}} · Drafted with AI assistance, then checked and approved by the reviewer

[Build: this review note renders from the page record: author, reviewer, the review date and the "Last updated" date from the CMS, and the AI line because the record has `ai_assisted: true` (README §2; site architecture §7.3)]

## What we publish, and why

We publish to help you plan a move and check the movers you might hire. We choose topics from what people planning a move search for and ask about, and we write to answer the question, not to reach a word count.

- **[Guides](/guides/)** answer common questions, such as how to choose a mover, how to spot a moving scam and what your rights are when you move between states. Each guide has to add something useful that you can't easily find elsewhere. Our moving-to guides set out what a state asks of new residents, such as registering a vehicle, from government sources.
- **[Cost pages](/moving-costs/)** show what moves cost as ranges, never as single prices.
- **Tools** help you check something for your own move: our [moving cost calculator](/moving-cost-calculator/) gives a planning range, and [Verify a mover](/verify-a-mover/) helps you look up a mover's federal record.
- **[Location pages](/movers/)** for states, cities and routes between states show the movers in our network that serve the area, with local facts and costs. We publish one only where enough movers serve the area and we have real local data.

This policy covers what we write and publish. Customer reviews follow our [Review methodology](/review-methodology/), and anything a mover writes about itself, such as its profile description, is marked as provided by that company.

### When a location page goes live

A location page goes live only when all of these are true:

- **Enough movers serve the area.** At least 3 movers in our network that have passed [our checks](/how-we-verify-movers/) serve it, or 5 for a state page. A route page counts only movers that serve the route in that direction. For local moves in a city, a mover counts only if it lists that area's counties or ZIP codes and does local moves; a setting that covers a whole state or the whole country doesn't count. Storage, container and truck-rental companies never count, and the number of movers the page shows is the same count. [Owner: mover thresholds — default shown (brief §11 Q4; site architecture §4.1 G1)]
- **Local facts are checked.** At least 3 facts about the place have been checked against government sources. A route page needs 4, covering both ends of the move.
- **Costs have a source and a date.** Without enough cost data, the page waits. The main page for a state is the exception: it can go live without costs, and it says why.
- **It couldn't be any other page.** It has at least one original data point, such as Census figures on where people move or totals from requests sent through our site. It answers local questions from its own facts, not with text repeated across pages, and every section says something that would be wrong on the page for another place.
- **A named person has reviewed it.** [Owner: site architecture §4.1 G9 moves programmatic pages to a 20% review sample from Wave 3; see the marker under "How AI-assisted pages are checked"]

A location page that doesn't pass isn't published at all. We don't put up a thin page and hide it from search engines. [Build: the publishing gate runs every check above before a location page gets a public URL (site architecture §4.1, §4.2)]

### If a location page drops below the bar

If the number of movers serving a live location page drops two or more below the bar and stays there for 30 days in a row, we ask search engines not to list the page (a setting called noindex). A smaller or shorter dip doesn't hide the page, so pages don't flicker in and out of search results. If the page is still below the bar 90 days after it dropped, we redirect it to its state's main page, or remove it if there isn't a relevant one. [Build: nightly coverage counts drive the 30-day and 90-day rules, and internal links and sitemaps update the same day (site architecture §4.4, §2.5)]

### What we don't publish

- **Pages with nothing new.** If a page wouldn't tell you anything you can't easily find already, we don't write it. If two of our own pages would be near copies, we merge them before either goes live.
- **"Best movers" lists.** We publish no rankings or best-of lists, including lists of the "best movers" in a city. If we publish a comparison in the future, its method will be public, and whether a mover pays us will play no part in whether it's included.
- **Pages for places we don't cover.** There's no page for a place no mover in our network serves, and there are no pages for single ZIP codes.
- **Pages made mainly to rank in search**, such as near-identical pages for every city, ZIP code or service, or question-and-answer blocks written for search features rather than for you.
- **Advice beyond what we know.** For example, we don't recommend neighborhoods or schools, because we have no expertise there.

## Can movers pay for coverage?

No. American Moving Choice is paid by movers in our network for the move requests they buy, not by you; [How AMC makes money](/advertising-disclosure/) explains how that works.

A mover's payment buys it move requests and nothing on our editorial pages. No mover can pay for:

- a guide, article or other coverage about it, or a mention in one;
- a ranking, a higher place in a list, or an award;
- a place in an article, such as a link or a highlighted spot.

We don't publish sponsored articles. [Owner: confirm — default shown: none]

What a mover pays us also plays no part in our cost ranges. [How the calculator works](/moving-cost-calculator/method/) explains what goes into them.

## Who writes and checks our pages

- **A named author and a different reviewer.** Every guide, cost page, route page, location page and moving-to guide names the person who wrote it and a different person, with experience in the topic, who reviewed it. Our policy pages, this one included, name both too.
- **A named data owner.** Every block of data, such as a cost range or a count of movers, names its data owner: the person responsible for where those figures come from, how they're worked out and keeping them current.
- **Real people, real credentials.** Each author and reviewer has a page on our site with their name, credentials that can be checked and the pages they've written or reviewed. If there's a photo, it's of them.
- **No anonymous credits.** We don't credit pages to a team or to "staff", and we don't use "fact-checked" stamps that don't say who checked.
- **No borrowed experience.** Our pages never claim experience nobody here has. We aren't a moving company, so we never write "as movers ourselves", and pages built from a template, such as location pages, carry no first-person lines at all.

[Build: every page renders its review note from its record; the publish check blocks a page that's missing an author, a reviewer or, where data appears, a data owner, or that names the same person as author and reviewer; bylines link to each person's page at /authors/{slug}/ (site architecture §7.2, §1.2 Authors row; README §8 item 3)]

[Owner: name the authors, reviewers and data owners, with credentials that can be checked (brief §11 Q9; implications §11 Q17). No guide, cost, route, location or moving-to page can publish until they're named]

## Where our facts come from

**Primary sources first.** For facts about rules and places, we go to the source itself:

- **Federal moving rules:** the Federal Motor Carrier Safety Administration (FMCSA), the Electronic Code of Federal Regulations (eCFR) and the U.S. Code, plus the Federal Trade Commission (FTC) and the Federal Communications Commission (FCC) where their rules apply.
- **State rules:** the state agency or the state law itself, such as the Texas Department of Motor Vehicles (TxDMV) or California's Bureau of Household Goods and Services (BHGS).
- **Population and migration:** the US Census Bureau.
- **Wages:** the Bureau of Labor Statistics (BLS).

We link to the source where we use it, and we explain the rule in plain words. When we quote a source, we keep the quote under 25 words and link to it. If we've only seen a fact secondhand, for example in a search result or a news story, it doesn't go live until we've confirmed it on the primary source.

**Figures from movers.** Some figures come from movers in our network, such as the rates they give us for our cost ranges. We say so wherever we use them.

**Community sources find questions, not answers.** Forums, social media and complaint sites show us what people ask and what goes wrong for them. They never supply our answers: a forum thread can tell us a question is worth answering, but the answer comes from a source we can check.

**Other companies' figures are context, not our data.** If we mention a figure another company published, we name the source and its date, and we never present it as our own data.

**A source record for every page.** For each page, we keep a record of every claim it makes and every question it answers: the exact source address, the kind of source, the date we checked it, the evidence, who confirmed it and when it's due for a recheck. The record shows what we actually checked. We don't claim to have searched everywhere for every page.

[Build: the source record is stored with the page in the CMS, and the publish check fails while any row is unconfirmed (site architecture §6.2; README §8 item 4)]

## How we handle numbers

- **One record per figure.** Every number we publish lives in one record, with its definition, where it comes from, who owns it and its date. Everywhere the number appears reads from that record, so a figure can't say one thing in a page's title and another in its text or in a tool. [Build: a release fails if one figure has two values or no date (site architecture §6.3 rule 6)]
- **A source and a date for every number.** Each number links to its source, or to the page that explains how we worked it out.
- **Ranges, with their workings.** Cost figures are always ranges. Each one states what it covers, such as home size and distance, along with its source, the date of its data and how we built it. Our [calculator method page](/moving-cost-calculator/method/) sets out how.
- **No figure without enough data.** When we don't have enough data for a reliable figure, we leave it out rather than guess.
- **Our own request data, with limits.** Totals from move requests sent through our site appear only for facts that aren't prices, only above set minimum numbers of requests, and only where our privacy policy allows. [Counsel: confirm the privacy policy permits aggregate use of request data (site architecture §7.5, §6.3 rule 7)]
- **No claims we can't back up.** We never claim you'll save money by using us, and we publish no counts of people helped, moves booked or jobs done. We don't see whether you hire a mover, so we couldn't support those numbers.

Every cost range, table and calculator result on our site carries this statement:

<!-- ST-6 -->
> Movers set their own prices. American Moving Choice doesn't give quotes or estimates. These ranges are for planning only; only a mover's written estimate tells you what your move will cost.

[Build: render ST-6 here from its record, as a quoted reference, not as a cost block (stored-texts ST-6)]

## How we date pages

- **Last updated** is the date of the last change to what a page tells you: its main text, a fact we checked, its cost data or the movers it lists. Fixing a typo or changing the layout doesn't move it, and we never change it just to make a page look fresh.
- **Last reviewed** names the person who last reviewed the page, and the date, including routine checks that found nothing to change.
- **Data as of** dates sit on each block of data, such as a cost range or a count of movers, because data can be newer or older than the words around it. Mover counts on location pages are recalculated every night, and their date moves with them.
- **Full dates only.** We give the month, day and year, never "3 months ago".
- **No year in a title** unless the page's data is for that year and we refresh it on a schedule.

[Build: "Last updated" is the CMS time of the last substantive edit, never the time the page was built or viewed, and each data block renders its own "data as of" date from its record (site architecture §7.3, §8.4; README §8 item 7)]

## How we use AI

We use AI tools in some of our editorial work. A named person is responsible for every page we publish, however it was drafted.

### What AI helps with

- **Research:** finding sources, rules and the questions people ask, for a person to check.
- **First drafts:** drafting a page from its source record and our policy documents, for a person to check and edit.
- **Summaries of government sources:** condensing a rule or a long government page. Every summary is checked against the source itself before we use it.
- **Consistency checks:** comparing a draft with our policies, our wording rules and the records behind our figures, to catch contradictions.

[Owner: no AMC document lists the uses AI may have; docs/skills-log.md records AI agents doing research, review and drafting in Phase 1. Confirm this list — default shown: research help, first drafts, summaries of government sources and consistency checks]

### What we never use AI for

- **Reviews.** AI never writes a review, a rating or a testimonial, or anything else in a customer's name.
- **Review summaries below our threshold.** We don't publish AI summaries of reviews until a written policy for them is on our [review methodology page](/review-methodology/#what-we-dont-do), and never for a mover with fewer than {{setting.ai_summary_min_reviews}} reviews.
- **Made-up people or words.** AI never invents a quote, a person, a credential or an experience, and it's never credited as an author or reviewer. Every author, reviewer, expert and customer we name is a real person.
- **Images passed off as real.** AI never makes images of customers, staff, movers or moves. "Images, video and customer stories" below explains the limits.
- **Pages in bulk.** We never use AI to publish pages at scale without data we've checked. Every location page has to pass the bar above, however it was drafted. [Google's spam policies](https://developers.google.com/search/docs/essentials/spam-policies) take the same line: producing many low-value pages mainly to rank in search counts as spam, whether AI, people or both made them. [Verify: Google spam policies, "scaled content abuse" (compliance facts §5, from a search excerpt of the page, last updated late August 2026)]

### How AI-assisted pages are checked

Before a page that AI helped write is published:

1. A person checks every fact, figure and quote in it against the page's source record and the primary sources. Anything we can't confirm comes out.
2. A named reviewer, who isn't the page's author, approves it.
3. The page says that AI helped, as described below.

These are the checks every page gets. A page that AI helped write skips none of them.

[Owner: site architecture §4.1 G9 reviews every programmatic page in Waves 1 and 2, then a 20% sample plus every page with a flagged check from Wave 3, while §7.2 names a reviewer on every guide, cost, route, moving-to and geo page. Decide which applies to AI-assisted pages — default shown: a named reviewer approves every AI-assisted page]

### How we tell you

If AI helped write a page, its review note says so. The review note is the line that names who wrote and reviewed the page. [Owner: disclosure form — default shown: a line in each page's review note] [Build: the review note shows the AI line whenever the page record has `ai_assisted: true` (README §2)]

This page is AI-assisted. AI drafted it from our internal policy documents, and the reviewer named at the top of the page checked it against those documents and the sources it cites, then approved it.

## Images, video and customer stories

- **Generated images stay abstract.** We use generated images only for illustrations, backgrounds and objects, such as a box texture or a stylized route map. They never show people, whether customers, staff or movers, and never show offices, a real company's trucks, a move or a testimonial. They can't be placed on a mover's profile, in reviews or in customer stories. So any photo of people or a move on our site is a real photograph.
- **Every image is logged.** We record the source, license, creator and release status of every image, and whether it was generated.
- **Places are what we say they are.** We never caption a generic photo as a particular city. We don't use seals, flags or government logos, such as FMCSA's, and we avoid landmarks that could suggest a business tie or an endorsement.
- **Movers' photos are labeled.** A mover's photos and videos appear only if the mover confirms it's allowed to publish them, and they're labeled as provided by that company.
- **Videos have checked captions.** A person checks the captions on our videos, and each video has a transcript on the page.
- **Customer stories are real.** We publish a customer's story only with their written permission, and it's always attributed to the real person.

[Build: each media record carries generated true or false, source, license, creator and release status, and generated assets are blocked from profile, review and customer-story slots (visual direction §10.1; data model §9)]

## Found an error?

Email {{org.editorial_email}}. Tell us which page, what you think is wrong and, if you have one, a source we can check. Questions about this policy go to the same address.

If the problem is a mover's details or a review, use [Report a concern](/report-a-concern/) instead. Each report there opens a case with someone assigned to it.

When you report an error:

1. We check it against the page's source record and the primary source.
2. If we got it wrong, we correct the page, and a named reviewer checks the correction.
3. If the error is in a figure, we correct the figure's record, which corrects every page that shows it.
4. If the correction changes what the page tells you, we add a note saying what we changed and when, with the full date, and the page's "Last updated" date changes. On a policy page like this one, the correction also goes in the changelog.

[Owner: no AMC document sets a corrections process; confirm these steps and whether to promise a reply or a response time — default shown: no response time stated] [Build: correction notes render with an absolute date from the CMS]

## How we keep pages current

- **Cost data** is refreshed at least every {{cost.method.refresh_months}} months, and sooner when a source changes. If the data behind a cost figure is more than {{cost.method.max_data_age_months}} months old, the figure stops showing until it's refreshed.
- **Facts we've checked**, such as a state's rules for movers, are rechecked at least every 6 months and whenever the rule changes. A fact past its recheck date stops showing until someone rechecks it. [Build: expired facts hide themselves (site architecture §4.1 G3)]
- **Mover counts** on location pages are recalculated every night.
- **Movers' federal records** are rechecked every week. [How we verify movers](/how-we-verify-movers/) explains those checks.
- **Page reviews** happen every month for the first six months after launch, then every three months. Each review decides whether a page stays as it is, is improved, is merged into another page, is hidden from search or is removed.
- **Policy and method pages**, this one included, carry a version number and a changelog that records each change with its date. [Owner: AMC documents ask for a changelog only on the verification text (implications §4.3) and the calculator method (site architecture §6.3 rule 5); confirm for every policy and method page — default shown]

## Changes to this policy

When we change this policy, we update this page and record the change here with its date.

| Version | Date | What changed |
|---|---|---|
| 1 | Set on first publish [Build: the CMS stamps each version's date when an approved change publishes, the first on the first approved publish (README §2 `last_updated`)] | First published |

## Related pages

- [How we verify movers](/how-we-verify-movers/): every check we run on movers, and how often we recheck.
- [Review methodology](/review-methodology/): who can review a mover, how reviews are checked and how ratings are worked out.
- [How AMC makes money](/advertising-disclosure/): who pays us, and what payment never changes.
- [How the calculator works](/moving-cost-calculator/method/): how our cost ranges are built.
