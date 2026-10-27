import type { Cents } from "./money";

/** Full lead as stored. Only server code that has verified a completed purchase may read contact fields. */
export interface LeadRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress?: string;
  notes?: string;
  originCity: string;
  originState: string;
  originZip: string;
  destCity: string;
  destState: string;
  destZip: string;
  moveDate: string;
  moveDateFlexible: boolean;
  moveSize: string;
  sourceCategory: "organic_search" | "paid_search" | "paid_social" | "referral" | "direct" | "other";
  createdAt: string;
  sharingLimit: number;
}

export interface LeadPreview {
  id: string;
  firstName: string;
  origin: { city: string; state: string; zip: string | null };
  destination: { city: string; state: string; zip: string | null };
  moveDate: string;
  moveDateFlexible: boolean;
  moveSize: string;
  sourceCategory: LeadRecord["sourceCategory"];
  createdAt: string;
  leadType: "exclusive" | "shared";
  buyerCount: number;
  maxBuyers: number;
  price: Cents;
}

/**
 * Allow-list projection for marketplace previews. Built field-by-field (never by spreading the record)
 * so a new sensitive column can't leak by default.
 */
export function toPreview(
  lead: LeadRecord,
  ctx: { buyerCount: number; price: Cents; showZip: boolean },
): LeadPreview {
  return {
    id: lead.id,
    firstName: lead.firstName,
    origin: { city: lead.originCity, state: lead.originState, zip: ctx.showZip ? lead.originZip : null },
    destination: { city: lead.destCity, state: lead.destState, zip: ctx.showZip ? lead.destZip : null },
    moveDate: lead.moveDate,
    moveDateFlexible: lead.moveDateFlexible,
    moveSize: lead.moveSize,
    sourceCategory: lead.sourceCategory,
    createdAt: lead.createdAt,
    leadType: lead.sharingLimit === 1 ? "exclusive" : "shared",
    buyerCount: ctx.buyerCount,
    maxBuyers: lead.sharingLimit,
    price: ctx.price,
  };
}
