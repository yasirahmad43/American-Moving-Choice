/**
 * Delivery transports for the outbox. Postmark (email) and Twilio (SMS) run when their keys are
 * set; otherwise the demo transport marks messages "demo" so they show in the admin mailbox and
 * nothing leaves the system (build plan §9).
 */
import { env } from "../env/env";

export interface OutgoingMessage {
  id: string;
  channel: "email" | "sms";
  toAddress: string;
  subject: string | null;
  bodyText: string;
  template: string;
}

export type DeliveryResult =
  | { status: "sent"; provider: string; providerRef: string | null }
  | { status: "demo"; provider: "demo" }
  | { status: "failed"; provider: string; error: string; retryable: boolean };

export interface Transport {
  readonly name: string;
  deliver(message: OutgoingMessage): Promise<DeliveryResult>;
}

export const demoTransport: Transport = {
  name: "demo",
  async deliver() {
    return { status: "demo", provider: "demo" };
  },
};

const TIMEOUT_MS = 10_000;

/** Postmark single-message API: https://postmarkapp.com/developer/api/email-api */
export function postmarkTransport(serverToken: string, from: string, fetchImpl: typeof fetch = fetch): Transport {
  return {
    name: "postmark",
    async deliver(message) {
      if (message.channel !== "email") return { status: "failed", provider: "postmark", error: "not an email", retryable: false };
      try {
        const response = await fetchImpl("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": serverToken,
          },
          body: JSON.stringify({
            From: from,
            To: message.toAddress,
            Subject: message.subject ?? "",
            TextBody: message.bodyText,
            Tag: message.template,
            MessageStream: "outbound",
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const body = (await response.json().catch(() => ({}))) as { MessageID?: string; ErrorCode?: number; Message?: string };
        if (response.ok && (body.ErrorCode ?? 0) === 0) {
          return { status: "sent", provider: "postmark", providerRef: body.MessageID ?? null };
        }
        // Postmark's error text describes the request, not the recipient, so it is safe to store.
        const error = `HTTP ${response.status}${body.ErrorCode ? ` code ${body.ErrorCode}` : ""}: ${body.Message ?? "error"}`;
        return { status: "failed", provider: "postmark", error, retryable: response.status >= 500 || response.status === 429 };
      } catch (error) {
        return { status: "failed", provider: "postmark", error: errorName(error), retryable: true };
      }
    },
  };
}

/** Twilio Messages API. Untested against the live service in this environment. */
export function twilioTransport(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  fetchImpl: typeof fetch = fetch,
): Transport {
  return {
    name: "twilio",
    async deliver(message) {
      if (message.channel !== "sms") return { status: "failed", provider: "twilio", error: "not an SMS", retryable: false };
      try {
        const response = await fetchImpl(
          `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: message.toAddress, From: fromNumber, Body: message.bodyText }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          },
        );
        const body = (await response.json().catch(() => ({}))) as { sid?: string; code?: number; message?: string };
        if (response.ok) return { status: "sent", provider: "twilio", providerRef: body.sid ?? null };
        const error = `HTTP ${response.status}${body.code ? ` code ${body.code}` : ""}`;
        return { status: "failed", provider: "twilio", error, retryable: response.status >= 500 || response.status === 429 };
      } catch (error) {
        return { status: "failed", provider: "twilio", error: errorName(error), retryable: true };
      }
    },
  };
}

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name === "TimeoutError" ? "timeout" : `network error (${error.name})`;
  return "network error";
}

export interface Transports {
  email: Transport;
  sms: Transport;
}

/** Transports chosen from the environment: live when the keys are present, demo otherwise. */
export function transportsFromEnv(): Transports {
  const e = env();
  return {
    email: e.POSTMARK_SERVER_TOKEN ? postmarkTransport(e.POSTMARK_SERVER_TOKEN, e.EMAIL_FROM) : demoTransport,
    sms:
      e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_FROM_NUMBER
        ? twilioTransport(e.TWILIO_ACCOUNT_SID, e.TWILIO_AUTH_TOKEN, e.TWILIO_FROM_NUMBER)
        : demoTransport,
  };
}
