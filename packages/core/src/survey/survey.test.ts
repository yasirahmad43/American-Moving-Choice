import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  addMonths,
  cleanZip,
  consentTextSha256,
  countOptions,
  generateReferenceCode,
  isReferenceCode,
  isSelectableCount,
  leadTypeFor,
  maxSelectableCount,
  neutralOrder,
  parseDetails,
  parseNeed,
  parseSize,
  parseWhen,
  parseWhere,
  randomBelow,
  renderConsentText,
  secureShuffle,
  servicesForNeed,
  sha256Hex,
  type RandomBytes,
} from "./index";

const V1 =
  "I agree that up to {N} of these movers may contact me about my move: {MOVERS}. They may contact me {CHANNELS}. {AUTOMATED}Consent isn't required to buy any goods or services.{RATES} I can opt out at any time by {STOP}contacting the mover or American Moving Choice.";
const V0 =
  "I agree that up to {N} of the movers listed above may contact me about my move at the phone number and email I provided, including by calls and text messages that may use automated technology or prerecorded voice. Consent isn't required to buy any goods or services. Message and data rates may apply. I can opt out at any time by replying STOP to a text or by contacting the mover or American Moving Choice.";

const movers = [
  { displayName: "Demo Lone Star Relocation Co.", usdotNumber: "9000001" },
  { displayName: "Demo Bluebonnet Hill Movers", usdotNumber: "9000002" },
  { displayName: "Demo Pecan Grove Moving Co.", usdotNumber: "9000003" },
];

describe("countOptions", () => {
  it("offers 1 to the admin maximum and disables numbers above the movers available", () => {
    const options = countOptions(2, 5);
    expect(options.map((o) => o.value)).toEqual([1, 2, 3, 4, 5]);
    expect(options.filter((o) => o.enabled).map((o) => o.value)).toEqual([1, 2]);
    expect(options[2]).toMatchObject({ enabled: false, reason: "Only 2 movers in our network serve your move." });
    expect(countOptions(1, 5)[1]!.reason).toBe("Only 1 mover in our network serves your move.");
  });

  it("caps at min(admin maximum, eligible)", () => {
    expect(countOptions(9, 5).every((o) => o.enabled)).toBe(true);
    expect(countOptions(9, 5)).toHaveLength(5);
    expect(maxSelectableCount(9, 5)).toBe(5);
    expect(maxSelectableCount(3, 5)).toBe(3);
    expect(isSelectableCount(3, 3, 5)).toBe(true);
    expect(isSelectableCount(4, 3, 5)).toBe(false);
    expect(isSelectableCount(0, 3, 5)).toBe(false);
    expect(isSelectableCount(1.5, 3, 5)).toBe(false);
    expect(leadTypeFor(1)).toBe("exclusive");
    expect(leadTypeFor(2)).toBe("shared");
  });
});

describe("sha256Hex", () => {
  it("matches node:crypto for ASCII, Unicode and block-boundary lengths", () => {
    for (const input of ["", "abc", "Dallas → Houston · 2 bedrooms", "x".repeat(55), "y".repeat(56), "z".repeat(64), "é".repeat(200)]) {
      expect(sha256Hex(input)).toBe(createHash("sha256").update(input, "utf8").digest("hex"));
    }
  });
});

describe("renderConsentText", () => {
  it("names the movers in order with the number and every chosen channel", () => {
    const text = renderConsentText(V1, { movers, limit: 2, channels: ["email", "call", "sms"] });
    expect(text).toBe(
      "I agree that up to 2 of these movers may contact me about my move: Demo Lone Star Relocation Co. (USDOT 9000001); Demo Bluebonnet Hill Movers (USDOT 9000002); Demo Pecan Grove Moving Co. (USDOT 9000003). They may contact me by calls and text messages at the phone number I provided and by email at the email address I provided. Calls and text messages may use automated technology or prerecorded voice. Consent isn't required to buy any goods or services. Message and data rates may apply. I can opt out at any time by replying STOP to a text or by contacting the mover or American Moving Choice.",
    );
    expect(consentTextSha256(text)).toBe(createHash("sha256").update(text, "utf8").digest("hex"));
  });

  it("drops the call and text wording for email only", () => {
    const text = renderConsentText(V1, { movers: movers.slice(0, 1), limit: 1, channels: ["email"] });
    expect(text).toContain("They may contact me by email at the email address I provided. Consent isn't required");
    expect(text).not.toMatch(/call|text message|STOP|rates/i);
  });

  it("scopes the automated-technology sentence to the phone channels chosen", () => {
    expect(renderConsentText(V1, { movers, limit: 1, channels: ["call"] })).toContain("by calls at the phone number I provided. Calls may use automated technology or prerecorded voice.");
    const sms = renderConsentText(V1, { movers, limit: 1, channels: ["sms"] });
    expect(sms).toContain("Text messages may use automated technology. ");
    expect(sms).toContain("replying STOP");
  });

  it("puts the named list above consent-v0-draft and scopes its fixed wording to the channels", () => {
    const all = renderConsentText(V0, { movers: movers.slice(0, 2), limit: 2, channels: ["call", "sms", "email"] });
    const [heading, body] = all.split("\n\n");
    expect(heading).toBe(
      "Up to 2 of these movers may receive your details and contact you: Demo Lone Star Relocation Co. (USDOT 9000001); Demo Bluebonnet Hill Movers (USDOT 9000002).",
    );
    expect(body).toBe(
      "I agree that up to 2 of the movers listed above may contact me about my move by calls and text messages at the phone number I provided and by email at the email address I provided, including calls and text messages that may use automated technology or prerecorded voice. Consent isn't required to buy any goods or services. Message and data rates may apply. I can opt out at any time by replying STOP to a text or by contacting the mover or American Moving Choice.",
    );

    const email = renderConsentText(V0, { movers: movers.slice(0, 1), limit: 1, channels: ["email"] });
    expect(email).toMatch(/^Only 1 of these movers may receive/);
    expect(email.split("\n\n")[1]).toBe(
      "I agree that up to 1 of the movers listed above may contact me about my move by email at the email address I provided. Consent isn't required to buy any goods or services. I can opt out at any time by contacting the mover or American Moving Choice.",
    );

    const call = renderConsentText(V0, { movers, limit: 3, channels: ["call", "email"] });
    expect(call).toContain("by calls at the phone number I provided and by email at the email address I provided, including calls that may use automated technology or prerecorded voice.");
    expect(call).not.toMatch(/text message|STOP|rates/);
  });

  it("refuses an empty list, a limit above the list and no channels", () => {
    expect(() => renderConsentText(V1, { movers: [], limit: 1, channels: ["email"] })).toThrow();
    expect(() => renderConsentText(V1, { movers: movers.slice(0, 1), limit: 2, channels: ["email"] })).toThrow();
    expect(() => renderConsentText(V1, { movers, limit: 1, channels: [] })).toThrow();
  });
});

describe("reference codes", () => {
  it("uses only unambiguous characters in the AMC-XXXX-XXXX shape", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferenceCode();
      expect(isReferenceCode(code)).toBe(true);
      expect(code.slice(4)).not.toMatch(/[ILOU]/);
    }
    expect(generateReferenceCode(() => new Uint8Array([0, 1, 2, 3, 31, 32, 63, 255]))).toBe("AMC-0123-Z0ZZ");
    expect(isReferenceCode("AMC-0I23-4567")).toBe(false);
  });
});

describe("neutral order", () => {
  it("puts the profile-origin company first and keeps every item", () => {
    const ids = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 50; i++) {
      const ordered = neutralOrder(ids, (x) => x, "c");
      expect(ordered[0]).toBe("c");
      expect([...ordered].sort()).toEqual(ids);
    }
    expect([...neutralOrder(ids, (x) => x, "zz")].sort()).toEqual(ids);
  });

  it("shuffles without bias toward any position", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 3000; i++) {
      const first = secureShuffle(["a", "b", "c"])[0]!;
      counts.set(first, (counts.get(first) ?? 0) + 1);
    }
    for (const id of ["a", "b", "c"]) expect(counts.get(id)!).toBeGreaterThan(800);
  });

  it("rejection-samples to stay uniform", () => {
    // 0xFFFFFFFF is above the largest multiple of 3 below 2^32, so it is rejected and the next draw used.
    const draws = [new Uint8Array([255, 255, 255, 255]), new Uint8Array([0, 0, 0, 4])];
    const random: RandomBytes = () => draws.shift()!;
    expect(randomBelow(3, random)).toBe(1);
  });
});

describe("step parsers", () => {
  const today = "2026-10-28";

  it("cleans ZIP codes without losing leading zeros", () => {
    expect(cleanZip(" 02108")).toBe("02108");
    expect(cleanZip("02108-1234")).toBe("02108");
    expect(parseWhere({ originZip: "75201", destZip: "77002" })).toEqual({ ok: true, value: { originZip: "75201", destZip: "77002" } });
    expect(parseWhere({ originZip: "752", destZip: "" })).toMatchObject({ ok: false, errors: { originZip: expect.any(String), destZip: expect.any(String) } });
  });

  it("requires a choice for what you need, with nothing assumed", () => {
    expect(parseNeed({}).ok).toBe(false);
    expect(parseNeed({ need: "household" })).toEqual({ ok: true, value: { need: "household" } });
  });

  it("accepts dates from today to 12 months out", () => {
    expect(parseWhen({ moveDate: today }, today).ok).toBe(true);
    expect(parseWhen({ moveDate: addMonths(today, 12) }, today).ok).toBe(true);
    expect(parseWhen({ moveDate: "2026-10-27" }, today)).toMatchObject({ ok: false, errors: { moveDate: "Your move date can't be in the past." } });
    expect(parseWhen({ moveDate: "2027-10-29" }, today).ok).toBe(false);
    expect(parseWhen({ moveDate: "2026-02-30" }, today).ok).toBe(false);
    expect(parseWhen({ moveDate: "2026-10-27" }, today, 1).ok).toBe(true);
  });

  it("checks a flexible range", () => {
    expect(parseWhen({ moveDate: "2026-11-10", flexible: true, latestDate: "2026-11-20" }, today)).toEqual({
      ok: true,
      value: { moveDate: "2026-11-10", flexible: true, latestDate: "2026-11-20" },
    });
    expect(parseWhen({ moveDate: "2026-11-10", flexible: true, latestDate: "2026-11-01" }, today).ok).toBe(false);
    expect(parseWhen({ moveDate: "2026-11-10", flexible: true }, today).ok).toBe(false);
  });

  it("requires a size and accepts only listed services", () => {
    expect(parseSize({ services: [] }).ok).toBe(false);
    expect(parseSize({ moveSize: "2br", services: ["packing", "packing"] })).toEqual({ ok: true, value: { moveSize: "2br", services: ["packing"] } });
    expect(parseSize({ moveSize: "2br", services: ["auto_transport"] }).ok).toBe(false);
    expect(servicesForNeed("loading_help", ["packing"])).toEqual(["packing", "labor_only"]);
  });

  it("validates contact details and the channel choice", () => {
    const good = { channels: ["sms", "email"], firstName: " Ana ", lastName: "O'Neil-Ruiz", email: " Ana@Example.COM ", phone: "(512) 555-0123" };
    expect(parseDetails(good)).toEqual({
      ok: true,
      value: { channels: ["sms", "email"], firstName: "Ana", lastName: "O'Neil-Ruiz", email: "ana@example.com", phone: "+15125550123" },
    });
    const bad = parseDetails({ channels: [], firstName: "", lastName: "<b>", email: "a@mailinator.com", phone: "123" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["channels", "email", "firstName", "lastName", "phone"]);
    expect(parseDetails({ ...good, email: "no-at-sign" }).ok).toBe(false);
    expect(parseDetails({ ...good, channels: ["fax"] }).ok).toBe(false);
  });
});
