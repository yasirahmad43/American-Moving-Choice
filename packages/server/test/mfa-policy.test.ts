import { describe, expect, it } from "vitest";
import { demoAdminPasswordOnly } from "../src/auth/mfa-policy";

describe("owner-requested demo admin sign-in", () => {
  it("requires the explicit opt-in and an admin role in a demo", () => {
    expect(demoAdminPasswordOnly("super_admin", { DEMO_MODE: true, DEMO_ADMIN_PASSWORD_ONLY: true })).toBe(true);
    expect(demoAdminPasswordOnly("ops", { DEMO_MODE: true, DEMO_ADMIN_PASSWORD_ONLY: true })).toBe(true);
    expect(demoAdminPasswordOnly(null, { DEMO_MODE: true, DEMO_ADMIN_PASSWORD_ONLY: true })).toBe(false);
    expect(demoAdminPasswordOnly("super_admin", { DEMO_MODE: true, DEMO_ADMIN_PASSWORD_ONLY: false })).toBe(false);
  });
  it("cannot remove live MFA even when the demo opt-in remains configured", () => {
    expect(demoAdminPasswordOnly("super_admin", { DEMO_MODE: false, DEMO_ADMIN_PASSWORD_ONLY: true })).toBe(false);
    expect(demoAdminPasswordOnly(null, { DEMO_MODE: false, DEMO_ADMIN_PASSWORD_ONLY: true })).toBe(false);
  });
});
