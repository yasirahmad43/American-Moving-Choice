import { describe, expect, it } from "vitest";
import { CONTACT_INTRODUCTION_BODY, renderConsentText, consentTextSha256 } from "./consent";

describe("contact introduction consent", () => {
  it("records count/channel permission without disclosing company identities", () => {
    const movers = [{ displayName: "Private Carrier", usdotNumber: "1234567" }, { displayName: "Other Carrier", usdotNumber: "7654321" }];
    const text = renderConsentText(CONTACT_INTRODUCTION_BODY, { movers, limit: 2, channels: ["email"] });
    expect(text).toContain("up to 2 participating moving companies");
    expect(text).toContain("by email at the email address I provided");
    expect(text).toContain("identify itself when it contacts me");
    expect(text).not.toMatch(/Private Carrier|Other Carrier|1234567|USDOT|automated|STOP|rates|\{/);
    const browserText = renderConsentText(CONTACT_INTRODUCTION_BODY, {
      movers: movers.map(() => ({ displayName: "Participating moving company", usdotNumber: null })), limit: 2, channels: ["email"],
    });
    expect(consentTextSha256(browserText)).toBe(consentTextSha256(text));
  });

  it("keeps the count bound and explicit channel-scoped permission", () => {
    const movers = [{ displayName: "Private Carrier", usdotNumber: null }];
    const text = renderConsentText(CONTACT_INTRODUCTION_BODY, { movers, limit: 1, channels: ["sms"] });
    expect(text).toContain("text messages");
    expect(text).toContain("replying STOP");
    expect(text).not.toContain("by email");
    expect(() => renderConsentText(CONTACT_INTRODUCTION_BODY, { movers, limit: 2, channels: ["email"] })).toThrow();
  });
});
