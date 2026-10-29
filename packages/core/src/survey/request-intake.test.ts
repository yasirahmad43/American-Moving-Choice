import { describe, expect, it } from "vitest";
import { CONTACT_INTRODUCTION_BODY, REQUEST_INTAKE_BODY, isRequestIntakeConsent, renderConsentText, consentTextSha256 } from "./consent";
import { requestCountOptions, isRequestCount, countOptions } from "./count-options";

const mover = { displayName: "Example Moving", usdotNumber: "1234567" };

describe("request intake independent of current coverage", () => {
  it("renders zero recipients without an availability claim", () => {
    const text = renderConsentText(REQUEST_INTAKE_BODY, { movers: [], limit: 5, channels: ["email"] });
    expect(text).toContain("American Moving Choice and up to 5 participating moving companies");
    expect(text).toContain("by email at the email address I provided");
    expect(text).not.toMatch(/match|available|serve|automated|prerecorded|Message and data rates|STOP|\{[A-Z_]+\}/i);
    expect(isRequestIntakeConsent(REQUEST_INTAKE_BODY)).toBe(true);
  });
  it("keeps permission text stable when recipient availability changes", () => {
    const input = { limit: 5, channels: ["call", "sms", "email"] as const };
    const empty = renderConsentText(REQUEST_INTAKE_BODY, { ...input, movers: [] });
    const present = renderConsentText(REQUEST_INTAKE_BODY, { ...input, movers: [mover] });
    expect(consentTextSha256(empty)).toBe(consentTextSha256(present));
    expect(empty).toContain("Calls and text messages may use automated technology");
    expect(empty).toContain("Message and data rates may apply");
    expect(empty).toContain("replying STOP");
    expect(empty).not.toContain(mover.displayName);
  });
  it("retains singular phrasing and explicit permission validation", () => {
    expect(renderConsentText(REQUEST_INTAKE_BODY, { movers: [], limit: 1, channels: ["call"] })).toContain("and 1 participating moving company");
    expect(() => renderConsentText(REQUEST_INTAKE_BODY, { movers: [], limit: 0, channels: ["email"] })).toThrow();
    expect(() => renderConsentText(REQUEST_INTAKE_BODY, { movers: [], limit: 1, channels: [] })).toThrow();
  });
  it("preserves recipient rules for historical consent versions", () => {
    expect(() => renderConsentText(CONTACT_INTRODUCTION_BODY, { movers: [], limit: 1, channels: ["email"] })).toThrow();
    expect(() => renderConsentText(CONTACT_INTRODUCTION_BODY, { movers: [mover], limit: 5, channels: ["email"] })).toThrow();
    expect(isRequestIntakeConsent(CONTACT_INTRODUCTION_BODY)).toBe(false);
  });
  it("offers a contact ceiling independent of coverage", () => {
    expect(requestCountOptions(5)).toEqual([1, 2, 3, 4, 5].map(value => ({ value, enabled: true })));
    expect(countOptions(0, 5).every(option => !option.enabled)).toBe(true);
    expect(isRequestCount(5, 5)).toBe(true);
    for (const value of [0, 6, 1.5, "1", null]) expect(isRequestCount(value, 5)).toBe(false);
  });
});
