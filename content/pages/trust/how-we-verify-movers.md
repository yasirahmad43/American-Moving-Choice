---
id: trust-how-we-verify-movers
url: /how-we-verify-movers/
family: Trust page
title: "How We Verify Movers | American Moving Choice"
meta_description: "Movers only: we check each mover in our network for household-goods carrier authority, no broker authority and insurance filings, then recheck weekly."
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
ai_role: drafted
stored_texts: [ST-2, ST-8]
tokens: [badge.name, company.verified_date, setting.require_mc_number, setting.credential_alert_days, setting.new_to_network_days, org.support_email, org.support_phone, page.author, page.reviewer]
depends_on:
  - "Owner: MC-number requirement vs a state-licensed local track (mover verification §9 decision 1; brief §11 Q4)"
  - "Owner: the stated reason for the MC rule (mover verification §1 gives none)"
  - "Owner: the MC row on profiles whenever an MC number is on record, or only while the MC rule is on (mover verification §5; compliance facts §1 implication 6; site architecture §8.5 vs §1.2)"
  - "Owner: federal household-goods carrier authority for every member, or only where interstate moves are offered (mover verification §1 item 2 and §3 vs §4; stored-texts ST-2, ST-5)"
  - "Owner + counsel: badge name, after clearance and usability round 1 (implications §5.3, §11 Q6; site architecture §0 item 9)"
  - "Counsel: ST-5 wording, including the material-connection question (implications §5.4 Q5), the suspension clause and link label changed on 2026-10-28 (stored-texts ST-5 notes), and its example rendering on this page with a placeholder date (stored-texts.md header)"
  - "Counsel: a mover suspended for unpaid charges loses the badge, beside the badge's money relation (implications §5.4 Q5; mover verification §3, §4)"
  - "Owner: what {{company.verified_date}} means: approval, last full re-verification or latest weekly recheck (mover verification §3 to §5; VD §9.4)"
  - "Counsel: ST-2 phrasing while the MC number is a platform rule (stored-texts ST-2 notes; consent draft §2)"
  - "Counsel: carrier-vs-broker note item 8: (a) 'the insurance filings federal rules require' across authority types, since contract carriers file no cargo insurance (note B11, A6); (b) 'active USDOT registration' while FMCSA isn't inactivating USDOT numbers for missed biennial updates (note A2); (c) 'no broker authority on its federal record' (note A1)"
  - "Counsel: MC-number wording, 'considering' or 'plans to propose' (carrier-vs-broker note item 9)"
  - "Counsel: broker definition in counsel's words, the same approved definition Movers vs brokers uses (implications §7.1; content/README.md §3)"
  - "Owner: van-line brands with broker authority and their agents (implications §11 Q11, §4.1)"
  - "Owner + counsel: whether a qualifying van-line agent must carry out a move bought through us under its own authority and bill of lading (implications §4.1, §9.4, §11 Q11; consent draft §11 item 2; mover verification §1 item 5; stored-texts ST-8)"
  - "Owner + counsel: movers with ties to AMC's people, and their badge (implications §11 Q10, §4.3)"
  - "Owner: certificate-of-insurance minimums beyond federal filings (mover verification §9 decision 3)"
  - "Owner: 'New to our network' duration (mover verification §9 decision 4)"
  - "Owner: the wording of the notice on a suspended mover's profile, 'Verification under review' (mover verification §3) or 'not currently part of the American Moving Choice network' (site architecture §2.5); every suspended mover comes off the directory and location pages (site architecture §2.5)"
  - "Owner: confirmed resale suspends the company (implications §9.7)"
  - "Owner: changelog numbering, and who approves a change to this text (editorial policy brief §10 item 6)"
  - "Counsel: final mover terms (consent draft §11)"
  - "Counsel: compliance facts §1 and §2 questions on requiring MC numbers, verifying state credentials, showing USDOT numbers on profiles, and diligence against disguised brokers"
  - "Counsel: California's Interstate Mover license for companies that move goods only into or out of California, and whether state-credential checks cover it (consumer-moving-rules note, counsel item 9; C16)"
last_updated: null
---

# How we verify movers

American Moving Choice accepts only moving carriers: companies that perform moves themselves. Before approval, we check each company's federal record for an active USDOT number, household-goods carrier authority, no broker authority and insurance filings, and a person reviews the file. We recheck that record weekly. If a check fails, the mover can't buy new requests.

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies (content/pages/trust/editorial-policy.md, "How we tell you"; README §2)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown (editorial policy, "How we tell you")]

## Who can join our network?

<!-- ST-2 -->
> **Movers only, no brokers.** Every company in our network must show active household-goods carrier authority and no broker authority on its federal (FMCSA) record, give us its USDOT and MC numbers, and agree not to resell your request or hand your move to another company. We recheck federal records every week. [How we verify movers]

[Counsel: confirm ST-2's phrasing while the MC number is a platform rule (stored-texts ST-2 notes; consent draft §2), and whether "no broker authority on its federal record" is accurate when it rests on the broker status reading None on every linked docket (carrier-vs-broker note, counsel item 8(c)).] [Build: ST-2 renders from its record, drops "and MC" if `{{setting.require_mc_number}}` turns off, and hides if the weekly authority check fails to run (stored-texts ST-2 notes; implications §4.1).]

In full, a company must meet each requirement below that applies to the moves it offers. We also explain how we treat van-line agents. These are our own rules for joining, not a summary of the law.

### A USDOT number

The company gives us its USDOT number, which is how we find its record with the Federal Motor Carrier Safety Administration (FMCSA). The record must be active and not marked out of service.

### An MC number, while we require one

We also require the company's MC number, the docket number tied to its federal operating authority. [Verify: MC docket as the operating-authority number (compliance facts §1, search excerpts of FMCSA registration pages and the OP-1 form).] This is our rule, not a legal requirement for every mover. [Verify: compliance facts §1 says intrastate-only movers have no MC number, and gives FMCSA's modernization FAQ as saying MC docket numbers "were never a statutory or regulatory requirement", marked [confirm] (search excerpts).] It limits our network to companies whose authority, insurance filings and broker status are on a federal record that we recheck automatically every week. [Owner: confirm this reason; mover verification §1 states the rule but not why. The requirement itself is the owner's open decision — default shown (mover verification §9 decision 1; brief §11 Q4).]

Two things to know about this rule:

- Some legitimate local movers work only within one state. They hold state credentials instead and have no MC number, so this rule leaves them out. [Verify: intrastate-only movers hold no FMCSA operating authority and no MC number (compliance facts §1, search excerpts).]
- FMCSA has said it is [considering no longer assigning MC numbers](https://www.fmcsa.dot.gov/faq/will-fmcsa-stop-issuing-mc-numbers). It would first publish a proposed rule for public comment. For now, MC numbers are still issued. [Verify: FMCSA FAQ "Will FMCSA stop issuing MC Numbers?" and FMCSA "What's coming" (compliance facts §1, search excerpts); check federalregister.gov for a proposed rule published after 2026-09-24 (compliance facts open item 1; carrier-vs-broker note B16 found none through 2026-10-28).] [Counsel: whether "considering" or "plans to propose" describes FMCSA's position more accurately (carrier-vs-broker note, counsel item 9).]

That's why the requirement is a setting we can turn off. If we do, this page and our movers-only statement will change, and the changelog will record it. [Build: show this section and the MC row in the checks table only while `{{setting.require_mc_number}}` is on. The MC row on profiles shows whenever the company has an MC number on record (see "What does a mover's profile show?").]

### Active household-goods carrier authority

Interstate moves require federal operating authority as a carrier of household goods. [Verify: interstate household-goods movers need USDOT registration and household-goods operating authority (compliance facts §1, search excerpts).] Every company in our network must hold active carrier authority covering household goods on its FMCSA record, whatever moves it offers. [Owner: is federal household-goods carrier authority required of every member, or only where interstate moves are offered? ST-2, ST-5, mover verification §4 and consent draft §11 item 1 say every member; mover verification §1 item 2 and §3 require household-goods scope only where interstate services are claimed — default shown: every member, as the stored texts say. If only interstate, this section, the checks table, the answer and the meta are qualified, and ST-2 and ST-5 variants go to content/stored-texts.md.]

### No broker authority

A moving broker arranges moves that carriers perform; it doesn't move your belongings itself. [Verify: broker role under 49 CFR 371 Subpart B (compliance facts §2, search excerpt).] [Counsel: broker definition in counsel's words (implications §7.1; content/README.md §3); render the same approved definition Movers vs brokers uses.] We don't accept brokers. A company with broker authority on any docket linked to it can't join. That includes companies registered as both a carrier and a broker, even when their carrier authority is active.

A docket number alone doesn't show whether a company is a carrier, a broker or both, so we check the authority type itself. [Verify: compliance facts summary table and §1 (search excerpts); the legacy one-docket field names are UNVERIFIED, and separate dockets per authority under Motus is marked [confirm].] Why we're movers-only, and how to tell carriers from brokers on an FMCSA record, is on [Movers vs brokers](/movers-vs-brokers/).

### Van-line agents

Some movers work as agents of a national van line.

<!-- ST-8 -->
> If a van line's brand holds broker authority, the brand can't join our network. An agent that holds its own household-goods carrier authority, and no broker authority, can qualify on its own record. We record its legal identity and van-line relationship during screening. The company must identify itself when it contacts you.

[Owner: implications §11 Q11 — default shown] [Owner and Counsel: whether a qualifying agent must carry out a move bought through us under its own authority and bill of lading, given the term that the carrier that quotes your move is the carrier that does it (implications §4.1, §9.4, §11 Q11; consent draft §11 item 2; mover verification §1 item 5)] [Build: ST-8 renders from its record, as on Movers vs brokers (stored-texts ST-8, proposed)]

### Insurance

Federal rules require interstate household-goods carriers to file proof of insurance with FMCSA. What they must file depends on their type of authority. [Verify: FMCSA insurance filing requirements (compliance facts §1, search excerpt). Compliance facts §1 says household-goods carriers file both liability and cargo insurance; carrier-vs-broker note B11 and A6 say a contract carrier files liability insurance only, with no cargo filing. Confirm on the primary pages and correct compliance facts.] [Counsel: whether "the insurance filings federal rules require" in ST-5 holds across authority types (carrier-vs-broker note, counsel item 8(a)).] Those filings must be on file and active. The company must also send us a current certificate of insurance for general liability and cargo coverage. [Owner: minimum amounts on the certificate beyond the federal filings are not set (mover verification §9 decision 3); the copy names no amount until they are.]

### State credentials for in-state moves

Some states issue their own credentials to movers that work within the state. For example:

- **Texas:** a TxDMV number from the Texas Department of Motor Vehicles;
- **California:** a CAL-T household mover permit from the Bureau of Household Goods and Services (BHGS);
- **Florida:** a registration, known as an IM number, with the Department of Agriculture and Consumer Services (FDACS);
- **New York:** household goods authority from the New York State Department of Transportation (NYSDOT).

[Verify: state credentials in compliance facts §1 (search excerpts); confirm the current Florida statute text; confirm whether BHGS calls the CAL-T credential a permit or a license (consumer-moving-rules note C16; its FAQ says "license"); confirm the New York row with NYSDOT, since compliance facts §1 cites a New York City business page and a secondary source.] [Counsel: California's BHGS also licenses interstate movers that move goods only into or out of California (C16 notes). Does that affect this section or the checks table's "State credentials" row (consumer-moving-rules note, counsel item 9)?]

If a company offers in-state moves in a state like these, we check its number against that state's records. At launch, a person does this by hand.

### Our movers-only terms

Every company agrees to our terms for movers. Among them: it won't resell or share your request, it won't hand your move to another company, and the carrier that quotes your move is the carrier that does it. [Counsel: the mover terms are still a summary for counsel to draft (consent draft §11 item 2; mover verification §1 item 5); confirm these three terms match the final agreement.]

## What we check before a mover joins

We find each company by its USDOT number and pull its record from FMCSA. We check state records where they apply and review the documents the company sends us. Every result then goes to a person on our team.

| What we check | Where the record comes from | What passing means | If it fails |
|---|---|---|---|
| USDOT record | FMCSA records | The USDOT number is active and not out of service | Not approved |
| MC number, while we require one | FMCSA records, compared with the application | An MC number that matches the company's FMCSA record | Not approved while the rule is on |
| Identity | FMCSA records, compared with the application | The legal name or trade name (DBA) and the physical address, not a PO box, match | A reviewer decides, with near matches scored and every mismatch highlighted |
| Authority type | FMCSA records | Active carrier authority covering household goods, and no broker authority on any linked docket | Rejected: broker authority, alone or beside carrier authority, means no |
| Authority status | FMCSA records | Granted and active, not pending, revoked or inactive | Not approved |
| Insurance filings | FMCSA records | The required federal filings are on file and active | On hold until they are |
| Recent record changes | FMCSA records | No recent changes to the phone number, email, address or officers | Extra review before any decision |
| Callback | The phone number on the company's FMCSA record | Someone at the company confirms the application on that number | Not approved until the callback is done |
| State credentials | The issuing state's records | The number matches, and we keep a screenshot or PDF as evidence | No in-state requests in that state |
| Certificate of insurance | The certificate the company sends us | It names the company as the insured, and we record its expiry date | Not approved |
| Movers-only terms | Our agreement with the company | The company has agreed to them | Not approved |

The identity, recent-changes and callback checks guard against impostors: people posing as a real moving company. We give recent changes to a company's record extra review, because someone posing as the company may have made them. The callback goes to the number on the FMCSA record, not the one in the application, so we're more likely to reach the real company. Someone posing as a company can also change the number on its record, so we pair the callback with the recent-changes flag.

[Build: verification service with recorded FMCSA fixtures, each check stored as an append-only evidence record; the USDOT and MC numbers a company submits must match its FMCSA record (mover verification §3, §8 "Submitted numbers match the approved company", Phase 6; data model `verification_checks`).]

## A person reviews every application

No company is approved automatically. After the automated and document checks, someone on our team reviews the whole file, including any highlighted mismatches, flagged record changes and the callback, before approving or rejecting it.

Every check leaves a dated evidence record: where the data came from, a copy of what we retrieved, when we retrieved it, the result, and who reviewed it and what they decided. We add to these records but never edit them.

Once approved, a company can purchase eligible requests that match its coverage and capabilities. We keep its company identity and screening evidence in our records; there is no public company showcase or individual quote button. If we turn a company down, we tell it why, and it can reapply once it has fixed the problem. [Build: the rejection reason goes to the applicant, and reapplication is allowed (mover verification §3)]

### Ties to our team

Our application asks about ties to people who own or work for American Moving Choice. Those ties are recorded for review and don't replace the screening checks. There are no public featured or preferred-mover placements.

## How often we recheck

Passing once isn't enough to stay in our network.

- **Every week:** we recheck every approved mover's FMCSA record for its USDOT status, operating authority and insurance filings.
- **Before documents expire:** we alert the mover {{setting.credential_alert_days}} days before its certificate of insurance or a state credential expires, and again on the day it expires.
- **Every year:** we run every check again for every mover.
- **Right away after certain events:** we run every check again when someone reports broker activity, when someone complains about a mover's credentials, when a mover's ownership changes, or when we see a pattern of chargebacks (reversed card payments) on its account with us.
- **At every purchase:** before a mover can buy a request, our system confirms from our records that it's still approved, has no broker authority on file, has its numbers on file and has no expired credentials.

[Build: weekly FMCSA recheck job; expiry alerts at 30, 14, 7 and 0 days; annual full re-verification; immediate re-verification on a broker-activity report, credential complaint, ownership change or chargeback pattern; automatic suspension; the purchase-time check (mover verification §3, §8 Phase 6; implications §9.6)]

## What happens when a check fails?

If a check fails and we can't confirm that the mover still meets our rules:

- it can't buy new requests (this happens automatically);
- it becomes ineligible for new request purchases; and
- we tell the company.

[Owner: the wording of the profile notice, "Verification under review" (mover verification §3) or "not currently part of the American Moving Choice network" (site architecture §2.5), and whether it differs by the reason for suspension. Mover verification §3 also allows removal from the directory "per policy" instead of a notice; the copy follows site architecture §2.5, which removes every suspended company from the directory and location pages and keeps a notice on its profile.]

The same happens when we suspend a mover for broker activity, fraud, reselling a request or unpaid charges. [Owner: confirmed resale suspends the company — default shown (implications §9.7)] If a weekly recheck finds broker authority on a mover's record, alone or beside carrier authority, the mover becomes ineligible to purchase new requests.

A suspended mover can't buy your request, even if it was eligible when you sent it, because every purchase rechecks the mover's standing first. Requests it bought before the suspension stay with it, along with its records, its invoices and its access to our support team.

If you're dealing with a mover that has been suspended, you can check its current federal record yourself (see below), [report a concern](/report-a-concern/), or [withdraw your request](/which-companies-receive-my-request/).

A suspended mover comes back only after it passes every check again.

[Build: automatic suspension, profile status and directory removal (mover verification §3, §8; data model `company_profiles.public_status`; site architecture §2.5); broker authority found on a weekly recheck removes the mover from the directory, location pages and consent lists (implications §4.1).]

## Company identity and screening records

We keep the company's legal identity, coverage and dated screening evidence internally. Our public site doesn't display company profiles, preferred-mover cards or company review showcases. The quote flow shows coverage counts and lets you choose how many movers may contact you, without listing their names.

Each company must identify itself when it contacts you. Before hiring, ask for its legal name, USDOT number, written estimate and relevant credentials, then check the records yourself using the sources below.

<a id="badge"></a>

## Screening is a status, not a recommendation

Approval means a company met the checks that apply to it when they were performed. Every applicable check must pass. Approval isn't a rating of work quality, a preferred placement, a government endorsement or a guarantee.

A suspended company isn't eligible for new requests. It must pass the applicable checks again before reinstatement.

## What our checks can and can't tell you

Our checks are our own. They aren't a license, a certification or a government approval.

**What a pass tells you:** that the company met every requirement on this page that applies to it when we approved it or last ran every check again, and that its federal record passed our latest weekly recheck. The underlying evidence records the date of each check.

**What it can't tell you:**

- **Changes since our last check.** A federal record can change between our weekly rechecks, so check the date shown and the mover's live FMCSA record.
- **How good the work is.** We don't assess how well a mover packs, loads or delivers your things.
- **Prices.** We don't set or check movers' prices or estimates. [How movers charge](/moving-costs/how-movers-charge/) explains how pricing works.
- **Who the crew is.** We don't run background checks on owners, staff or crews, and we don't check who will turn up on moving day.
- **How claims are handled.** If something is lost or damaged, we don't check how the mover will handle your claim.
- **Whether a mover will quote you.** Passing our checks doesn't mean a mover will contact you or give you a quote.
- **Complaint and safety history.** Beyond confirming that a mover isn't marked out of service, we don't review its complaint history or safety record. You can see both on Protect Your Move (below). [Verify: Protect Your Move shows complaint history and safety records (compliance facts §1, search excerpt).]
- **Full coverage for your belongings.** The insurance filings we check are the minimums federal rules set for carriers. For example, a household-goods common carrier's federal cargo filing is $5,000 per vehicle and $10,000 per occurrence. [Verify: cargo filing amounts (compliance facts §1, search excerpt of FMCSA insurance filing requirements); carrier-vs-broker note B11 gives the same amounts for common carriers and says contract carriers file no cargo insurance (note A6).] Protection for your belongings is a separate choice, called valuation, that you make with the mover. [Verify: valuation isn't in compliance facts §1 or §2; match How movers charge, which owns valuation (content/README.md §9), and confirm against its source (consumer-moving-rules note C10, search excerpts).] [How movers charge](/moving-costs/how-movers-charge/#what-is-valuation) explains it.

## How can I check a mover myself?

You can look up any mover, in our network or not, on public records. Search by USDOT number rather than by name, because different companies can have similar names.

- **[FMCSA company snapshot (SAFER)](https://safer.fmcsa.dot.gov/saferhelp.aspx):** the company snapshot.
- **[FMCSA Licensing and Insurance](https://li-public.fmcsa.dot.gov/LIVIEW/pkg_li_std_routines.prc_help?pn_pageid=5):** authority and insurance filings.
- **[Protect Your Move](https://www.fmcsa.dot.gov/protect-your-move/how-to/faqs):** complaint history.
- **State rules for in-state moves:** [Texas (TxDMV)](https://www.txdmv.gov/motor-carriers/txdmv-number), [California (BHGS)](https://www.bhgs.dca.ca.gov/licensee/ab2956.pdf), [Florida (FDACS)](https://ccmedia.fdacs.gov/content/download/116043/file/Household-Moving-Services-Registration-Package-Guide.pdf) and [New York](https://nyc-business.nyc.gov/nycbusiness/description/authority-to-transport-household-goods).

[Movers vs brokers](/movers-vs-brokers/) explains how to read each record.

[Verify: compliance facts §1 gives help and FAQ pages, not the search pages; link each search page directly.] [Verify: the state links are the rule and registration pages compliance facts cites, not lookups, and the New York link is a New York City business page, not an NYSDOT page. Compliance facts names a BHGS license search but gives no URL, and names no lookup for Texas, Florida or New York. Link each agency's public lookup, then relabel the bullet "State records for in-state moves".]

Our [Verify a mover](/verify-a-mover/) tool explains USDOT and MC numbers and state licenses, and helps you look up a mover.

## How do I report a concern?

If you think a mover in our network is acting as a broker, has credentials that look wrong, or has behaved badly, tell us through [Report a concern](/report-a-concern/). For example: a mover says another company will carry out your move; a company contacts you without permission, outside your chosen channels or without identifying itself; the USDOT number a mover gives you belongs to a different company; or a mover demands a large cash deposit. You can also email {{org.support_email}} or call {{org.support_phone}}.

Each report opens a case. Someone on our team is assigned to it, and it's closed with a recorded outcome. A report can prompt us to run every check on the mover again, or to suspend it.

[Build: each report creates a case with an assignee, a target time and an outcome, and can trigger re-verification or suspension (mover verification §7; data model `cases`); the form offers "contact from a company I was not told about", case type `unlisted_contact` (build plan §4.1; implications §9.7).]

For complaints about a move itself, see [Complaints](/complaints/), which also explains how to file with FMCSA and state agencies.

## Version and changes

This page is the one place where we describe how we check movers. The public explanation and the screening records are maintained as part of the same verification process. We record each change, with its date, in the changelog below.

| Version | Date | What changed |
|---|---|---|
| 1 | Set on first publish | First published |

[Build: the CMS renders each row's version and date from the page record, and stamps the date when an approved change publishes, the first on the first approved publish (README §2 `last_updated`); badge explainers and profile check notes render from the same version (implications §4.3).] [Owner: changelog numbering, and who approves a change to this text before a new row publishes. The draft numbers versions 1, 2, 3, as Review methodology and Editorial policy do (editorial policy brief §10 item 6) — default shown]
