---
id: trust-how-we-verify-movers
url: /how-we-verify-movers/
family: Trust page
title: "How We Verify Movers | American Moving Choice"
meta_description: "Movers only: we check every mover's FMCSA record for household-goods carrier authority, no broker authority and insurance filings, and recheck it weekly."
h1: "How we verify movers"
breadcrumb: "Home › How we verify movers"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []                      # none mapped in docs/seo/keyword-to-page-map.csv; see the brief §3
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: n/a                          # no data blocks on this page
ai_assisted: true
stored_texts: [ST-2, ST-5]
tokens: [badge.name, company.verified_date, setting.require_mc_number, setting.new_to_network_days, org.support_email, org.support_phone, page.author, page.reviewer, page.version, page.version_date]
depends_on:
  - "Owner: MC-number requirement vs a state-licensed local track (mover verification §9 decision 1; brief §11 Q4)"
  - "Owner: the stated reason for the MC rule (mover verification §1 gives none)"
  - "Owner + counsel: badge name, after clearance and usability round 1 (implications §5.3, §11 Q6; site architecture §0 item 9)"
  - "Counsel: ST-5 wording, including the material-connection question (implications §5.4 Q5)"
  - "Counsel: ST-2 phrasing while the MC number is a platform rule (stored-texts ST-2 notes; consent draft §2)"
  - "Owner: van-line brands with broker authority and their agents (implications §11 Q11, §4.1)"
  - "Owner + counsel: movers with ties to AMC's people, and their badge (implications §11 Q10, §4.3)"
  - "Owner: certificate-of-insurance minimums beyond federal filings (mover verification §9 decision 3)"
  - "Owner: 'New to our network' duration (mover verification §9 decision 4)"
  - "Owner: which failures show 'Verification under review' and which remove a company from the directory (mover verification §3; site architecture §2.5)"
  - "Counsel: final mover terms (consent draft §11)"
  - "Counsel: compliance facts §1 and §2 questions on requiring MC numbers, verifying state credentials, showing USDOT numbers on profiles, and diligence against disguised brokers"
last_updated: null
---

# How we verify movers

American Moving Choice accepts only moving carriers: companies that perform moves themselves. Before approval, we check each company's federal record for an active USDOT number, household-goods carrier authority, no broker authority and insurance filings, and a person reviews the file. We recheck that record weekly. If a check fails, the mover can't buy new requests and loses its badge.

## Who can join our network?

<!-- ST-2 -->
> **Movers only, no brokers.** Every company in our network must show active household-goods carrier authority and no broker authority on its federal (FMCSA) record, give us its USDOT and MC numbers, and agree not to resell your request or hand your move to another company. We recheck federal records every week. [How we verify movers]

[Counsel: confirm ST-2's phrasing while the MC number is a platform rule (stored-texts ST-2 notes; consent draft §2).] [Build: ST-2 renders from its record, drops "and MC" if `{{setting.require_mc_number}}` turns off, and hides if the weekly authority check fails to run (stored-texts ST-2 notes; implications §4.1).]

In full, a company must meet every requirement below. These are our own rules for joining, not a summary of the law.

### A USDOT number

The company gives us its USDOT number, which is how we find its record with the Federal Motor Carrier Safety Administration (FMCSA). The record must be active and not marked out of service.

### An MC number, while we require one

We also ask for the company's MC number, the docket number tied to its federal operating authority. [Verify: MC docket as the operating-authority number (compliance facts §1, search excerpts of FMCSA registration pages and the OP-1 form).] This is our rule, not a legal requirement for every mover. It limits our network to companies whose authority, insurance filings and broker status are on a federal record that we recheck automatically every week. [Owner: confirm this reason; mover verification §1 states the rule but not why. The requirement itself is the owner's open decision — default shown (mover verification §9 decision 1; brief §11 Q4).]

Two things to know about this rule:

- Some legitimate local movers work only within one state. They hold state credentials instead and have no MC number, so this rule leaves them out for now. [Verify: intrastate-only movers hold no FMCSA operating authority and no MC number (compliance facts §1, search excerpts).]
- FMCSA has [proposed no longer assigning MC numbers](https://www.fmcsa.dot.gov/faq/will-fmcsa-stop-issuing-mc-numbers). Any change would first go out as a proposed rule for public comment, and existing numbers won't change. For now, MC numbers are still issued. [Verify: FMCSA FAQ "Will FMCSA stop issuing MC Numbers?" and FMCSA "What's coming" (compliance facts §1, search excerpts); check federalregister.gov for a proposed rule published after 2026-09-24 (compliance facts open item 1).]

That's why the requirement is a setting we can turn off. If we do, this page and our movers-only statement will change, and the changelog will record it. [Build: show this section, the MC table row and the MC profile row only while `{{setting.require_mc_number}}` is on.]

### Active household-goods carrier authority

Interstate moves require federal operating authority as a carrier of household goods. [Verify: interstate household-goods movers need USDOT registration and household-goods operating authority (compliance facts §1, search excerpts).] We check that the company holds carrier authority covering household goods for the moves it offers, and that the authority is active.

### No broker authority

A moving broker arranges moves that carriers perform; it doesn't move your belongings itself. [Verify: broker role under 49 CFR 371 Subpart B (compliance facts §2, search excerpt).] We don't accept brokers. A company with broker authority on any docket linked to it can't join. That includes companies registered as both a carrier and a broker, even when their carrier authority is active.

A docket number alone doesn't show whether a company is a carrier, a broker or both, so we check the authority type itself. [Verify: compliance facts summary table and §1 (search excerpts); the legacy one-docket field names are UNVERIFIED, and separate dockets per authority under Motus is marked [confirm].] Why we're movers-only, and how to tell carriers from brokers on an FMCSA record, is on [Movers vs brokers](/movers-vs-brokers/).

### Van-line agents

Some movers work as agents of a national van line. If the van line's brand holds broker authority, the brand can't join. An agent that holds its own household-goods carrier authority, and no broker authority, can qualify on its own record. Its profile shows the agent's legal name first and names the van-line tie as a disclosed fact. [Owner: implications §11 Q11 — default shown]

### Insurance

Federal rules require interstate household-goods carriers to file proof of liability and cargo insurance with FMCSA. [Verify: FMCSA insurance filing requirements (compliance facts §1, search excerpt).] Those filings must be on file and active. The company must also send us a current certificate of insurance for general liability and cargo coverage. [Owner: minimum amounts on the certificate beyond the federal filings are not set (mover verification §9 decision 3); the copy names no amount until they are.]

### State credentials for in-state moves

Some states issue their own credentials to movers that work within the state. For example:

- **Texas:** a TxDMV number from the Texas Department of Motor Vehicles;
- **California:** a CAL-T household mover permit from the Bureau of Household Goods and Services (BHGS);
- **Florida:** a registration, known as an IM number, with the Department of Agriculture and Consumer Services (FDACS);
- **New York:** household goods authority from the New York State Department of Transportation (NYSDOT).

[Verify: state credentials in compliance facts §1 (search excerpts); confirm the current Florida statute text.]

If a company offers in-state moves in a state like these, we check its number against that state's records. At launch, a person does this by hand.

### Our movers-only terms

Every company agrees to our terms for movers. Among them: it won't resell or share your request, it won't hand your move to another company, and the carrier that quotes your move is the carrier that does it. [Counsel: the mover terms are still a summary for counsel to draft (consent draft §11 item 2; mover verification §1 item 5); confirm these three terms match the final agreement.]

## What we check before a mover joins

We find each company by its USDOT number and pull its record from FMCSA. We check state records where they apply and review the documents the company sends us. Every result then goes to a person on our team.

| What we check | Where the record comes from | What passing means | If it fails |
|---|---|---|---|
| USDOT record | FMCSA records | The USDOT number is active and not out of service | Not approved |
| MC number, while we require one | FMCSA records | An MC number on file for the company | Not approved while the rule is on |
| Identity | FMCSA records, compared with the application | The legal name or trade name (DBA) and the physical address match | A reviewer decides, with every mismatch highlighted |
| Authority type | FMCSA records | Carrier authority covering household goods where interstate moves are offered, and no broker authority on any linked docket | Rejected: broker authority, alone or beside carrier authority, means no |
| Authority status | FMCSA records | Granted and active, not pending, revoked or inactive | Not approved |
| Insurance filings | FMCSA records | The required federal filings are on file and active | On hold until they are |
| Recent record changes | FMCSA records | No recent changes to contact details, address or officers | Extra review before any decision |
| Callback | The phone number on the company's FMCSA record | Someone at the company confirms the application on that number | Not approved until the callback is done |
| State credentials | The issuing state's records | The number matches, and we keep a screenshot or PDF as evidence | No in-state requests in that state |
| Certificate of insurance | The certificate the company sends us | It names the company as the insured, and we record its expiry date | Not approved |
| Movers-only terms | Our agreement with the company | The company has agreed to them | Not approved |

Three of these checks guard against impostors:

- **Identity.** The company's name and its physical address (not a PO box) must match its FMCSA record. We score close-but-not-exact matches and show them to the reviewer, who decides.
- **Recent record changes.** We flag recent changes to the phone, email, address or officers on a company's FMCSA record, because changing these details is a common way to hijack a real company's identity.
- **Callback.** A reviewer calls the phone number on the company's FMCSA record, not the number in the application, so we reach the real company and not someone using its name.

[Build: verification service with recorded FMCSA fixtures, each check stored as an append-only evidence record (mover verification §3, §8 Phase 6; data model `verification_checks`).]

## A person reviews every application

No company is approved automatically. After the automated and document checks, someone on our team reviews the whole file, including any highlighted mismatches, flagged record changes and the callback, before approving or rejecting it.

Every check leaves a dated evidence record: where the data came from, a copy of what we retrieved, when we retrieved it, the result, and who reviewed it and what they decided. We add to these records but never edit them.

Once approved, a company gets a public profile, a place in our mover directory and on our location pages for areas it actually serves, and the badge. If we turn a company down, we tell it why, and it can reapply once it has fixed the problem.

### Ties to our team

Our application asks whether a company has any ties to people who own or work for American Moving Choice, and the review checks the answer. A mover with a tie can be listed, but the tie is disclosed on its profile, and the mover is never featured, ranked or compared. [Owner: implications §11 Q10 — default shown] [Counsel: whether a mover with a tie can carry the badge (implications §4.3, §11 Q10).] How we handle related parties in general is on [How AMC makes money](/advertising-disclosure/).

## How often we recheck

Passing once isn't enough to stay in our network.

- **Every week:** we recheck every approved mover's FMCSA record for its USDOT status, operating authority and insurance filings.
- **Before documents expire:** we alert the mover 30, 14 and 7 days before its certificate of insurance or a state credential expires, and again on the day it expires.
- **Every year:** we run every check again for every mover.
- **Right away after certain events:** we run every check again when someone reports broker activity, when someone complains about a mover's credentials, when a mover's ownership changes, or when we see a pattern of chargebacks (reversed card payments) on its account with us.
- **At every purchase:** before a mover can buy a request, our system rechecks its approval status, broker flag, numbers on file and credential expiry dates.

[Build: weekly FMCSA recheck job, expiry alerts and automatic suspension (mover verification §3, §8 Phase 6; implications §9.6).]

## What happens when a check fails?

If a check fails and we can't confirm that the mover still meets our rules:

- it can't buy new requests (this happens automatically);
- its badge comes off;
- its profile says "Verification under review", or the company comes off our directory; and
- we tell the company.

[Owner: mover verification §3 leaves the choice between "Verification under review" and removal "per policy"; set which failures lead to which (site architecture §2.5 sets the notice on a suspended profile).]

The same happens when we suspend a mover for broker activity or fraud. If a weekly recheck finds broker authority on a mover's record, alone or beside carrier authority, the mover comes off our directory, our location pages and the lists of movers you see before sending a request.

A suspended mover can't buy your request, even if it was among the movers listed when you sent it, because every purchase rechecks the mover's standing first. Requests it bought before the suspension stay with it, along with its records, its invoices and its access to our support team.

If you're dealing with a mover that has been suspended, you can check its current federal record yourself (see below), [report a concern](/report-a-concern/), or [withdraw your request](/which-companies-receive-my-request/).

A suspended mover comes back only after it passes every check again.

[Build: automatic suspension, profile status and directory removal (mover verification §3, §8; data model `company_profiles.public_status`); broker authority found on a weekly recheck removes the mover from the directory, location pages and consent lists (implications §4.1).]

## What does a mover's profile show?

Each profile shows the results of our checks as rows. Every row links to its source and gives the full date we last checked it, never "3 days ago".

| Row | What it shows | Source link |
|---|---|---|
| USDOT number | The number and its status | FMCSA company snapshot |
| MC number | The number, while we require one | FMCSA Licensing and Insurance record |
| Authority | The type of authority, such as carrier, and whether it covers household goods | FMCSA Licensing and Insurance record |
| No broker authority on record | That FMCSA shows no broker authority for the company | FMCSA Licensing and Insurance record |
| Insurance filings | The federal filings on record | FMCSA Licensing and Insurance record |
| State credential | Only a credential we've checked with the issuing state | That state's records |

We show what we checked and when, but not the documents themselves. A row without a source and a check date doesn't appear. [Build: a credential without `verified_at` and a source never renders (implications §4.2).]

Anything a company tells us about itself, such as its description, services or photos, sits in a separate block marked as provided by the company, never under an FMCSA source line.

Profiles also say plainly when a mover is new or has no reviews:

- **New to our network** shows for the first {{setting.new_to_network_days}} days after approval.
- **No customer reviews yet** shows until the mover has a published customer review, and no rating appears until then. How we collect and check reviews is on [Review methodology](/review-methodology/).

We never show a rating, review count, years in business, number of moves, award or "top-rated" label without evidence behind it. [Build: empty states and no fabricated rating on profiles (mover verification §5, §6, §8).]

<a id="badge"></a>

## What does the badge mean?

There is one badge, with no higher tiers. Every approved mover gets it, and it comes off automatically if the mover is suspended. We issue it only from the results of the checks on this page. It takes no input from reviews, ratings, how long a mover has been with us, or how much it buys or spends, so a mover with no reviews earns it exactly as any other mover does.

This is the explainer that sits next to every badge. On a profile, the date is the day that mover last passed our checks.

<!-- ST-5 -->
> **{{badge.name}}** means this mover passed our screening on {{company.verified_date}}: an active USDOT registration, active household-goods carrier authority, no broker authority, the insurance filings federal rules require, and agreement to our movers-only terms. Those insurance filings are minimum amounts, not full coverage for your belongings. We recheck federal records every week, and the badge comes off if a check fails. The badge doesn't rate work quality, prices or crews, and it isn't a government endorsement or a guarantee. Every mover in our network pays us for the requests it buys, but the badge isn't sold, and buying more never earns or keeps it. Customer reviews are shown separately. [Official FMCSA record] · [How we verify movers]

[Owner: badge name after counsel clearance and usability round 1; the token shows the working name "Preferred Mover · American Moving Choice" — default shown (implications §5.3, §11 Q6; site architecture §0 item 9).] [Counsel: ST-5 wording, including whether the badge needs a material-connection disclosure (implications §5.4 Q5; stored-texts ST-5 notes).] [Build: on this page ST-5 has no single mover, so render `{{company.verified_date}}` as "the date shown" and point [Official FMCSA record] to FMCSA's company snapshot search.] [Build: issue the badge only from passing checks (`badges.evidence_check_ids`); zero reviews plus passing checks earn it (implications §4.3; data model §3).]

Any change to the badge's name or meaning will be recorded in the changelog at the end of this page. How we're paid, and what payment never changes, is on [How AMC makes money](/advertising-disclosure/).

## What our checks can and can't tell you

Our checks are our own. They aren't a license, a certification or a government approval.

**What a pass tells you:** that on the date shown, the company met every requirement on this page that applies to it.

**What it can't tell you:**

- **How good the work is.** We don't assess how well a mover packs, loads or delivers your things.
- **Prices.** We don't set or check movers' prices or estimates. [How movers charge](/moving-costs/how-movers-charge/) explains how pricing works.
- **Who the crew is.** We don't run background checks on owners, staff or crews, and we don't check who will turn up on moving day.
- **How claims are handled.** If something is lost or damaged, we don't check how the mover will handle your claim.
- **Whether a mover will quote you.** Passing our checks doesn't mean a mover will contact you or give you a quote.
- **Complaint and safety history.** Beyond confirming that a mover isn't marked out of service, we don't review its complaint history or safety record. You can see both on Protect Your Move (below). [Verify: Protect Your Move shows complaint history and safety records (compliance facts §1, search excerpt).]
- **Full coverage for your belongings.** The insurance filings we check are the minimums federal rules set for carriers. For example, the federal cargo filing for a household-goods carrier is $5,000 per vehicle and $10,000 per occurrence. [Verify: cargo filing amounts (compliance facts §1, search excerpt of FMCSA insurance filing requirements).] What a mover owes you if your things are lost or damaged depends on the valuation option you choose with the mover, which is a separate choice. [Verify: valuation is not in compliance facts; confirm against FMCSA's primary pages before publishing, and match How movers charge.] [How movers charge](/moving-costs/how-movers-charge/) explains valuation.

## How can I check a mover myself?

You can look up any mover, in our network or not, on public records. Search by USDOT number rather than by name, because different companies can have similar names.

- **[FMCSA company snapshot (SAFER)](https://safer.fmcsa.dot.gov/saferhelp.aspx):** shows whether a USDOT number is active, inactive or out of service, and the company's operating authority status, such as authorized for household goods or not authorized.
- **[FMCSA Licensing and Insurance](https://li-public.fmcsa.dot.gov/LIVIEW/pkg_li_std_routines.prc_help?pn_pageid=5):** shows the types of authority a company holds and has held, which tells you whether it's a carrier, a broker or both, and its insurance filings.
- **[Protect Your Move](https://www.fmcsa.dot.gov/protect-your-move/how-to/faqs):** FMCSA's consumer site, where you can search interstate movers and brokers by name, state, USDOT number or MC number and see their complaint history and safety records.
- **State records for in-state moves:** [Texas (TxDMV)](https://www.txdmv.gov/motor-carriers/txdmv-number), [California (BHGS)](https://www.bhgs.dca.ca.gov/licensee/ab2956.pdf), [Florida (FDACS)](https://ccmedia.fdacs.gov/content/download/116043/file/Household-Moving-Services-Registration-Package-Guide.pdf) and [New York (NYSDOT)](https://nyc-business.nyc.gov/nycbusiness/description/authority-to-transport-household-goods).

[Verify: SAFER, Licensing and Insurance, and Protect Your Move descriptions (compliance facts §1, search excerpts). Compliance facts gives help and FAQ pages, not the search pages; link each search page directly.] [Verify: the state links are the rule and registration pages compliance facts cites, not lookups. Compliance facts names a BHGS license search but gives no URL, and names no lookup for Texas, Florida or New York; link each agency's public lookup.]

Our [Verify a mover](/verify-a-mover/) page walks through each lookup step by step.

## How do I report a concern?

If you think a mover in our network is acting as a broker, has credentials that look wrong, or has behaved badly, tell us through [Report a concern](/report-a-concern/). For example: a mover says another company will carry out your move; a company you weren't told about contacts you about your request; the USDOT number a mover gives you belongs to a different company; or a mover demands a large cash deposit. You can also email {{org.support_email}} or call {{org.support_phone}}.

Each report opens a case. Someone on our team is assigned to it, and it's closed with a recorded outcome. A report can prompt us to run every check on the mover again, or to suspend it.

[Build: each report creates a case with an assignee, a target time and an outcome, and can trigger re-verification or suspension (mover verification §7; data model `cases`); the form offers "contact from a company I was not told about" (implications §9.7).]

For complaints about a move itself, see [Complaints](/complaints/), which also explains how to file with FMCSA and state agencies.

## Version and changes

This page is the one place where we describe how we check movers. The badge explainer and the explanations of our checks on every profile render from the same versioned text, so they say the same thing. We record each change, with its date, in the changelog below.

Version {{page.version}} · {{page.version_date}}

[Build: render the version, date and changelog from the CMS record, and render badge explainers and profile check notes from the same version (implications §4.3). `page.version` and `page.version_date` are proposed registry keys, not yet in content/README.md §3.]
