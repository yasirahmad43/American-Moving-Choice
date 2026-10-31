import { describe, expect, it } from "vitest";
import { hmacHex } from "../auth/tokens";
import { checkSurveyTicket, issueSurveyTicket } from "../leads/quality";

describe("anonymous survey ticket replay isolation", () => {
  const secret = "survey-security-test-secret".repeat(2), now = 1_798_800_000_000;
  it("issues independent bounded tickets to visitors who start at exactly the same time", () => {
    const tickets = Array.from({ length: 100 }, () => issueSurveyTicket(secret, now));
    expect(new Set(tickets).size).toBe(100);
    for (const ticket of tickets) {
      expect(ticket.length).toBeLessThanOrEqual(100);
      expect(checkSurveyTicket(secret, ticket, now + 1000, 0)).toEqual({ ok: true, elapsedSeconds: 1 });
    }
  });
  it("does not allow the browser to replace the nonce or issued time", () => {
    const ticket = issueSurveyTicket(secret, now), parts = ticket.split(".");
    const issued = parts[0]!, nonce = parts[1]!, mac = parts[2]!;
    expect(checkSurveyTicket(secret, `${issued}.${nonce[0] === "A" ? "B" : "A"}${nonce.slice(1)}.${mac}`, now + 1000, 0)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSurveyTicket(secret, `${Number(issued) - 60000}.${nonce}.${mac}`, now + 1000, 0)).toEqual({ ok: false, reason: "invalid" });
  });
  it("accepts an unexpired ticket from the prior deployment without restoring speed rejections", () => {
    const issued = String(now), old = `${issued}.${hmacHex(secret, `survey-ticket\u0000${issued}`).slice(0, 32)}`;
    expect(checkSurveyTicket(secret, old, now + 1000, 0)).toEqual({ ok: true, elapsedSeconds: 1 });
  });
});
