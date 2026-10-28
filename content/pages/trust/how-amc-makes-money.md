---
id: trust-how-amc-makes-money
url: /advertising-disclosure/
family: Trust page
title: "How AMC Makes Money | American Moving Choice"
# ST-1c (allowed on this page: site architecture §8.2)
meta_description: "American Moving Choice is a service, not a mover or broker. Movers pay us for the requests they buy; payment never changes screening, ratings or order."
h1: "How AMC makes money"
breadcrumb: "Home › How AMC makes money"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: n/a
ai_assisted: true
stored_texts: [ST-1a, ST-1c, ST-3, ST-5]   # ST-5 as a summary and link only; the full explainer renders beside each badge
tokens: [pricing.revenue_relationship, badge.name, directory.url, org.support_email]
depends_on:
  - "implications §11 Q8 (owner and counsel): the sentence behind {{pricing.revenue_relationship}}, set after pilot pricing"
  - "shared pricing §9 decisions 1 and 2, brief §11 Q6: policy option B (step-down with credits) and the factor schedule"
  - "shared pricing §9 decision 3, brief §11 Q6: price bands, and whether prices vary by move type"
  - "implications §2.3 items 2 and 4, §11 Q4, brief §11 Q5, consent draft §4: the count-question safeguards"
  - "implications §3.1, §2.3 item 3, §11 Q3: the published order on the Review and send screen and the profile-origin path"
  - "mover verification §9 decision 5, site architecture §0 item 5: no sponsored placement at launch"
  - "owner: no third-party ads or affiliate links (default none; mvp-scope §6 mentions later truck-rental affiliates)"
  - "implications §3.7 (counsel): no 'never sell' line; who receives contact details"
  - "brief §11 Q1, implications §11 Q10 and §4.3 (owner and counsel): related-party disclosure"
  - "implications §5, §11 Q6 and §5.4 Q5 (counsel): badge name and its money relation"
  - "implications D5, brief §4: booking and deposits stay out of the product"
  - "counsel: final wording of ST-1a, ST-1c, ST-3 and ST-5 (stored texts; site architecture §7.1)"
  - "site architecture §0 item 9: directory name and slug behind {{directory.url}}"
last_updated: null
---

# How AMC makes money

American Moving Choice is paid by moving companies, not by you. A mover in our network pays us when it buys a move request, and you pay us nothing. What we earn depends on how many movers buy each request, so this page sets out how our revenue works and the limits we place on our own incentives.

We show the statement below, in these words, on the Review and send screen of our quote survey, on the confirmation page and in the footer of every page. [Build: one record renders ST-1a on this page, in the consent block, on confirmation and in the footer, and a build check matches them (site architecture §7.1; implications §3.4)]

<!-- ST-1a -->
> American Moving Choice is an online service that connects people planning a move with moving companies in our network. We are not a moving company or a moving broker. We don't transport belongings, give estimates, or arrange or book moves. Movers in our network pay us for the move requests they choose to buy. What a mover pays never changes its screening result, its ratings, how its reviews are shown, or where it appears in our directory, on our location pages or in the list of movers you see before you send a request.

[Movers vs brokers](/movers-vs-brokers/) explains the difference between the two, and why we work only with movers.

## Who pays us, and who doesn't

**Movers pay us for each request they buy.** A mover pays at the moment it buys a request. If no mover buys your request, we earn nothing from it.

**You pay us nothing.** We don't charge you to use the site, and we don't take deposits, booking fees, commissions or any other payment for your move.

**What we earn doesn't depend on whether you hire anyone.** We're paid when a mover buys your request, not when anyone hires a mover. So what we earn doesn't change with whether you hire a mover, which one you choose or what your move costs. Payment for the move itself is between you and the mover you hire.

## What do movers pay for a request?

This is a short summary. The full buying rules for movers are on our [pricing page for movers](/for-movers/pricing/).

**Each mover has its own price.** We set each mover's price in its account. Prices are private: we don't publish them, and movers never see one another's prices.

**Your answer decides the type of request.** At the How many movers step, our survey asks, "How many moving companies would you like to hear from?" The type is fixed when you send your request.

| Your answer | Type of request | Who can buy it | What each buyer pays |
|---|---|---|---|
| 1 | Exclusive | One mover at most | Its own exclusive price |
| 2 or more | Shared | Up to the number you chose | Its own shared price, which steps down as more movers buy |

**Shared prices step down as more movers buy.** Each time another mover buys a shared request, the price drops for every buyer. The new buyer pays the lower price, and each earlier buyer gets the difference back as credit in its account with us. In the end, every buyer pays the same percentage of its own price. [Owner: shared pricing §9 decision 1, policy option B (step-down with automatic credits), recommended but not approved — default shown (brief §11 Q6)]

How big each step is hasn't been decided. We'll publish the steps on our pricing page for movers once they're set. [Owner: shared pricing §9 decision 2, the factor schedule and the maximum number a consumer can choose — default shown: no figures on this page]

## Does your answer change what we earn?

Yes. What we earn from your request depends on the number you choose and on how many movers buy it.

<!-- {{pricing.revenue_relationship}} (default sentence from content/stored-texts.md) -->
Our revenue from a request rises with each mover that buys it, up to the number you chose. With the sample prices we're testing, a request that only one mover can buy earns us more than a shared one unless four or five movers buy the shared one. [Owner: replace with the real relationship once pilot prices are set; owner and counsel approve the sentence — default shown (implications §11 Q8)]

That gives us a reason to prefer some answers over others. These rules stop that from shaping the question:

- **Nothing is chosen for you.** No answer is selected in advance.
- **Every option looks the same.** No number is bigger, brighter or marked as recommended, and the words around the question don't push you toward more movers.
- **You can't choose more movers than are available.** A number higher than the count of movers available for your move is shown, but you can't select it, and the screen says why.
- **Revenue doesn't decide tests.** When we test changes to the question, we don't judge them by how much money they make us.

[Owner: the four safeguards are recommendations not yet adopted (implications §2.3 items 2 and 4; brief §11 Q5) — default shown (implications §11 Q4)] [Build: no preselected option; equal visual weight for every option; options above the live eligible count disabled, with the reason; no experiment on this screen uses revenue as its decision metric]

Read more about [how the question works](/which-companies-receive-my-request/).

## What payment never changes

No amount of buying or spending changes any of these:

| Payment never changes | What decides it | Read more |
|---|---|---|
| A mover's screening result and badge | Our published screening checks | [How we verify movers](/how-we-verify-movers/) |
| A mover's ratings, and which reviews we show and how | The same published method for every mover. Movers can't edit or delete reviews or choose which ones appear, and we never reject a review for being negative | [Review methodology](/review-methodology/) |
| Order in our directory and on our location pages | A published sort rule that uses no payment information | [How our directory is ordered]({{directory.url}}) |
| Order of movers on your Review and send screen | A published order that uses no payment information. If you started from a mover's profile, that mover comes first | [How movers are named](/which-companies-receive-my-request/) |

"No payment information" means none of these: what a mover pays for a request, how many requests it buys, how much it spends, its account credit or its budget. [Build: a fixture test shows inclusion and order ignore purchases, balances, budgets and plans (implications §9.2)] [Owner: implications §3.1, a published order for the rest of the Review and send list — default shown]

<!-- ST-5: summary and link only. The full badge explainer sits beside every badge. -->
Our badge, {{badge.name}}, is based only on our screening checks. It isn't sold, and buying more never earns or keeps it. [What the badge means](/how-we-verify-movers/#badge) [Build: the badge issues only from verification results; a mover with no purchases and passing checks gets it (implications §4.3)]

## Which movers appear on our site?

Only movers with active accounts in good standing appear in our directory and on our location pages, and only they can be named on your Review and send screen. An account is in good standing when the mover has passed our screening, its checks are current and the account isn't suspended, for example for a failed check or unpaid charges. A suspended mover can't buy requests, and we don't list it or name it to you.

Paying what it owes is part of keeping a mover's account active. How much it buys or spends never affects whether or where it appears.

Lists of movers in our directory and on our location pages carry this line inside the list, so it stays with the list if someone copies or quotes it:

<!-- ST-3 -->
> Every mover listed here pays American Moving Choice for the move requests it buys, and only movers with active accounts are listed. How much a mover buys or spends never affects whether or where it appears. [How this list is ordered]

[Build: ST-3 renders inside the list block on directory, location and comparison pages, so a quoted list keeps it (implications §3.4; site architecture §7.4)]

## What we don't sell

No mover can buy any of these from us:

- a ranking, or a higher place in any list
- an award
- a spot in our directory, on a location page or in an article
- reviews, or any say over which reviews appear
- editorial coverage, such as a guide or article about the company
- our badge

## Is any placement sponsored?

No. We don't sell sponsored placement. [Owner: mover verification §9 decision 5 — default shown]

If we ever offer it, it will follow these rules:

- It's labeled "Sponsored" and looks different from everything around it.
- It sits outside ranked lists, outside the list of movers on your Review and send screen, and outside comparisons.
- It's never called "Preferred", "Featured" or "Partner", so it can't be confused with our badge or read as our recommendation.
- It never changes a mover's screening result, ratings, how its reviews are shown, or the order of any list.

## Do we run ads or earn from links?

We may pay search engines and other websites to show ads for American Moving Choice. That money goes from us to them, and it plays no part in which movers you see or in what order.

We don't show ads for other companies, and we don't earn commissions from links to other websites. [Owner: confirm none — default shown: none]

## Who gets your details?

Your contact details go only to movers named on your Review and send screen, so they can contact you about your move. A named mover receives them only if both of these are true:

- you ticked the box there agreeing to hear from the movers listed, and
- it bought your request before the number you chose was reached.

Each mover that receives your details pays us for your request, and it gets them only after its purchase is complete. [Build: if the box stays unticked, nothing is shared (implications §2.4; backlog 4.2.4)] [Counsel: implications §3.7 — no "never sell" line until counsel decides whether paid delivery to named movers is a "sale" or a "share"; confirm "go only to movers" beside the service providers the privacy policy names]

[Which companies receive my request](/which-companies-receive-my-request/) explains each step, including who else handles your details and how to withdraw your request. Our [privacy policy](/privacy/) covers the rest.

## Do we have ties to any movers?

Our [About page](/about/) names the company behind American Moving Choice and its owner. It also lists any tie between the people who own or work for us and a mover, a moving broker or another company that buys move requests. If that company is a mover in our network, its profile shows the tie too. Such a mover may still be listed, but we never feature it, rank it or include it in a comparison. [Owner and Counsel: brief §11 Q1, implications §11 Q10 — default shown]

## Questions about this page

Email us at {{org.support_email}}.
