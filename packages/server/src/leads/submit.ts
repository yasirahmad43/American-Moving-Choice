/**
 * Quote request submission (build plan §7.2; lead lifecycle §1, §4, §6). Everything the browser
 * sends is re-validated and the movers are re-matched on the server: the client's list only says
 * which movers the consumer saw, in what order, and which they removed. The request, its group,
 * validation results, consent record and eligibility snapshot are written in one transaction;
 * the emails are enqueued after it commits.
 */
import type { MoveSize, Service } from "@amc/core";
import {
  AB_VARIANT_NONE,
  SURVEY_FORM_VERSION,
  TAG_MANIFEST_VERSION,
  consentTextSha256,
  generateReferenceCode,
  isSelectableCount,
  parseDetails,
  parseSize,
  parseWhen,
  parseWhere,
  renderConsentText,
  servicesForNeed,
  type Channel,
  type FieldErrors,
} from "@amc/core/src/survey";
import { audit } from "../audit/audit";
import { checkRateLimit, rateLimitKey } from "../auth/rate-limit";
import { newToken, sha256Hex } from "../auth/tokens";
import { contactHash } from "../contact/contact-hash";
import { getPool, isUniqueViolation, tx, type Queryable } from "../db/pool";
import { env, hmacSecret } from "../env/env";
import { enqueueEmail, type EnqueueOptions } from "../outbox/outbox";
import { getSettings } from "../settings/settings";
import { matchMovers, publicMover, type CoverageResult, type MatchedMover } from "./coverage";
import { requestAvailableEmail, requestReceivedEmail, type RouteText } from "./messages";
import {
  RISK_REVIEW_THRESHOLD,
  checkSurveyTicket,
  cleanUtm,
  riskScore,
  sourceCategory,
  type ValidationRow,
} from "./quality";
import { submissionSchema, type SubmissionInput } from "./schemas";

/** Versions of the separate Terms and privacy control (terms-ack-v0-draft; implications §3.2). */
export const TERMS_VERSION = "terms-ack-v0-draft";
export const PRIVACY_VERSION = "privacy-draft-v0";

/** Survey submissions per IP address per hour (build plan §6). */
export const SUBMIT_RATE_LIMIT = { limit: 10, windowSeconds: 60 * 60 } as const;

export interface SubmitMeta {
  ip: string | null;
  userAgent: string | null;
  /** The page the consumer submitted from (no query string). */
  pageUrl: string;
  now?: Date;
}

export interface ConfirmationMover {
  companyId: string;
  displayName: string;
  usdotNumber: string | null;
  profileSlug: string | null;
  isDemo: boolean;
}

export interface Confirmation {
  referenceCode: string;
  /** The group's maximum: the lowest number chosen across repeat requests. */
  limit: number;
  /** The movers named in the consent, in the order shown. */
  movers: ConfirmationMover[];
  route: RouteText;
  moveDate: string;
  moveDateFlexible: boolean;
  moveSize: MoveSize;
  channels: Channel[];
  /** The earlier request this one joined (duplicate within duplicate_window_days), if any. */
  joinedReferenceCode: string | null;
}

export type SubmitResult =
  | { ok: true; manageToken: string; confirmation: Confirmation }
  | { ok: false; kind: "invalid"; errors: FieldErrors }
  /** The movers or the consent text changed since the consumer saw them: show the fresh list and ask again. */
  | { ok: false; kind: "movers_changed"; coverage: CoverageResult; consent: { versionId: string; body: string } }
  | { ok: false; kind: "no_coverage" }
  /** The coverage check is too old: check again. */
  | { ok: false; kind: "expired" }
  /** Bot defenses (honeypot, too fast, rate limit): a neutral message, never an accusation. */
  | { ok: false; kind: "rejected"; reason: "rate_limited" | "automated" };

export interface ActiveConsent {
  versionId: string;
  body: string;
}

/** The active contact-consent text (platform setting active_consent_version). */
export async function activeConsent(db: Queryable = getPool()): Promise<ActiveConsent> {
  const settings = await getSettings(db);
  const found = await db.query<{ id: string; body: string }>(
    "select id, body from consent_text_versions where id = $1 and kind = 'contact_consent' and status <> 'retired'",
    [settings.active_consent_version],
  );
  const row = found.rows[0];
  if (!row) throw new Error("The active consent text version is missing or retired");
  return { versionId: row.id, body: row.body };
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function ownOrigins(): string[] {
  const e = env();
  return [e.WEB_URL, e.APP_URL];
}

interface Recipient {
  email: string;
  company_id: string;
}

export async function submitRequest(raw: unknown, meta: SubmitMeta, options: EnqueueOptions = {}): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, kind: "invalid", errors: { form: "Something in the form didn't come through. Check your answers and try again." } };
  const input: SubmissionInput = parsed.data;
  const now = meta.now ?? new Date();
  const pool = getPool();

  // ---------------------------------------------------------------- bot defenses
  if (meta.ip) {
    const limit = await checkRateLimit(rateLimitKey("survey:submit:ip", meta.ip), SUBMIT_RATE_LIMIT.limit, SUBMIT_RATE_LIMIT.windowSeconds);
    if (!limit.allowed) return { ok: false, kind: "rejected", reason: "rate_limited" };
  }
  if (input.website.trim() !== "") return { ok: false, kind: "rejected", reason: "automated" };
  const ticket = checkSurveyTicket(hmacSecret(), input.ticket, now.getTime());
  if (!ticket.ok) return ticket.reason === "expired" ? { ok: false, kind: "expired" } : { ok: false, kind: "rejected", reason: "automated" };

  // ---------------------------------------------------------------- the steps, again
  const errors: FieldErrors = {};
  if (input.need === "vehicle_only" || input.need === "truck_rental") errors.need = "We don't send vehicle-only or truck-rental requests to movers.";
  const where = parseWhere(input);
  const when = parseWhen(input, isoDay(now), 1);
  const size = parseSize(input);
  const details = parseDetails(input);
  for (const step of [where, when, size, details]) if (!step.ok) Object.assign(errors, step.errors);
  if (!input.consentChecked) errors.consent = "To send your request, tick the box to agree to be contacted by the movers listed.";
  if (!input.termsAccepted) errors.terms = "To send your request, accept the Terms of Use and acknowledge the Privacy Policy.";
  if (!where.ok || !when.ok || !size.ok || !details.ok || Object.keys(errors).length) return { ok: false, kind: "invalid", errors };

  const settings = await getSettings();
  const services: Service[] = servicesForNeed(input.need, size.value.services);
  const coverage = await matchMovers({
    originZip: where.value.originZip,
    destZip: where.value.destZip,
    moveSize: size.value.moveSize,
    services,
    profileCompanyId: input.profileCompanyId,
  });
  if (!coverage.ok) {
    return { ok: false, kind: "invalid", errors: coverage.reason === "unknown_origin" ? { originZip: "We don't recognize this ZIP code." } : { destZip: "We don't recognize this ZIP code." } };
  }
  if (coverage.movers.length === 0) return { ok: false, kind: "no_coverage" };

  const consent = await activeConsent();
  const changed = (): SubmitResult => ({
    ok: false,
    kind: "movers_changed",
    coverage: { ...coverage, movers: coverage.movers.map(publicMover) },
    consent,
  });

  // ---------------------------------------------------------------- who is named
  const eligible = new Map(coverage.movers.map((m) => [m.companyId, m]));
  const shown = [...new Set(input.shownCompanyIds)];
  const removed = new Set(input.removedCompanyIds.filter((id) => shown.includes(id)));
  // A mover the consumer kept on the list is no longer eligible: the text they saw is out of date.
  if (shown.some((id) => !removed.has(id) && !eligible.has(id))) return changed();
  const shownEligible = shown.filter((id) => eligible.has(id)).map((id) => eligible.get(id)!);
  const named = shownEligible.filter((m) => !removed.has(m.companyId));
  const removedMovers = shownEligible.filter((m) => removed.has(m.companyId));
  if (named.length === 0) return { ok: false, kind: "invalid", errors: { movers: "Keep at least one mover on the list to send your request." } };
  if (input.onlyProfileCompany && !(input.profileCompanyId && named.length === 1 && named[0]!.companyId === input.profileCompanyId && input.limit === 1)) {
    return { ok: false, kind: "invalid", errors: { limit: "Choose how many moving companies you'd like to hear from." } };
  }
  if (!isSelectableCount(input.limit, named.length, settings.max_sharing_limit)) {
    return { ok: false, kind: "invalid", errors: { limit: "Choose how many moving companies you'd like to hear from." } };
  }

  // ---------------------------------------------------------------- consent text as shown
  if (input.consentVersionId !== consent.versionId) return changed();
  const channels = details.value.channels;
  const renderedText = renderConsentText(consent.body, { movers: named, limit: input.limit, channels });
  const renderedSha = consentTextSha256(renderedText);
  if (renderedSha !== input.renderedTextSha256) return changed();

  // ---------------------------------------------------------------- quality and risk
  const { email, phone, firstName, lastName } = details.value;
  const emailHash = contactHash("email", email)!;
  const phoneHash = contactHash("phone", phone);
  if (!phoneHash) return { ok: false, kind: "invalid", errors: { phone: "Enter a 10-digit US phone number, like 512-555-0123." } };
  const recent = meta.ip
    ? await pool.query<{ n: number }>("select count(*)::int as n from consent_records where ip = $1 and submitted_at > now() - interval '24 hours'", [meta.ip])
    : null;
  const risk = riskScore({
    firstName,
    lastName,
    email,
    elapsedSeconds: ticket.elapsedSeconds,
    recentFromIp: recent?.rows[0]?.n ?? 0,
    originZip: where.value.originZip,
    destZip: where.value.destZip,
  });
  const status = risk.score >= RISK_REVIEW_THRESHOLD ? "needs_review" : "qualified";
  const source = sourceCategory(input.attribution, ownOrigins());

  const manageToken = newToken();
  const formState = JSON.stringify({
    form_version: SURVEY_FORM_VERSION,
    need: input.need,
    origin_zip: where.value.originZip,
    dest_zip: where.value.destZip,
    move_date: when.value.moveDate,
    flexible: when.value.flexible,
    latest_date: when.value.latestDate,
    move_size: size.value.moveSize,
    services,
    channels,
    limit: input.limit,
    only_profile_company: input.onlyProfileCompany,
    shown: shownEligible.map((m) => m.companyId),
    removed: removedMovers.map((m) => m.companyId),
    consent_version: consent.versionId,
  });

  const route: RouteText = {
    originCity: coverage.move.origin.city,
    originState: coverage.move.origin.state,
    destCity: coverage.move.destination.city,
    destState: coverage.move.destination.state,
  };

  // ---------------------------------------------------------------- write
  let outcome: { leadId: string; groupId: string; referenceCode: string; limit: number; joinedReferenceCode: string | null; recipients: Recipient[] } | null = null;
  for (let attempt = 0; attempt < 3 && !outcome; attempt++) {
    try {
      outcome = await tx(async (client) => {
        // Serialize submissions from the same contact details so two at once can't both start a group.
        for (const key of [emailHash, phoneHash].sort()) await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [key]);
        // Duplicate: same email or phone hash, same route, inside the window, not withdrawn (lead lifecycle §4).
        const duplicate = await client.query<{ group_id: string; reference_code: string }>(
          `select l.group_id, p.reference_code
             from leads l
             join lead_groups g on g.id = l.group_id
             join leads p on p.group_id = l.group_id and p.is_primary
            where (l.email_hash = $1 or l.phone_hash = $2)
              and l.origin_zip = $3 and l.dest_zip = $4
              and l.created_at > now() - make_interval(days => $5)
              and g.status <> 'withdrawn' and l.withdrawn_at is null
            order by l.created_at asc
            limit 1`,
          [emailHash, phoneHash, where.value.originZip, where.value.destZip, settings.duplicate_window_days],
        );
        const dup = duplicate.rows[0] ?? null;
        let groupId: string;
        if (dup) {
          groupId = dup.group_id;
          await client.query("select attach_duplicate($1, $2)", [groupId, input.limit]);
        } else {
          const group = await client.query<{ id: string }>(
            `insert into lead_groups (sharing_limit, policy_version, expires_at)
             values ($1, $2, now() + make_interval(hours => $3)) returning id`,
            [input.limit, settings.active_policy_version, settings.sale_window_hours],
          );
          groupId = group.rows[0]!.id;
        }

        const referenceCode = generateReferenceCode();
        const lead = await client.query<{ id: string }>(
          `insert into leads (group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip, is_primary,
                              reference_code, status, move_date, move_date_flexible, move_size, services,
                              origin_city, origin_state, origin_county_fips, dest_city, dest_state, dest_county_fips,
                              distance_miles, move_type, channel_scope, email_hash, phone_hash, risk_score, source_category,
                              manage_token_hash, profile_company_id)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::text[], $16, $17, $18, $19, $20, $21,
                   $22, $23, $24::text[], $25, $26, $27, $28, $29, $30)
           returning id`,
          [
            groupId, input.limit, firstName, lastName, email, phone, where.value.originZip, where.value.destZip, !dup,
            referenceCode, status, when.value.moveDate, when.value.flexible, size.value.moveSize, services,
            coverage.move.origin.city, coverage.move.origin.state, coverage.move.origin.countyFips,
            coverage.move.destination.city, coverage.move.destination.state, coverage.move.destination.countyFips,
            coverage.move.distanceMiles, coverage.move.moveType, channels, emailHash, phoneHash, risk.score, source,
            sha256Hex(manageToken), input.profileCompanyId && eligible.has(input.profileCompanyId) ? input.profileCompanyId : null,
          ],
        );
        const leadId = lead.rows[0]!.id;

        const validations: ValidationRow[] = [
          { check_type: "honeypot", result: "pass", reason: "Hidden field left empty." },
          { check_type: "min_completion_time", result: "pass", reason: `Sent ${Math.round(ticket.elapsedSeconds)} seconds after the coverage check.` },
          { check_type: "rate_limit", result: meta.ip ? "pass" : "skipped", reason: meta.ip ? "Under the per-IP submission limit." : "No client IP address available." },
          { check_type: "phone_format", result: "pass", reason: "Valid NANP number." },
          { check_type: "phone_line_type", result: "skipped", reason: "No carrier lookup provider is configured." },
          { check_type: "email_syntax", result: "pass", reason: "Valid address syntax." },
          { check_type: "email_mx", result: "skipped", reason: "No MX lookup provider is configured." },
          { check_type: "disposable_email", result: "pass", reason: "Domain is not on the disposable-address list." },
          { check_type: "move_date", result: "pass", reason: "Within the next 12 months." },
          { check_type: "route", result: "pass", reason: `Known ZIP codes; ${coverage.move.moveType} move of ${coverage.move.distanceMiles} miles.` },
          dup
            ? { check_type: "duplicate_check", result: "flag", reason: `Same contact and route as ${dup.reference_code} within ${settings.duplicate_window_days} days; joined its group.` }
            : { check_type: "duplicate_check", result: "pass", reason: `No matching request in the last ${settings.duplicate_window_days} days.` },
          {
            check_type: "risk_score",
            result: status === "needs_review" ? "flag" : "pass",
            reason: `Risk score ${risk.score} of 100${status === "needs_review" ? `, at or above the review threshold of ${RISK_REVIEW_THRESHOLD}` : ""}${risk.reasons.length ? `: ${risk.reasons.join("; ")}` : ""}.`,
          },
        ];
        await client.query(
          `insert into lead_validation_results (lead_id, check_type, result, reason)
           select $1, v.check_type, v.result, v.reason
           from unnest($2::text[], $3::text[], $4::text[]) as v(check_type, result, reason)`,
          [leadId, validations.map((v) => v.check_type), validations.map((v) => v.result), validations.map((v) => v.reason)],
        );

        await client.query(
          `insert into consent_records (lead_id, consent_text_version_id, rendered_text, rendered_text_sha256, named_company_ids,
                                        removed_company_ids, selected_limit, channel_scope, checkbox_state, terms_version,
                                        terms_accepted, privacy_version, privacy_acknowledged, ip, user_agent, page_url,
                                        form_version, form_state_sha256, ab_variant, phone_hash, email_hash, tag_manifest_version)
           values ($1, $2, $3, $4, $5::uuid[], $6::uuid[], $7, $8::text[], true, $9, true, $10, true, $11, $12, $13,
                   $14, $15, $16, $17, $18, $19)`,
          [
            leadId, consent.versionId, renderedText, renderedSha, named.map((m) => m.companyId), removedMovers.map((m) => m.companyId),
            input.limit, channels, TERMS_VERSION, PRIVACY_VERSION, meta.ip, meta.userAgent, meta.pageUrl,
            SURVEY_FORM_VERSION, sha256Hex(formState), AB_VARIANT_NONE, phoneHash, emailHash, TAG_MANIFEST_VERSION,
          ],
        );

        // Eligibility snapshot: removed movers keep a row with named_in_consent false, so they can
        // never buy. A repeat request's consent replaces the group's list: movers it names may buy,
        // movers it doesn't name can't, and the group keeps the lowest number chosen
        // [Owner: which movers a repeat names (lead lifecycle §4; Which companies receive my request,
        // "Repeat requests") — the latest consent is the build default].
        if (dup) {
          await client.query("update lead_eligibility set named_in_consent = false where group_id = $1 and not (company_id = any($2::uuid[]))", [
            groupId,
            named.map((m) => m.companyId),
          ]);
        }
        await client.query(
          `insert into lead_eligibility (group_id, company_id, matched_rule_id, named_in_consent, coverage_version)
           select $1, e.company_id, e.rule_id, e.named, e.coverage_version
           from unnest($2::uuid[], $3::text[], $4::boolean[], $5::int[]) as e(company_id, rule_id, named, coverage_version)
           on conflict (group_id, company_id) do update
             set named_in_consent = excluded.named_in_consent, matched_rule_id = excluded.matched_rule_id,
                 coverage_version = excluded.coverage_version, matched_at = now()`,
          [
            groupId,
            shownEligible.map((m) => m.companyId),
            shownEligible.map((m) => m.ruleId),
            shownEligible.map((m) => !removed.has(m.companyId)),
            shownEligible.map((m) => m.coverageVersion),
          ],
        );

        await client.query(
          `insert into attribution_touches (lead_id, touch, landing_url, referrer, utm_source, utm_medium, utm_campaign, source_category, evidence_level)
           values ($1, 'first', $2, $3, $4, $5, $6, $7, $8)`,
          [
            leadId, meta.pageUrl, safeOrigin(input.attribution.referrerOrigin), cleanUtm(input.attribution.utmSource),
            cleanUtm(input.attribution.utmMedium), cleanUtm(input.attribution.utmCampaign), source,
            input.attribution.utmSource || input.attribution.utmMedium ? "observed" : input.attribution.referrerOrigin ? "referrer_inferred" : "unknown",
          ],
        );

        await audit(
          {
            actorType: "consumer",
            action: dup ? "lead.submit_duplicate" : "lead.submit",
            entity: "lead",
            entityId: leadId,
            after: { group_id: groupId, status, selected_limit: input.limit, named: named.length, removed: removedMovers.length },
            ip: meta.ip,
          },
          client,
        );

        const group = await client.query<{ sharing_limit: number }>("select sharing_limit from lead_groups where id = $1", [groupId]);
        // Only a new, qualified request is announced; a repeat joins a request movers already know about.
        const recipients =
          status === "qualified" && !dup
            ? (
                await client.query<Recipient>(
                  `select u.email, m.company_id from company_memberships m join users u on u.id = m.user_id
                    where m.company_id = any($1::uuid[]) and m.status = 'active' and m.can_purchase
                    order by m.company_id, u.email`,
                  [named.map((m) => m.companyId)],
                )
              ).rows
            : [];
        return { leadId, groupId, referenceCode, limit: group.rows[0]!.sharing_limit, joinedReferenceCode: dup?.reference_code ?? null, recipients };
      });
    } catch (error) {
      if (isUniqueViolation(error, "leads_reference_code_key") && attempt < 2) continue;
      throw error;
    }
  }
  if (!outcome) throw new Error("Could not store the request");

  // ---------------------------------------------------------------- notify (after commit)
  const e = env();
  const manageUrl = `${e.WEB_URL}/my-request/${manageToken}/`;
  const namedText = named.map((m) => ({ displayName: m.displayName, usdotNumber: m.usdotNumber }));
  try {
    const mail = requestReceivedEmail({
      referenceCode: outcome.referenceCode,
      route,
      limit: outcome.limit,
      movers: namedText,
      manageUrl,
      webUrl: e.WEB_URL,
      joinedReferenceCode: outcome.joinedReferenceCode,
    });
    await enqueueEmail({ to: email, template: "request_received", ...mail, relatedType: "lead", relatedId: outcome.leadId }, pool, options);
  } catch {
    console.error("[leads] could not enqueue the request confirmation email");
  }
  const notice = requestAvailableEmail({ route, moveSize: size.value.moveSize, moveDate: when.value.moveDate, limit: outcome.limit, appUrl: e.APP_URL });
  for (const recipient of outcome.recipients) {
    try {
      await enqueueEmail({ to: recipient.email, template: "lead_available", ...notice, relatedType: "lead_group", relatedId: outcome.groupId }, pool, options);
    } catch {
      console.error("[leads] could not enqueue a new-request notice");
    }
  }

  return {
    ok: true,
    manageToken,
    confirmation: {
      referenceCode: outcome.referenceCode,
      limit: outcome.limit,
      movers: named.map(confirmationMover),
      route,
      moveDate: when.value.moveDate,
      moveDateFlexible: when.value.flexible,
      moveSize: size.value.moveSize,
      channels,
      joinedReferenceCode: outcome.joinedReferenceCode,
    },
  };
}

function confirmationMover(m: MatchedMover): ConfirmationMover {
  return { companyId: m.companyId, displayName: m.displayName, usdotNumber: m.usdotNumber, profileSlug: m.profileSlug, isDemo: m.isDemo };
}

function safeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}
