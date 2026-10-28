/**
 * Saved payment methods (data-model §6; consent draft §9). A card is saved only with the
 * authorization checkbox ticked; the rendered authorization text, its version and hash, who
 * authorized, when and from which IP are stored with the card and in the audit log.
 */
import { createHash } from "node:crypto";
import { audit } from "../audit/audit";
import { getPool, isUuid, tx, type Queryable } from "../db/pool";
import { assertCan, resolveActor, type CompanyActor } from "../marketplace/permissions";
import { DEMO_CARD } from "./demo";
import { idOf, type StripeClientLike } from "./stripe";
import type { StoredPaymentMethod } from "./types";

export class PaymentMethodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentMethodError";
  }
}

export interface AuthorizationText {
  versionId: string;
  status: "draft" | "approved" | "retired";
  body: string;
}

/** The current card authorization text: the approved version if any, else the newest draft. */
export async function getAuthorizationText(db: Queryable = getPool()): Promise<AuthorizationText> {
  const result = await db.query<{ id: string; status: AuthorizationText["status"]; body: string }>(
    `select id, status, body from payment_authorization_texts
     where status <> 'retired'
     order by (status = 'approved') desc, effective_from desc nulls last, created_at desc limit 1`,
  );
  const row = result.rows[0];
  if (!row) throw new PaymentMethodError("The payment authorization text is missing. Contact support.");
  return { versionId: row.id, status: row.status, body: row.body };
}

/** Formats the authorization timestamp as shown and stored: "Oct 28, 2026, 3:04 PM EDT". */
export function formatAuthorizationTime(at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(at);
}

export function renderAuthorization(body: string, values: { userName: string; companyLegalName: string; timestamp: string }): string {
  return body
    .replaceAll("{user_name}", values.userName)
    .replaceAll("{company_legal_name}", values.companyLegalName)
    .replaceAll("{timestamp}", values.timestamp);
}

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

export interface PaymentMethodSummary {
  id: string;
  provider: "demo" | "stripe";
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  authorizedAt: Date;
  authorizedByName: string | null;
  authorizationTextVersion: string;
  authorizationRenderedText: string | null;
}

export async function listPaymentMethods(companyId: string, db: Queryable = getPool()): Promise<PaymentMethodSummary[]> {
  const result = await db.query<{
    id: string;
    provider: "demo" | "stripe";
    brand: string | null;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
    is_default: boolean;
    authorized_at: Date;
    full_name: string | null;
    authorization_text_version: string;
    authorization_rendered_text: string | null;
  }>(
    `select pm.id, pm.provider, pm.brand, pm.last4, pm.exp_month, pm.exp_year, pm.is_default, pm.authorized_at,
            u.full_name, pm.authorization_text_version, pm.authorization_rendered_text
     from payment_methods pm left join users u on u.id = pm.authorized_by
     where pm.company_id = $1 and pm.removed_at is null
     order by pm.is_default desc, pm.created_at desc`,
    [companyId],
  );
  return result.rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    brand: r.brand,
    last4: r.last4,
    expMonth: r.exp_month,
    expYear: r.exp_year,
    isDefault: r.is_default,
    authorizedAt: r.authorized_at,
    authorizedByName: r.full_name,
    authorizationTextVersion: r.authorization_text_version,
    authorizationRenderedText: r.authorization_rendered_text,
  }));
}

/** The company's default payment method for a provider, or null. */
export async function defaultPaymentMethod(db: Queryable, companyId: string, provider: "demo" | "stripe"): Promise<StoredPaymentMethod | null> {
  const result = await db.query<{ id: string; provider: "demo" | "stripe"; provider_pm_id: string; brand: string | null; last4: string | null }>(
    `select id, provider, provider_pm_id, brand, last4 from payment_methods
     where company_id = $1 and provider = $2 and removed_at is null
     order by is_default desc, created_at desc limit 1`,
    [companyId, provider],
  );
  const row = result.rows[0];
  return row ? { id: row.id, provider: row.provider, providerPmId: row.provider_pm_id, brand: row.brand, last4: row.last4 } : null;
}

interface SaveInput {
  provider: "demo" | "stripe";
  providerPmId: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

/**
 * The time shown in the authorization text on the billing form. The stored text must be exactly
 * what the user saw, so the form sends the time it displayed; it must be recent.
 */
export function authorizationShownAt(value: string | null | undefined, now = new Date()): Date | null {
  if (!value) return null;
  const shown = new Date(value);
  const age = now.getTime() - shown.getTime();
  if (Number.isNaN(shown.getTime()) || age < -60_000 || age > 60 * 60_000) return null;
  return shown;
}

async function insertAuthorizedMethod(actor: CompanyActor, card: SaveInput, authorized: boolean, db: Queryable, shownAt?: Date | null): Promise<string> {
  if (!authorized) throw new PaymentMethodError("Tick the authorization box to save this payment method.");
  const text = await getAuthorizationText(db);
  const who = await db.query<{ full_name: string | null; email: string; legal_name: string }>(
    `select u.full_name, u.email, c.legal_name from users u, companies c where u.id = $1 and c.id = $2`,
    [actor.userId, actor.companyId],
  );
  const names = who.rows[0];
  if (!names) throw new PaymentMethodError("Your account could not be found.");
  const now = new Date();
  const rendered = renderAuthorization(text.body, {
    userName: names.full_name?.trim() || names.email,
    companyLegalName: names.legal_name,
    timestamp: formatAuthorizationTime(shownAt ?? now),
  });
  await db.query("update payment_methods set is_default = false where company_id = $1 and is_default", [actor.companyId]);
  const inserted = await db.query<{ id: string }>(
    `insert into payment_methods (company_id, provider, provider_pm_id, brand, last4, exp_month, exp_year,
       authorization_text_version, authorized_by, authorized_at, authorized_ip, is_default,
       authorization_rendered_text, authorization_text_sha256)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13)
     returning id`,
    [actor.companyId, card.provider, card.providerPmId, card.brand, card.last4, card.expMonth, card.expYear, text.versionId,
      actor.userId, now, actor.ip ?? null, rendered, sha256(rendered)],
  );
  const id = inserted.rows[0]!.id;
  await audit(
    {
      actorType: "user",
      actorId: actor.userId,
      companyId: actor.companyId,
      action: "payment_method.add",
      entity: "payment_method",
      entityId: id,
      after: { provider: card.provider, brand: card.brand, last4: card.last4, authorization_text_version: text.versionId },
      ip: actor.ip ?? null,
    },
    db,
  );
  return id;
}

/** Saves the fictional demo card (demo mode). Owner and billing roles only. */
export async function saveDemoCard(input: { userId: string; companyId: string; ip?: string | null; authorized: boolean; shownAt?: Date | null }): Promise<string> {
  return tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "billing.manage", "Only the owner or a billing member can add payment methods.");
    await client.query("select 1 from companies where id = $1 for update", [actor.companyId]);
    const existing = await client.query<{ id: string }>(
      "select id from payment_methods where company_id = $1 and provider = 'demo' and removed_at is null limit 1",
      [actor.companyId],
    );
    if (existing.rows[0]) throw new PaymentMethodError("A demo card is already saved.");
    return insertAuthorizedMethod(
      actor,
      {
        provider: "demo",
        providerPmId: `demo_pm_${crypto.randomUUID()}`,
        brand: DEMO_CARD.brand,
        last4: DEMO_CARD.last4,
        expMonth: DEMO_CARD.expMonth,
        expYear: new Date().getUTCFullYear() + 3,
      },
      input.authorized,
      client,
      input.shownAt,
    );
  });
}

/** Ensures the company has a Stripe customer and returns its ID. */
async function ensureStripeCustomer(stripe: StripeClientLike, companyId: string, db: Queryable): Promise<string> {
  const found = await db.query<{ stripe_customer_id: string | null; legal_name: string }>(
    "select stripe_customer_id, legal_name from companies where id = $1 for update",
    [companyId],
  );
  const row = found.rows[0];
  if (!row) throw new PaymentMethodError("Company not found.");
  if (row.stripe_customer_id) return row.stripe_customer_id;
  const customer = await stripe.customers.create(
    { name: row.legal_name, metadata: { company_id: companyId } },
    { idempotencyKey: `amc_customer_${companyId}` },
  );
  await db.query("update companies set stripe_customer_id = $2 where id = $1", [companyId, customer.id]);
  return customer.id;
}

/** Starts saving a card with Stripe: returns the SetupIntent client secret for Stripe.js. */
export async function beginStripeSetup(
  stripe: StripeClientLike,
  input: { userId: string; companyId: string },
): Promise<{ clientSecret: string }> {
  return tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "billing.manage", "Only the owner or a billing member can add payment methods.");
    const customer = await ensureStripeCustomer(stripe, actor.companyId, client);
    const intent = await stripe.setupIntents.create({
      customer,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: { company_id: actor.companyId, user_id: actor.userId },
    });
    if (!intent.client_secret) throw new PaymentMethodError("The card form couldn't be started. Try again.");
    return { clientSecret: intent.client_secret };
  });
}

/**
 * Records a card saved through a confirmed SetupIntent. Everything is re-read from Stripe: the
 * intent must have succeeded for off-session use, for this company's customer, started by this
 * company (metadata).
 */
export async function completeStripeSetup(
  stripe: StripeClientLike,
  input: { userId: string; companyId: string; ip?: string | null; setupIntentId: string; authorized: boolean; shownAt?: Date | null },
): Promise<string> {
  if (!/^seti_[A-Za-z0-9]+$/.test(input.setupIntentId)) throw new PaymentMethodError("The card confirmation is invalid.");
  const intent = await stripe.setupIntents.retrieve(input.setupIntentId);
  return tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "billing.manage", "Only the owner or a billing member can add payment methods.");
    const company = await client.query<{ stripe_customer_id: string | null }>(
      "select stripe_customer_id from companies where id = $1 for update",
      [actor.companyId],
    );
    const customer = company.rows[0]?.stripe_customer_id;
    const pmId = idOf(intent.payment_method);
    if (
      intent.status !== "succeeded" ||
      intent.usage !== "off_session" ||
      !customer ||
      idOf(intent.customer) !== customer ||
      intent.metadata?.company_id !== actor.companyId ||
      !pmId
    ) {
      throw new PaymentMethodError("The card couldn't be confirmed. Try again.");
    }
    const already = await client.query("select 1 from payment_methods where provider = 'stripe' and provider_pm_id = $1", [pmId]);
    if (already.rowCount) throw new PaymentMethodError("This card is already saved.");
    const pm = await stripe.paymentMethods.retrieve(pmId);
    const last4 = pm.card?.last4 && /^[0-9]{4}$/.test(pm.card.last4) ? pm.card.last4 : null;
    return insertAuthorizedMethod(
      actor,
      {
        provider: "stripe",
        providerPmId: pmId,
        brand: pm.card?.brand ?? null,
        last4,
        expMonth: pm.card?.exp_month ?? null,
        expYear: pm.card?.exp_year ?? null,
      },
      input.authorized,
      client,
      input.shownAt,
    );
  });
}

/** Removes a payment method (stops future charges; purchases already made stand). */
export async function removePaymentMethod(input: { userId: string; companyId: string; ip?: string | null; paymentMethodId: string }): Promise<void> {
  if (!isUuid(input.paymentMethodId)) throw new PaymentMethodError("That payment method was not found.");
  await tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "billing.manage", "Only the owner or a billing member can remove payment methods.");
    const found = await client.query<{ is_default: boolean }>(
      "select is_default from payment_methods where id = $1 and company_id = $2 and removed_at is null for update",
      [input.paymentMethodId, actor.companyId],
    );
    if (!found.rowCount) throw new PaymentMethodError("That payment method was not found.");
    await client.query("update payment_methods set removed_at = now(), is_default = false where id = $1", [input.paymentMethodId]);
    if (found.rows[0]!.is_default) {
      await client.query(
        `update payment_methods set is_default = true where id = (
           select id from payment_methods where company_id = $1 and removed_at is null order by created_at desc limit 1)`,
        [actor.companyId],
      );
    }
    await audit(
      { actorType: "user", actorId: actor.userId, companyId: actor.companyId, action: "payment_method.remove", entity: "payment_method", entityId: input.paymentMethodId, ip: actor.ip ?? null },
      client,
    );
  });
}
