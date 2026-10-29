/**
 * Consent text rendering (build plan §7.2; lead lifecycle §6; implications §3.1, §3.2, §3.6).
 *
 * The body comes from consent_text_versions (the active contact_consent version, today
 * consent-v0-draft). Rendering names the movers and the number and scopes the wording to the
 * channels chosen; the result is exactly what the Review and send checkbox shows, and it is
 * stored and hashed in the consent record. The contact box never contains Terms or privacy text:
 * that is a separate control with its own version (terms-ack-v0-draft).
 *
 * Placeholders a body may use:
 *   {N}          the number chosen ("up to {N}")
 *   {MOVERS}     the named movers in the order shown, "Name (USDOT n)" joined by "; "
 *   {CHANNELS}   how the movers may make contact, scoped to the channels chosen
 *   {AUTOMATED}  the automated-technology sentence, only for calls or texts (with a trailing space)
 *   {RATES}      " Message and data rates may apply." only for texts
 *   {STOP}       "replying STOP to a text or by " only for texts
 *
 * consent-v0-draft has only {N}. For it, the movers go in a heading line above the body, the way
 * consent draft §5's summary block names them, and its fixed call-and-text wording is scoped to
 * the channels chosen ("Choosing email only removes the call and text wording", implications
 * §3.1): the contact clause, the rates sentence and the STOP instruction are rewritten below.
 * With calls, texts and email all chosen, only the contact clause's word order changes.
 * [Counsel: a channel-scoped consent version with these placeholders would replace this rewrite.]
 */
import { sha256Hex } from "./sha256";
import { CHANNELS, type Channel } from "./types";

/** New requests use count/channel permission. Company identities are introduced on contact. */
export const CONTACT_INTRODUCTION_VERSION = "contact-introduction-v1-draft";
export const CONTACT_INTRODUCTION_BODY = "{RECIPIENT_SCOPE} I agree that up to {N} participating moving companies matched to my move may receive my contact details and contact me about my move {CHANNELS}. Each company will identify itself when it contacts me. {AUTOMATED}Consent isn't required to buy any goods or services.{RATES} I can opt out at any time by {STOP}contacting the mover or American Moving Choice.";

/** Request intake is independent of current network availability; legacy evidence stays unchanged. */
export const REQUEST_INTAKE_VERSION = "contact-request-intake-v1";
export const REQUEST_INTAKE_BODY = "{REQUEST_INTAKE_SCOPE} I agree to be contacted about my move {CHANNELS} by American Moving Choice and up to {N} participating moving companies, and to share my move and contact details with those companies. Each moving company will identify itself when it contacts me. {AUTOMATED}Consent isn't required to buy any goods or services.{RATES} I can opt out at any time by {STOP}contacting the mover or American Moving Choice.";
export const isRequestIntakeConsent = (body: string): boolean => body.includes("{REQUEST_INTAKE_SCOPE}");

export interface ConsentMover {
  displayName: string;
  usdotNumber: string | null;
}

export interface ConsentRenderInput {
  movers: readonly ConsentMover[];
  limit: number;
  channels: readonly Channel[];
}

function orderedChannels(channels: readonly Channel[]): Channel[] {
  return CHANNELS.filter((c) => channels.includes(c));
}

const moverLabel = (m: ConsentMover) => (m.usdotNumber ? `${m.displayName} (USDOT ${m.usdotNumber})` : m.displayName);

/** "by calls and text messages at the phone number I provided and by email at the email address I provided" */
export function channelPhrase(channels: readonly Channel[]): string {
  const set = orderedChannels(channels);
  const phone = set.filter((c) => c !== "email");
  const parts: string[] = [];
  if (phone.length) {
    const kinds = phone.map((c) => (c === "call" ? "calls" : "text messages")).join(" and ");
    parts.push(`by ${kinds} at the phone number I provided`);
  }
  if (set.includes("email")) parts.push("by email at the email address I provided");
  return parts.join(" and ");
}

export function automatedSentence(channels: readonly Channel[]): string {
  const call = channels.includes("call");
  const sms = channels.includes("sms");
  if (call && sms) return "Calls and text messages may use automated technology or prerecorded voice. ";
  if (call) return "Calls may use automated technology or prerecorded voice. ";
  if (sms) return "Text messages may use automated technology. ";
  return "";
}

/** consent-v0-draft's fixed wording, rewritten per channel when the body has no {CHANNELS}. */
const V0_CONTACT_CLAUSE = "at the phone number and email I provided, including by calls and text messages that may use automated technology or prerecorded voice";
const V0_RATES = " Message and data rates may apply.";
const V0_STOP = "by replying STOP to a text or by contacting";

function automatedClause(channels: readonly Channel[]): string {
  const call = channels.includes("call");
  const sms = channels.includes("sms");
  if (call && sms) return ", including calls and text messages that may use automated technology or prerecorded voice";
  if (call) return ", including calls that may use automated technology or prerecorded voice";
  if (sms) return ", including text messages that may use automated technology";
  return "";
}

function scopeFixedWording(body: string, channels: readonly Channel[]): string {
  let out = body.replace(V0_CONTACT_CLAUSE, `${channelPhrase(channels)}${automatedClause(channels)}`);
  if (!channels.includes("sms")) out = out.replace(V0_RATES, "").replace(V0_STOP, "by contacting");
  return out;
}

export class ConsentRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentRenderError";
  }
}

export function renderConsentText(versionBody: string, input: ConsentRenderInput): string {
  const channels = orderedChannels(input.channels);
  const intake = isRequestIntakeConsent(versionBody);
  if (!intake && input.movers.length === 0) throw new ConsentRenderError("consent must name at least one mover");
  if (!Number.isInteger(input.limit) || input.limit < 1) throw new ConsentRenderError("limit must be a positive whole number");
  if (!intake && input.limit > input.movers.length) throw new ConsentRenderError("limit cannot exceed the movers named");
  if (channels.length === 0) throw new ConsentRenderError("at least one channel is required");

  const list = input.movers.map(moverLabel).join("; ");
  const sms = channels.includes("sms");
  const values: Record<string, string> = {
    N: String(input.limit),
    MOVERS: list,
    CHANNELS: channelPhrase(channels),
    AUTOMATED: automatedSentence(channels),
    RATES: sms ? " Message and data rates may apply." : "",
    STOP: sms ? "replying STOP to a text or by " : "",
    RECIPIENT_SCOPE: "",
    REQUEST_INTAKE_SCOPE: "",
  };
  let body = versionBody.replace(/\{(N|MOVERS|CHANNELS|AUTOMATED|RATES|STOP|RECIPIENT_SCOPE|REQUEST_INTAKE_SCOPE)\}/g, (_, key: string) => values[key] ?? "");
  if (!versionBody.includes("{CHANNELS}")) body = scopeFixedWording(body, channels);
  // Preserve legacy version rendering exactly, including its named-company heading. The new
  // explicit marker suppresses that heading; it is never inferred from a client preference.
  if (intake || versionBody.includes("{RECIPIENT_SCOPE}")) return body.trim().replace("up to 1 participating moving companies", "1 participating moving company");
  if (versionBody.includes("{MOVERS}")) return body;
  const heading =
    input.limit === 1
      ? `Only 1 of these movers may receive your details and contact you: ${list}.`
      : `Up to ${input.limit} of these movers may receive your details and contact you: ${list}.`;
  return `${heading}\n\n${body}`;
}

/** sha256 hex of the rendered text, as consent_records.rendered_text_sha256 checks it. */
export function consentTextSha256(rendered: string): string {
  return sha256Hex(rendered);
}
