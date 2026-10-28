/**
 * Small marketplace world for the S6 tests: approved companies with prices, nationwide coverage
 * and an owner, and request groups naming chosen companies in the consumer's consent.
 */
import { randomUUID } from "node:crypto";
import { getPool } from "../src/db/pool";
import { createUser } from "./helpers";

let usdot = 9100000;

export interface TestCompany {
  companyId: string;
  ownerId: string;
  name: string;
  usdot: string;
}

export async function makeCompany(input: { name: string; exclusive?: number; shared?: number }): Promise<TestCompany> {
  const pool = getPool();
  usdot += 1;
  const company = await pool.query<{ id: string }>(
    `insert into companies (legal_name, status, usdot_number, mc_number, is_demo, approved_at)
     values ($1, 'approved', $2, $3, true, now()) returning id`,
    [input.name, String(usdot), `MC${usdot}`],
  );
  const companyId = company.rows[0]!.id;
  await pool.query(
    `insert into company_profiles (company_id, slug, display_name, public_status) values ($1, $2, $3, 'live')`,
    [companyId, `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${usdot}`, input.name],
  );
  await pool.query(
    `insert into company_capabilities (company_id, move_types, move_sizes, services)
     values ($1, '{local,intrastate,interstate}', '{studio,1br,2br,3br,4br_plus}', '{full_service,packing,storage}')`,
    [companyId],
  );
  await pool.query("insert into coverage_rules (company_id, kind, label) values ($1, 'include', 'Nationwide')", [companyId]);
  await pool.query("insert into company_prices (company_id, exclusive_cents, shared_cents, set_by) values ($1, $2, $3, 'test')", [
    companyId,
    input.exclusive ?? 9000,
    input.shared ?? 4000,
  ]);
  const ownerId = await createUser({ email: `owner-${usdot}@example.com`, fullName: `${input.name} Owner` });
  await addMember(companyId, ownerId, "owner", true);
  return { companyId, ownerId, name: input.name, usdot: String(usdot) };
}

export async function addMember(companyId: string, userId: string, role: "owner" | "manager" | "agent" | "billing", canPurchase = false): Promise<void> {
  await getPool().query("insert into company_memberships (company_id, user_id, role, can_purchase) values ($1, $2, $3, $4)", [companyId, userId, role, canPurchase]);
}

export async function makeMember(company: TestCompany, role: "owner" | "manager" | "agent" | "billing", canPurchase = false): Promise<string> {
  const userId = await createUser({ email: `${role}-${randomUUID().slice(0, 8)}@example.com`, fullName: `Test ${role}` });
  await addMember(company.companyId, userId, role, canPurchase);
  return userId;
}

export interface TestRequest {
  groupId: string;
  leadId: string;
  email: string;
  lastName: string;
  phone: string;
}

let requestNo = 0;

export async function makeRequest(input: { limit: number; named: TestCompany[]; notNamed?: TestCompany[] }): Promise<TestRequest> {
  const pool = getPool();
  requestNo += 1;
  const group = await pool.query<{ id: string }>(
    `insert into lead_groups (sharing_limit, policy_version, expires_at) values ($1, 'share-stepdown-v1-proposal', now() + interval '72 hours') returning id`,
    [input.limit],
  );
  const groupId = group.rows[0]!.id;
  const email = `consumer${requestNo}@example.com`;
  const lastName = `Privatesurname${requestNo}`;
  const phone = `+1512555${String(1000 + requestNo).slice(-4)}`;
  const lead = await pool.query<{ id: string }>(
    `insert into leads (group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip, status,
       move_date, move_size, services, origin_city, origin_state, origin_county_fips, dest_city, dest_state, dest_county_fips,
       distance_miles, move_type, channel_scope, source_category)
     values ($1, $2, 'Jordan', $3, $4, $5, '78704', '77006', 'qualified', current_date + 30, '2br', '{packing}',
       'Austin', 'TX', '48453', 'Houston', 'TX', '48201', 146, 'intrastate', '{call,sms,email}', 'organic_search')
     returning id`,
    [groupId, input.limit, lastName, email, phone],
  );
  for (const company of input.named) {
    await pool.query(
      `insert into lead_eligibility (group_id, company_id, named_in_consent, coverage_version)
       select $1, id, true, coverage_version from companies where id = $2`,
      [groupId, company.companyId],
    );
  }
  for (const company of input.notNamed ?? []) {
    await pool.query(
      `insert into lead_eligibility (group_id, company_id, named_in_consent, coverage_version)
       select $1, id, false, coverage_version from companies where id = $2`,
      [groupId, company.companyId],
    );
  }
  return { groupId, leadId: lead.rows[0]!.id, email, lastName, phone };
}

/** Saves a demo card the way the billing page does. */
export async function addDemoCard(company: TestCompany): Promise<void> {
  const { saveDemoCard } = await import("../src/payments/methods");
  await saveDemoCard({ userId: company.ownerId, companyId: company.companyId, authorized: true, ip: "203.0.113.5" });
}

export const actorOf = (company: TestCompany, userId = company.ownerId) => ({ userId, companyId: company.companyId });
