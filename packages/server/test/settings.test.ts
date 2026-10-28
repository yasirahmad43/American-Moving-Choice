import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { audit } from "../src/audit/audit";
import { closePool, getPool, withCompany } from "../src/db/pool";
import { SETTING_DEFINITIONS, SettingValidationError, getMaxSharingLimit, getSetting, getSettings, setSetting } from "../src/settings/settings";
import { createUser, resetDatabase } from "./helpers";

const pool = () => getPool();

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("settings", () => {
  it("reads every seeded setting with its documented value", async () => {
    expect(await getSettings()).toEqual({
      require_mc_number: true,
      max_sharing_limit: 5,
      sale_window_hours: 72,
      local_max_miles: 50,
      quote_invite_delay_days: 7,
      post_move_invite_days: 21,
      rank_min_reviews: 5,
      duplicate_window_days: 30,
      new_to_network_days: 90,
      claim_window_hours: 72,
      show_zip_in_preview: false,
      active_policy_version: "share-stepdown-v1-proposal",
      active_consent_version: "consent-v0-draft",
    });
    expect(await getMaxSharingLimit()).toBe(5);
  });

  it("falls back to the default for missing or invalid rows", async () => {
    await pool().query("delete from platform_settings where key = 'claim_window_hours'");
    await pool().query("update platform_settings set value = '\"lots\"' where key = 'rank_min_reviews'");
    expect(await getSetting("claim_window_hours")).toBe(SETTING_DEFINITIONS.claim_window_hours.default);
    expect(await getSetting("rank_min_reviews")).toBe(5);
  });

  it("validates, stores and audits changes", async () => {
    const adminId = await createUser({ email: "settings-admin@example.com", admin: "super_admin" });
    expect(await setSetting("max_sharing_limit", 4, { userId: adminId, ip: "192.0.2.1" })).toEqual({ before: 5, after: 4 });
    expect(await getMaxSharingLimit()).toBe(4);
    const row = await pool().query("select value, updated_by from platform_settings where key = 'max_sharing_limit'");
    expect(row.rows[0]).toEqual({ value: 4, updated_by: adminId });
    const audited = await pool().query("select actor_type, actor_id, entity_id, before, after, ip from audit_log where action = 'settings.update'");
    expect(audited.rows).toEqual([
      { actor_type: "admin", actor_id: adminId, entity_id: "max_sharing_limit", before: { value: 5 }, after: { value: 4 }, ip: "192.0.2.1" },
    ]);

    await expect(setSetting("max_sharing_limit", 0, { userId: adminId })).rejects.toBeInstanceOf(SettingValidationError);
    await expect(setSetting("active_policy_version", "no-such-policy", { userId: adminId })).rejects.toThrow(/no sharing policy/);
    await expect(setSetting("active_consent_version", "no-such-text", { userId: adminId })).rejects.toThrow(/no consent text/);
    expect(await getMaxSharingLimit()).toBe(4);
  });
});

describe("audit log and company transactions", () => {
  it("writes append-only audit rows", async () => {
    await audit({ actorType: "system", actorId: "test", action: "test.event", entity: "test", entityId: "1", after: { ok: true } });
    const row = await pool().query("select actor_type, action, after from audit_log where action = 'test.event'");
    expect(row.rows[0]).toEqual({ actor_type: "system", action: "test.event", after: { ok: true } });
    await expect(pool().query("update audit_log set action = 'changed'")).rejects.toThrow(/append_only/);
  });

  it("scopes app.company_id to the withCompany transaction", async () => {
    const companyId = "c0000000-0000-4000-8000-000000000999";
    const inside = await withCompany(companyId, async (client) => {
      const result = await client.query<{ value: string }>("select current_setting('app.company_id', true) as value");
      return result.rows[0]!.value;
    });
    expect(inside).toBe(companyId);
    const outside = await pool().query<{ value: string | null }>("select nullif(current_setting('app.company_id', true), '') as value");
    expect(outside.rows[0]!.value).toBeNull();
    await expect(withCompany("not-a-uuid", async () => 1)).rejects.toThrow(/UUID/);
  });
});
