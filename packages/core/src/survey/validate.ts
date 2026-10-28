/**
 * Per-step validation for the quote survey. The browser island uses it for inline errors and the
 * server re-runs every step on submission (never trusting the client). Each parser takes unknown
 * input and returns either the cleaned value or field errors written for consumers.
 *
 * Written without a schema library because @amc/core has no dependencies; the server wraps the
 * whole submission in a zod schema at the action boundary (@amc/server/leads).
 */
import { normalizeEmail, normalizeUsPhone } from "../dedupe";
import type { MoveSize, Service } from "../matching";
import {
  CHANNELS,
  NEEDS,
  isChannel,
  isSurveyMoveSize,
  isSurveyService,
  type Channel,
  type Need,
  type SurveyService,
} from "./types";

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;
export type StepResult<T, K extends string = string> = { ok: true; value: T } | { ok: false; errors: FieldErrors<K> };

const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
const fail = <K extends string>(errors: FieldErrors<K>): { ok: false; errors: FieldErrors<K> } => ({ ok: false, errors });

const record = (input: unknown): Record<string, unknown> => (input && typeof input === "object" ? (input as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value : "");

// ------------------------------------------------------------------ step 1: what you need

export function parseNeed(input: unknown): StepResult<{ need: Need }, "need"> {
  const need = record(input).need;
  if (typeof need === "string" && (NEEDS as readonly string[]).includes(need)) return ok({ need: need as Need });
  return fail({ need: "Choose what you need help with." });
}

// ------------------------------------------------------------------ step 2: where

/**
 * Cleans a typed or pasted ZIP: strips non-digits and keeps the first five (VD §9.2), so
 * " 02108" and "02108-1234" both give "02108". ZIP codes stay strings.
 */
export function cleanZip(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export interface WhereAnswers {
  originZip: string;
  destZip: string;
}

export function parseWhere(input: unknown): StepResult<WhereAnswers, keyof WhereAnswers> {
  const r = record(input);
  const originZip = cleanZip(text(r.originZip));
  const destZip = cleanZip(text(r.destZip));
  const errors: FieldErrors<keyof WhereAnswers> = {};
  if (originZip.length !== 5) errors.originZip = "Enter the 5-digit ZIP code you're moving from.";
  if (destZip.length !== 5) errors.destZip = "Enter the 5-digit ZIP code you're moving to.";
  return Object.keys(errors).length ? fail(errors) : ok({ originZip, destZip });
}

// ------------------------------------------------------------------ step 3: when

export interface WhenAnswers {
  /** The move date, or the earliest date of a flexible range (YYYY-MM-DD). */
  moveDate: string;
  flexible: boolean;
  /** The latest date of a flexible range; shown to the consumer only (leads stores the earliest). */
  latestDate: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** YYYY-MM-DD plus whole days. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** YYYY-MM-DD plus whole months, clamped to the month's last day. */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * A plausible move date: not in the past and within 12 months (lead lifecycle §4). `today` is the
 * visitor's (or server's) calendar date; the server allows one day of slack for time zones.
 */
export function parseWhen(input: unknown, today: string, slackDays = 0): StepResult<WhenAnswers, keyof WhenAnswers> {
  const r = record(input);
  const flexible = r.flexible === true || r.flexible === "true" || r.flexible === "on";
  const moveDate = text(r.moveDate).trim();
  const latestRaw = text(r.latestDate).trim();
  const earliestAllowed = addDays(today, -slackDays);
  const latestAllowed = addDays(addMonths(today, 12), slackDays);
  const errors: FieldErrors<keyof WhenAnswers> = {};
  const label = flexible ? "earliest date" : "move date";
  if (!isIsoDate(moveDate)) errors.moveDate = `Enter your ${label}.`;
  else if (moveDate < earliestAllowed) errors.moveDate = `Your ${label} can't be in the past.`;
  else if (moveDate > latestAllowed) errors.moveDate = `Your ${label} must be within the next 12 months.`;
  let latestDate: string | null = null;
  if (flexible) {
    if (!isIsoDate(latestRaw)) errors.latestDate = "Enter your latest date.";
    else if (isIsoDate(moveDate) && latestRaw < moveDate) errors.latestDate = "Your latest date can't be before your earliest date.";
    else if (latestRaw > latestAllowed) errors.latestDate = "Your latest date must be within the next 12 months.";
    else latestDate = latestRaw;
  }
  return Object.keys(errors).length ? fail(errors) : ok({ moveDate, flexible, latestDate });
}

// ------------------------------------------------------------------ step 4: size and services

export interface SizeAnswers {
  moveSize: MoveSize;
  services: SurveyService[];
}

export function parseSize(input: unknown): StepResult<SizeAnswers, keyof SizeAnswers> {
  const r = record(input);
  const errors: FieldErrors<keyof SizeAnswers> = {};
  if (!isSurveyMoveSize(r.moveSize)) errors.moveSize = "Choose the size of your move.";
  const rawServices = Array.isArray(r.services) ? r.services : [];
  if (!rawServices.every(isSurveyService)) errors.services = "Choose services from the list.";
  if (Object.keys(errors).length) return fail(errors);
  const services = [...new Set(rawServices as SurveyService[])];
  return ok({ moveSize: r.moveSize as MoveSize, services });
}

// ------------------------------------------------------------------ step 6: your details

/**
 * A short list of throwaway-address domains (lead lifecycle §4). Deliberately small: a provider
 * list replaces it when an email-validation service is adopted.
 */
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "fakeinbox.com",
  "mintemail.com",
  "emailondeck.com",
  "moakt.com",
]);

const EMAIL_SYNTAX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function emailSyntaxValid(email: string): boolean {
  if (email.length > 254 || !EMAIL_SYNTAX.test(email)) return false;
  const [local, domain] = email.split("@") as [string, string];
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") && /\.[A-Za-z]{2,}$/.test(domain);
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

const NAME = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

export interface DetailsAnswers {
  channels: Channel[];
  firstName: string;
  lastName: string;
  /** Normalized (trimmed, lowercased). */
  email: string;
  /** E.164, e.g. +15125550123. */
  phone: string;
}

export function parseDetails(input: unknown): StepResult<DetailsAnswers, keyof DetailsAnswers> {
  const r = record(input);
  const errors: FieldErrors<keyof DetailsAnswers> = {};
  const rawChannels = Array.isArray(r.channels) ? r.channels : [];
  const channels = CHANNELS.filter((c) => rawChannels.includes(c));
  if (!rawChannels.every(isChannel) || channels.length === 0) errors.channels = "Choose at least one way movers may contact you.";
  const firstName = text(r.firstName).trim().replace(/\s+/g, " ");
  const lastName = text(r.lastName).trim().replace(/\s+/g, " ");
  if (!firstName) errors.firstName = "Enter your first name.";
  else if (firstName.length > 60 || !NAME.test(firstName)) errors.firstName = "Enter your first name using letters only.";
  if (!lastName) errors.lastName = "Enter your last name.";
  else if (lastName.length > 60 || !NAME.test(lastName)) errors.lastName = "Enter your last name using letters only.";
  const email = normalizeEmail(text(r.email));
  if (!email) errors.email = "Enter your email address.";
  else if (!emailSyntaxValid(email)) errors.email = "Enter an email address like name@example.com.";
  else if (isDisposableEmail(email)) errors.email = "Use an email address you'll keep: movers can't reach a temporary address.";
  const rawPhone = text(r.phone).trim();
  const phone = rawPhone ? normalizeUsPhone(rawPhone) : null;
  if (!rawPhone) errors.phone = "Enter your phone number.";
  else if (!phone) errors.phone = "Enter a 10-digit US phone number, like 512-555-0123.";
  return Object.keys(errors).length ? fail(errors) : ok({ channels, firstName, lastName, email, phone: phone! });
}

/** Display form of an E.164 US number: (512) 555-0123. */
export function formatUsPhone(e164: string): string {
  const d = e164.replace(/^\+1/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164;
}

// ------------------------------------------------------------------ helpers shared by the island and the server

/** Services requested from movers for a need and the services picked. */
export function servicesForNeed(need: Need | null, picked: readonly SurveyService[]): Service[] {
  const set = new Set<Service>(picked);
  if (need === "loading_help") set.add("labor_only");
  return [...set];
}
