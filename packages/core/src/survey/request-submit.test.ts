import { describe, expect, it } from "vitest";
import { REQUEST_SUBMIT_BODY, REQUEST_SUBMIT_CHANNELS, REQUEST_SUBMIT_VERSION, REQUEST_INTAKE_BODY, isSubmitButtonConsent, isRequestIntakeConsent, renderConsentText, consentTextSha256 } from "./consent";

describe("compact request submission notice", () => {
  const render = (limit = 5) => renderConsentText(REQUEST_SUBMIT_BODY, { movers: [], limit, channels: REQUEST_SUBMIT_CHANNELS });

  it("shows the actual submit action with calls/email and linked-document labels", () => {
    expect(REQUEST_SUBMIT_VERSION).toBe("contact-request-submit-v1");
    expect(render()).toBe("By sending, I authorize American Moving Choice and up to 5 moving companies to receive my details and call or email me about my move. I accept the Terms of Use and acknowledge the Privacy Policy.");
    expect(render()).not.toMatch(/matching|available|text messages|automated|prerecorded|rates|STOP|\{[A-Z_]+\}/i);
    expect(isSubmitButtonConsent(REQUEST_SUBMIT_BODY)).toBe(true);
    expect(isRequestIntakeConsent(REQUEST_SUBMIT_BODY)).toBe(true);
    expect(isSubmitButtonConsent(REQUEST_INTAKE_BODY)).toBe(false);
  });

  it("does not change text or hash when current recipients change", () => {
    const text = renderConsentText(REQUEST_SUBMIT_BODY, { movers: [{ displayName: "Private Mover", usdotNumber: "123" }], limit: 5, channels: REQUEST_SUBMIT_CHANNELS });
    expect(text).toBe(render());
    expect(consentTextSha256(text)).toBe(consentTextSha256(render()));
    expect(text).not.toContain("Private Mover");
  });

  it("uses singular company wording and preserves an explicit positive ceiling", () => {
    expect(render(1)).toContain("American Moving Choice and 1 moving company");
    expect(() => render(0)).toThrow();
    expect(() => render(1.5)).toThrow();
  });

  it("cannot expand the notice into text or automated-phone permission", () => {
    for (const channels of [[], ["email"], ["call"], ["call", "sms", "email"]] as const) {
      expect(() => renderConsentText(REQUEST_SUBMIT_BODY, { movers: [], limit: 1, channels })).toThrow();
    }
  });
});
