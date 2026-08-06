import "server-only";

import type { ConsultationData } from "./schema";

/**
 * Delivery adapter.
 *
 * No provider is hard-coded. The adapter picks whichever transport the
 * environment configures. When nothing is configured it reports
 * `not-configured` — the action then refuses the submission rather than
 * pretending it succeeded.
 */

export type StoredReference = {
  filename: string;
  size: number;
  contentType: string;
  /** Public or signed url when storage is configured. */
  url?: string;
};

export type DeliveryResult =
  | { ok: true; provider: string }
  | { ok: false; reason: "not-configured" }
  | { ok: false; reason: "failed"; message: string };

export type ConsultationPayload = ConsultationData & {
  references: StoredReference[];
  submittedAt: string;
  userAgent?: string;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function isDeliveryConfigured(): boolean {
  return Boolean(env("CONSULTATION_WEBHOOK_URL") || env("CONSULTATION_RECIPIENT_EMAIL"));
}

export function isUploadStorageConfigured(): boolean {
  return Boolean(env("UPLOAD_STORAGE_BUCKET"));
}

/**
 * Sends the consultation request through the configured channel.
 * Order of preference: webhook, then transactional email.
 */
export async function deliverConsultation(payload: ConsultationPayload): Promise<DeliveryResult> {
  const webhookUrl = env("CONSULTATION_WEBHOOK_URL");
  if (webhookUrl) return deliverViaWebhook(webhookUrl, payload);

  const recipient = env("CONSULTATION_RECIPIENT_EMAIL");
  if (recipient) return deliverViaEmail(recipient, payload);

  return { ok: false, reason: "not-configured" };
}

/* -------------------------------------------------------------------------- */
/* Webhook transport                                                          */
/* -------------------------------------------------------------------------- */

async function deliverViaWebhook(
  url: string,
  payload: ConsultationPayload,
): Promise<DeliveryResult> {
  const apiKey = env("CONTACT_PROVIDER_API_KEY");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(toWirePayload(payload)),
      // Never leave the request hanging: the user is waiting on this.
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        reason: "failed",
        message: `Webhook responded ${response.status}. ${detail.slice(0, 200)}`,
      };
    }

    return { ok: true, provider: "webhook" };
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      message: error instanceof Error ? error.message : "Webhook request failed.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Email transport                                                            */
/*                                                                            */
/* Implemented against a generic provider HTTP API so no SDK is baked in.      */
/* `CONTACT_PROVIDER_API_URL` defaults to Resend's endpoint but any provider    */
/* accepting the same shape can be pointed at instead.                         */
/* -------------------------------------------------------------------------- */

async function deliverViaEmail(
  recipient: string,
  payload: ConsultationPayload,
): Promise<DeliveryResult> {
  const apiKey = env("CONTACT_PROVIDER_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      reason: "failed",
      message: "CONSULTATION_RECIPIENT_EMAIL is set but CONTACT_PROVIDER_API_KEY is missing.",
    };
  }

  const apiUrl = env("CONTACT_PROVIDER_API_URL") ?? "https://api.resend.com/emails";
  const from = env("CONSULTATION_SENDER_EMAIL") ?? "Valentine Tattoo <onboarding@resend.dev>";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: payload.email,
        subject: `Nuova richiesta di consulenza — ${payload.name}`,
        text: toPlainText(payload),
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        reason: "failed",
        message: `Email provider responded ${response.status}. ${detail.slice(0, 200)}`,
      };
    }

    return { ok: true, provider: "email" };
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      message: error instanceof Error ? error.message : "Email request failed.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Serialization                                                              */
/* -------------------------------------------------------------------------- */

function toWirePayload(payload: ConsultationPayload) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    idea: payload.idea,
    placement: payload.placement,
    size: payload.size,
    references: payload.references,
    submittedAt: payload.submittedAt,
    source: "valentine-tattoo-website",
  };
}

function toPlainText(payload: ConsultationPayload): string {
  const refs =
    payload.references.length > 0
      ? payload.references
          .map((r) => `  - ${r.filename} (${Math.round(r.size / 1024)} KB)${r.url ? ` — ${r.url}` : ""}`)
          .join("\n")
      : "  nessuno";

  return [
    "Nuova richiesta di consulenza",
    "",
    `Nome:       ${payload.name}`,
    `Email:      ${payload.email}`,
    `Telefono:   ${payload.phone || "—"}`,
    `Posizione:  ${payload.placement}`,
    `Dimensione: ${payload.size}`,
    "",
    "Idea:",
    payload.idea,
    "",
    "Riferimenti:",
    refs,
    "",
    `Inviata il: ${payload.submittedAt}`,
  ].join("\n");
}
