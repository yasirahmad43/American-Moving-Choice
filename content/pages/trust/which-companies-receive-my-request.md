---
id: trust-which-companies-receive-my-request
url: /which-companies-receive-my-request/
family: Trust page
title: "Which Companies Receive My Request? | American Moving Choice"
meta_description: "Only movers named on your Review and send screen can buy your request, and no more of them than the number you choose. You can remove any of them first."
h1: "Which companies receive my request?"
breadcrumb: "Home › Which companies receive my request"
indexation: index once approved
schema: [WebPage, BreadcrumbList]
primary_queries: []                      # none mapped in docs/seo/keyword-to-page-map.csv; see the brief §3
status: draft-v0
author: "{{page.author}}"
reviewer: "{{page.reviewer}}"
data_owner: n/a                          # no data blocks on this page
ai_assisted: true
ai_role: drafted
stored_texts: [ST-1b, ST-4a, ST-4b]
tokens: [setting.max_movers, setting.sale_window_hours, setting.duplicate_window_days, setting.stop_propagation_target, setting.quote_invite_delay_days, setting.post_move_invite_days, org.support_email, org.support_phone, page.author, page.reviewer]
depends_on:
  - "Owner: household-move entry points open on step 2 and skip What you need (implications §2.1); the current rule asks that question at every entry point (backlog 4.1.1; MVP scope §6)"
  - "Owner: mover names, USDOT numbers and check dates on What we found, or a count only (implications §11 Q1, §2.2, D1); counsel confirms the names don't read as AMC choosing the mover"
  - "Owner and counsel: a planning range from the cost model at What we found, when data allows (implications §2.2; build plan §7.2 lists only the count and names; consumer-moving-rules note, counsel item 1; compliance facts §2). If declined, the calculator method page drops its matching sentences"
  - "Owner: an optional 'notify me', with its own consent, on the no-coverage screen (backlog 4.1.6; consent draft §6; JTBD §4 J1; brief open item 9)"
  - "Owner: options capped at live coverage, equal weight for every option, maximum {{setting.max_movers}} (implications §11 Q4, §2.3 items 2 and 4, D2; brief §11 Q5; shared pricing §9 decision 2)"
  - "Owner: corporate-family counting, one purchase per family per request (implications §9.5, §11 Q12); the current rule counts each company (shared pricing §1)"
  - "Counsel: what an answer of 1 means, option (a) or (b) (implications §3.3, §11 Q2; stored-texts ST-4 notes)"
  - "Owner: removal at Review and send, and the count question asked again after removals (implications D3, §2.3, §3.1)"
  - "Owner: set the neutral order for the movers after the profile mover and name it on this page (implications §3.1, §9.2)"
  - "Counsel: whether movers behind 'Show all' count as named, which also governs the 'What we never do' item on unnamed movers (implications §2.4; compliance facts §3)"
  - "Owner: Terms and privacy acceptance in a control separate from the contact box (implications §3.2, D3); consent draft §5 still bundles them"
  - "Counsel: contact-box wording, a separate Terms acceptance and any automated-technology language (consent draft §5; implications §3.2)"
  - "Owner: channel choice on Your details, including which combinations can be picked (implications §11 Q5, §3.1; brief §11 Q6)"
  - "Owner: whether an email-only choice keeps the phone number from buyers (implications §3.1, §11 Q5; lead lifecycle §5; brief open item 17)"
  - "Owner: declined-consent path to the named movers' profiles, each showing at least the mover's website (implications §2.4, §11 Q7; site architecture §0 item 4)"
  - "Owner: whether movers see ZIP codes in the preview before buying (lead lifecycle §5 admin setting), and the channel choice in the preview (implications §9.3)"
  - "Owner and counsel: whether 'paid us' holds for purchases funded wholly by promotional or goodwill credit (shared pricing §2 kind 4; lead lifecycle §7 step 2), worded the same as on How AMC makes money"
  - "Owner: sale window {{setting.sale_window_hours}}, proposed 72 hours (lead lifecycle §1)"
  - "Counsel: the consent scope that bars movers added after sending (lead lifecycle §3 item 4)"
  - "Owner: which movers a repeat request names, and whether a mover named only on the repeat can buy (lead lifecycle §4; data model §5; brief open item 3)"
  - "Owner: per-mover and per-channel stops, where consumers ask for them, and whether a STOP alone still withdraws the request (implications §2.6; lead lifecycle §1; backlog 4.4.2, 4.4.3)"
  - "Owner: target time {{setting.stop_propagation_target}} for an opt-out or withdrawal to reach every buyer (implications §2.6)"
  - "Counsel: what buyers are told after a withdrawal or opt-out (lead lifecycle §1, 'per counsel's guidance')"
  - "Counsel: mover terms on channels, opt-outs, deletion, resale and handing a move to another company (consent draft §11 items 2 and 6; mover verification §1 item 5; compliance facts §3 implication 4)"
  - "Build and owner: manage-my-request page timing (MVP scope S2, a Should; backlog 4.4.2); build plan §7.2 links it from the confirmation page and §11 S2 builds /my-request/, but lowering the number and the buyer list aren't in §7.2"
  - "Owner: the post-move review invitation, a rule change to mover verification §6 (implications §4.4); build plan §7.5 builds only the quote-experience system invitation"
  - "Build: Review and send shows the movers-only statement (ST-2) beside ST-1a (implications §2.4; lead lifecycle §2 step 8); build plan §7.2 lists only ST-1a"
  - "Build: with the contact box unticked, no mover is notified, sees the preview or can buy (backlog 4.2.4; implications §2.4); build plan §7.2's notice to 'each eligible company' and its named_in_consent rows don't say so yet"
  - "Counsel: whether the contact box and the privacy policy cover showing the preview, including the first name, to every named mover, including those beyond the number chosen and those that never buy (lead lifecycle §5; implications §3.5, §3.7)"
  - "Owner: 'only this company' on profile-started requests, with a notice if that mover doesn't buy (implications §11 Q3, §2.3 item 3, §3.3)"
  - "Owner: what an unsold 'only this company' request means for a new request within {{setting.duplicate_window_days}} days (implications §11 Q3; lead lifecycle §4; shared pricing §1; brief open item 2)"
  - "Owner: AMC never phones consumers (implications §2.6, D5); no business rule sets this yet"
  - "Owner: no session recording or heatmaps on survey pages (implications §11 Q16; site architecture §8.8)"
  - "Owner: which analytics tools load on the survey steps, and whether GA4's advertising features are off there (site architecture §8.8, §9; stack and architecture §1)"
  - "Owner: whether pages that host the first survey steps also load no advertising pixels (site architecture §8.8; brief open item 7)"
  - "Owner: confirmed resale suspends the company, and what AMC does when the company that made contact isn't in the network (implications §9.7; brief open item 10); build plan §4.1 already has the case type unlisted_contact"
  - "Counsel: the service-provider list, conversion uploads tied to ad click IDs, and the 'sale' or 'share' question, aligned with the privacy policy (implications §3.5, §3.7)"
  - "Counsel: final wording of ST-1b, ST-4a and ST-4b (stored texts; site architecture §7.1)"
last_updated: null
---

# Which companies receive my request?

Only movers named on the Review and send screen of the American Moving Choice quote survey, just before you send, can receive your request. No more of them than the number you choose can buy it and get your contact details. You can remove any named mover there, and nothing is shared unless you agree to be contacted.

<!-- ST-1b -->
> Free to use. Movers in our network pay us for the requests they buy, and payment never changes their screening, ratings or order. [How AMC makes money]

Edited by {{page.author}} · Reviewed by {{page.reviewer}} · First drafted with AI

[Build: this review note renders from the page record, as the editorial policy specifies (content/pages/trust/editorial-policy.md, "How we tell you"; README §2)] [Owner: the AI disclosure form and the author's label on an AI-drafted page — default shown (editorial policy, "How we tell you")]

## How does your request reach movers?

Our quote survey has nine steps. Nothing goes to any mover until you send your request at Review and send, and going back a step never loses your answers. The step numbers on your screen count only the steps you see, so they can differ from the numbers here.

1. **What you need.** You tell us what you need help with. If you only need a vehicle shipped or a truck to rent, we show you information instead, and no request goes to any company. If you start from a page about a household move, you skip this step and begin at Where. [Owner: household-move entry points open on step 2 — default shown (implications §2.1); the current rule asks this question at every entry point (backlog 4.1.1; MVP scope §6)]
2. **Where.** Where you're moving from and to.
3. **When.** Your move date, or a range of dates.
4. **Size and services.** The size of your home and any services you need, such as packing.
5. **What we found.** Before we ask for any contact details, we show you how many movers in our network serve your move. If none does, we tell you here and don't ask for your contact details.
6. **Your details.** Why we ask, how movers may contact you, then your name, email and phone number.
7. **How many movers.** How many moving companies you'd like to hear from.
8. **Review and send.** The movers who can buy your request, by name. You can remove any of them, decide whether to agree to be contacted, and send.
9. **Confirmation.** What you sent, the movers named and the number you chose.

## What we found: who serves your move

At What we found, before any contact field, we check which movers in our network serve your move: your route, the size of your home and the services you chose. The screen shows:

- how many movers serve your move;
- each one's name, USDOT number and the date we last checked its federal record; and
- where our cost data allows, a planning range for a move like yours, labeled as a range, from the same model as our [moving cost calculator](/moving-cost-calculator/method/).

[Owner: names before contact — default shown (implications §11 Q1)] [Counsel: confirm that showing names before contact doesn't read as us choosing a mover for you (implications §2.2; compliance facts §2)] [Owner: a planning range at What we found — default shown (implications §2.2); build plan §7.2 lists only the count and names] [Counsel: a planning range inside the request flow, before contact details (consumer-moving-rules note, counsel item 1; compliance facts §2)] [Build: the range uses the calculator's model version, thresholds, ST-7 label and assumptions (implications §2.2)]

It shows no mover's prices and no phone numbers. These are normally the movers we name on your Review and send screen. The list can change before you get there if a mover starts or stops serving your move, or can no longer buy requests. The count doesn't take your move date into account, so it can't tell you which movers are available that day.

**If no mover serves your move,** the screen tells you, suggests next steps and doesn't ask for your contact details. [Owner: an optional "notify me", with its own consent, on this screen (backlog 4.1.6; consent draft §6; JTBD §4 J1). If it's adopted, say the screen asks for no contact details unless you choose to be told when a mover starts serving your move] If movers stop serving your move after this step and none is left when you send, your confirmation page tells you, and your request goes to no one. [Build: a `coverage_shown` event precedes the first contact field and matches the pre-check log (implications §2.2)]

We explain [the checks a mover must pass](/how-we-verify-movers/) before we can name it to you.

<a id="how-many"></a>

## How many movers can receive your details?

After Your details, the How many movers screen asks, "How many moving companies would you like to hear from?" This text sits under the question:

<!-- ST-4a -->
> This is the most movers who can receive your details. Choose 1 and only one mover can ever receive them from us. Choose 2 or more and up to that many can. It's a maximum, not a promise that you'll hear from that many. Numbers higher than the movers available for your move are shown but can't be chosen.

| Your answer | Who can receive your details |
|---|---|
| 1 | One mover only, ever. Once one mover has bought your request, no other mover can. |
| 2 to {{setting.max_movers}} | Up to that many movers, all of them named on your Review and send screen |

- **Nothing is chosen for you.** No number is selected in advance, every number you can choose looks the same, and nothing on the screen pushes you toward any number, fewer movers or more.
- **You can't choose more movers than are available.** The options run from 1 to {{setting.max_movers}}, never higher. If fewer movers serve your move, the numbers above that count are shown but can't be selected, and the screen says why.
- **Related movers count as one.** Movers under common ownership or control count as one mover toward your number: only one of them can buy your request, and they're listed together on your Review and send screen. [Owner: corporate-family counting — default shown (implications §9.5, §11 Q12); the current rule counts each company separately (shared pricing §1)] [Build: one purchase per corporate family per request group (implications §9.5)]

[Owner: equal weight for every option (implications §2.3 item 4) and options capped at live coverage, maximum {{setting.max_movers}} — default shown (implications §11 Q4)] [Build: no preselected option; equal visual weight for every option; options above the live eligible count disabled, with the reason; with 2 eligible movers and a maximum of 5, options 3 to 5 are disabled (implications §2.3); the screen renders ST-4a from its record]

**If you choose 1, which mover is it?** We don't pick. Any mover named on your Review and send screen can be the one: the first of them to buy your request. If you want one particular mover, remove the others before you send. [Counsel: implications §3.3 asks whether an answer of 1 means (a) you also pick the mover, or (b) any listed mover may buy and the first to buy gets it. The copy shows (b), the current rule (lead lifecycle §3 item 4; mover verification §5), and changes under (a) (implications §11 Q2)]

**Your answer sets the type of request.** Choosing 1 makes your request exclusive, and choosing 2 or more makes it shared. The type is fixed when you send. Your answer also affects [what movers pay and what we earn](/advertising-disclosure/).

<a id="review-and-send"></a>

## Review and send: who can buy your request

Before you send, the Review and send screen shows a summary of your request, the number you chose, how we're paid, and that our network takes movers only, never brokers. [Build: Review and send shows the movers-only statement (ST-2) beside ST-1a (implications §2.4; lead lifecycle §2 step 8); build plan §7.2 lists only ST-1a] It names every mover in our network that serves your move, each with its USDOT number and a link to its profile.

- **Only these movers can buy your request.** No other company can.
- **You can remove any of them.** A mover you remove can never buy your request. [Owner: removal at Review and send — default shown (implications D3, §3.1)] [Build: a removed mover can never buy; `removed_company_ids` is stored in the consent record (implications §3.1, §3.6)]
- **Removing movers can change your number.** If fewer movers are left than the number you chose, the How many movers question comes back with only the numbers still possible. With one mover left, the only choice is 1. [Owner: count question asked again after removals — default shown (implications §2.3)] [Build: choosing 2 and then removing one of two named movers brings the question back (implications §2.3)]
- **The order.** If you started from a mover's profile, that mover comes first. The rest follow a neutral order that never uses what a mover pays, how much it spends or how many requests it has bought. [Owner: set the order rule and name it here before publishing; implications §3.1 gives random rotation only as an example. The rule that the order never uses payment is the default shown (implications §3.1, §9.2)] [Build: store the order shown in the consent record (implications §3.1, §3.6)]
- **Long lists.** If many movers serve your move, the screen lists some of them and a "Show all" control for the rest. The movers behind "Show all" are named too, and any of them can buy your request, so open it to see each one before you send. [Counsel: whether movers behind "Show all" count as named. If they don't, the screen names up to a set number of movers and only those can buy, and this section and "What we never do" change to say so (implications §2.4; compliance facts §3)]

## What do you agree to when you send?

**The contact box.** At Review and send, a box asks whether you agree to be contacted about your move by the movers listed, no more of them than the number you chose, in the ways you picked and using the details you gave. The box starts unticked. Accepting our Terms of Use and acknowledging our privacy policy is a separate step, so the box is only about being contacted by those movers. The box also tells you how to opt out later. [Owner: Terms and privacy acceptance in a control separate from the box — default shown (implications §3.2, D3); consent draft §5 still puts them in the box] [Counsel: consent draft §5 wording, including any automated-technology language; implications §3.2 moves Terms and privacy acceptance out of the box] [Build: the box is unticked on load and holds no Terms or arbitration text, and both states are stored (implications §3.2)]

**How movers may contact you.** On the Your details screen, you choose how movers may contact you: by calls, texts or email. The box covers only what you choose: pick email only, and it doesn't cover calls or texts. Movers see your choice, and our terms require them to keep to it. [Owner: channel choice on Your details, including which combinations you can pick — default shown (implications §11 Q5)] [Owner: whether choosing email only also keeps your phone number from the movers that buy your request (implications §3.1, §11 Q5; lead lifecycle §5; brief open item 17)] [Counsel: the mover terms that bind movers to the choice (consent draft §11 item 2)]

**If you leave the box unticked,** nothing is shared with any mover, and no mover can buy your request. [Build: with the box unticked, no mover gets the "new request available" notice, sees the preview or can buy, and the consent record stores the unticked box (backlog 4.2.4; implications §2.4). Build plan §7.2 doesn't say this yet: its notice to "each eligible company" and its named_in_consent rows must exclude these requests] The screen then links to the named movers' profiles, so you can contact any of them yourself if you want to. [Owner: offer the named movers' profiles, each showing at least the mover's website — default shown (implications §2.4, §11 Q7)]

## What happens after you send?

**Your confirmation page** shows a reference number, the movers named on your Review and send screen and the number you chose, exactly as you agreed to them. [Build: the confirmation lists the consent-list movers and the number, matching the consent record (implications §2.5; site architecture §1.2 Quote survey row)]

**What movers see before they buy.** Once your request passes our checks, the movers named can see a short preview of it. It shows your first name, the cities and states you're moving from and to, your move date, the size of your home, the ways you chose to be contacted, and how you reached our site, for example through a search or an ad. They can't see your phone number, email address or last name unless they buy your request. [Owner: the channel choice in the preview — default shown (implications §9.3, §11 Q5)] [Owner: lead lifecycle §5 lets an admin setting add ZIP codes to the preview; name them here if it's on] [Counsel: whether the contact box and the privacy policy cover showing this preview, including your first name, to every named mover, including those beyond the number you chose and those that never buy (lead lifecycle §5; implications §3.5, §3.7)]

**When a mover buys your request,** it gets your contact details, and we email you its name, its USDOT number and a link to its profile, and tell you it paid us for your request. You get one email for each mover that buys. [Owner: whether choosing email only keeps your phone number from buyers (implications §3.1, §11 Q5; lead lifecycle §5). Once decided, say exactly which contact details a buyer gets] [Owner and Counsel: a mover can pay for a request wholly with account credit, including promotional or goodwill credit (shared pricing §2 kind 4; lead lifecycle §7 step 2). Confirm that "paid us" holds, and keep the wording the same as on How AMC makes money] [Build: one notice per purchase, naming the mover with its USDOT number and profile link and saying it paid American Moving Choice (implications §2.6; MVP scope M12; backlog 4.4.1)]

**Review invitations.** About {{setting.quote_invite_delay_days}} days after a mover buys your request, we invite you to review how that mover handled your quote. About {{setting.post_move_invite_days}} days after your move date, we invite you to review the move itself, if you moved with that mover. Both depend on your contact preferences. Our [review methodology](/review-methodology/) explains how review invitations work. [Owner: the post-move invitation, a rule change to mover verification §6 — default shown (implications §4.4)] [Build: system invitations per build plan §7.5; the post-move invitation isn't in §7.5]

**Movers that buy your request may contact you directly.** Our terms allow them to use only the ways you chose, and you can [report a mover](/report-a-concern/) that doesn't. [Counsel: the mover terms that bind movers to your channel choice (consent draft §11 item 2)]

**At most your number, maybe fewer.** No more movers than the number you chose can buy your request, so no more than that many can get your contact details from us. You may hear from fewer, because a mover may decide not to buy your request, not to quote after buying it, or not to get in touch at all.

**No timing promise.** We can't promise when, or whether, any mover buys your request or gets in touch.

## Time limits and repeat requests

- **A time limit for buying.** Movers can buy your request for {{setting.sale_window_hours}} hours after we offer it to them. After that, no one can buy it, even if fewer movers than your number have bought it. If none buys it in that time, your details go to no one.
- **No late additions.** A mover that joins our network, or starts serving your area, after you send can't buy your request. [Counsel: lead lifecycle §3 item 4 asks counsel to confirm this consent scope]
- **A recheck at every purchase.** Each time a named mover tries to buy, we recheck that it's still in good standing and still serves your move. If it isn't, it can't buy, even though it was named.
- **Repeat requests.** If you send another request for the same route, from the same phone number or email, within {{setting.duplicate_window_days}} days, it joins your first request, and we tell you we already have it. The lowest number you chose applies, and movers that bought your first request count toward it. [Build: tell the consumer when a repeat request joins the first (not in build plan §7.2)] [Owner: which movers a repeat request names, and whether a mover named only on the repeat can buy (lead lifecycle §4; data model §5; brief open item 3)]

<!-- ST-4b -->
> Choose 1 and only one mover can ever receive your details from us; choose more and up to that many can. Only movers named on the Review and send screen can buy your request. We never resell it, and every mover in our network agrees not to.

## Can you change your mind?

Yes. You can withdraw your request at any time.

**How to withdraw.** Email {{org.support_email}} or call {{org.support_phone}}. Replying STOP to a text about your request also withdraws it once your opt-out reaches us, and so does [asking us to delete your details](/privacy/). Our terms require movers to honor opt-outs you send them and to tell us about them. [Owner: whether a STOP alone still withdraws your whole request once per-channel stops exist; lead lifecycle §1 withdraws it today (implications §2.6)] [Counsel: the mover terms on honoring and reporting opt-outs (consent draft §11 item 2; compliance facts §3 implication 4)]

**Stopping one mover, or one kind of contact.** You can also ask us to stop a single mover that bought your request, or to stop one kind of contact, such as texts, from every mover. Neither withdraws your request. [Owner: per-mover and per-channel stops, and where you ask for them — default shown (implications §2.6; backlog 4.4.2, 4.4.3)] [Build: a per-mover or per-channel stop blocks only that mover or channel in buyers' CRM records, within {{setting.stop_propagation_target}} (implications §2.6)]

**What happens when you withdraw or opt out:**

- From that moment, no new mover can buy your request.
- If a mover is paying for it at that moment, its purchase is canceled and it doesn't get your details.
- Every mover that already bought it is told you withdrew or opted out, and its record of your request in our system is marked "do not contact". We aim to reach all of them within {{setting.stop_propagation_target}}. [Owner: set the target time {{setting.stop_propagation_target}}, no slower than any deadline counsel names (implications §2.6)] [Build: a STOP or withdrawal flags every buyer's CRM record "do not contact" within the target, and each buyer is notified (implications §2.6; backlog 4.4.3)] [Counsel: the notice to buyers follows counsel's guidance (lead lifecycle §1)]
- Withdrawing can't take back details a mover has already received. [Counsel: what movers must do with details they hold after a withdrawal or deletion request (consent draft §11 item 6)]

**Manage your request online.** Once our manage-my-request page is available, a secure link on your confirmation page lets you withdraw, lower your number and see which movers have received your details. Lowering your number can't undo purchases already made; it stops further sales once the new number is reached. [Build: build plan §7.2 links the manage page from confirmation and §11 S2 builds /my-request/; lowering the number and the buyer list aren't in §7.2 yet; keep "once … available" until they ship (backlog 4.4.2)]

## What if you started from a mover's profile?

If you start from a mover's profile on our site, that mover is listed first on your Review and send screen. If it doesn't serve your move, What we found tells you before you give any contact details, and you choose whether to go on with the movers that do.

Being listed first doesn't reserve your request for that mover. Any mover named on your Review and send screen can buy it, up to your number.

If you want that mover only, you can send your request to it alone. It's then the only mover named and the only one that can buy your request. If it hasn't bought your request within {{setting.sale_window_hours}} hours, we tell you. [Owner: "only this company", with a notice if that mover doesn't buy — default shown (implications §11 Q3)] [Owner: what an unsold "only this company" request means for a new request for the same route within {{setting.duplicate_window_days}} days, which would join it and keep its limit of 1. Once decided, tell the reader what they can do next (implications §11 Q3; lead lifecycle §4; shared pricing §1; brief open item 2)] [Build: an "only this company" option on profile-started requests, and a notice when the sale window ends without a purchase (implications §2.3 item 3)]

## What we never do

- **Resell your request.** Once your number is reached or the time limit passes, no one can buy your request, and we don't offer it anywhere else.
- **Share it with a mover that wasn't named on your Review and send screen.** Only movers named there can see your request or buy it. [Counsel: whether movers behind "Show all" count as named. If they don't, consent names up to a set number of movers and only those can buy (implications §2.4)]
- **Choose a mover for you.** We don't decide which mover gets your request, and whether you hire any mover is up to you.
- **Call you to sell, ask about your move or transfer you.** We never phone you to sell you anything, to ask about your move, to recommend a mover or to put you through to one. [Owner: AMC never phones consumers — default shown (implications §2.6, D5); no business rule sets this yet]
- **Put ad trackers or recordings on our quote survey pages.** Our quote survey pages, including Your details, Review and send and the confirmation page, load no advertising, retargeting or social-media pixels, no chat widgets and no session recording or heatmaps. Analytics on those pages count how people move through the steps. They never record your contact details, ZIP codes, move date or home size, and none of those ever appear in a page's web address. The same analytics rule applies wherever the first survey steps appear on our other pages. [Owner: no session recording or heatmaps — default shown (implications §11 Q16); site architecture §8.8 allows them only if counsel approves full masking] [Owner: which analytics tools load on the survey steps (stack and architecture §1 names GA4 and PostHog), and whether GA4's advertising features are off there (site architecture §8.8, §9)] [Owner: whether pages that host the first survey steps also load no advertising pixels; site architecture §8.8 extends only its analytics rule to them (brief open item 7)] [Build: a CI script inventory for each survey step, checked against an allowlist that names every analytics tool, with the tag-manifest version stored in the consent record (site architecture §8.8)]

## Who else handles your details?

Other companies run parts of our service for us. They include companies that host our site and store its data, protect our survey from bots, deliver our emails and text messages, check that phone numbers work, run our background tasks, monitor our site for errors, measure how people use our site, and process movers' card payments to us. Those that handle your details do it on our behalf, and none of them can buy your request. Our [privacy policy](/privacy/) covers them and what else happens to your details. [Counsel: align this list with the privacy policy, including any consent-certificate provider if one is adopted, and say whether we upload conversions tied to ad click IDs to advertising platforms (implications §3.5, §3.7; site architecture §8.8)]

## What if a company you weren't told about contacts you?

Every mover in our network agrees not to resell your request or hand your move to another company. [Counsel: the mover terms behind this sentence, which uses ST-2's words; consent draft §11 item 2 also lists sharing (mover verification §1 item 5)] If a company you weren't told about contacts you about it, tell us through [Report a concern](/report-a-concern/) or at {{org.support_email}}.

Each report opens a case. Someone on our team is assigned to it, and it's closed with a recorded outcome. A report can prompt us to run our checks on a mover again or to suspend it. If we confirm that a mover in our network resold your request, we suspend it, so it can't buy any more requests. [Owner: confirmed resale suspends the company — default shown (implications §9.7)] [Owner: what we do when the company that contacted you isn't in our network (brief open item 10)] [Build: Report a concern offers "contact from a company I was not told about" and opens a case of type `unlisted_contact` (build plan §4.1 `cases`; implications §9.7; mover verification §7; data model §8 `cases`)]

You can also [check any company's federal record yourself](/movers-vs-brokers/).

## Changes to this page

When we change this page, we record the change here with its date.

| Version | Date | What changed |
|---|---|---|
| 1 | Set on first publish | First published |

[Build: the CMS renders each row's version and date from the page record, and stamps the date when an approved change publishes, the first on the first approved publish (README §2 `last_updated`)] [Owner: changelog numbering, and who approves a change to this page before a new row publishes. The draft numbers versions 1, 2, 3, as the other trust pages do (editorial policy brief §10 item 6) — default shown]

## Read more

- [How AMC makes money](/advertising-disclosure/): who pays us, and how the number of movers you choose affects what we earn.
- [How we verify movers](/how-we-verify-movers/): every check we run, how often we recheck and what happens when a check fails.
- [Privacy policy](/privacy/): how we handle your details.

Questions about this page? Email {{org.support_email}}.
