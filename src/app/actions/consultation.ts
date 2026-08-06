"use server";

import { headers } from "next/headers";

import { bookingContent } from "@/content/site-content";
import { deliverConsultation, isDeliveryConfigured } from "@/lib/consultation/delivery";
import {
  MIN_SUBMIT_ELAPSED_MS,
  consultationSchema,
  type ConsultationFieldErrors,
} from "@/lib/consultation/schema";
import { processReferences } from "@/lib/consultation/storage";

export type ConsultationState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; fieldErrors: ConsultationFieldErrors; message?: string }
  | { status: "error"; message: string }
  | { status: "not-configured"; message: string };

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/*                                                                            */
/* In-memory, per-instance. Enough to blunt casual abuse on a single-node      */
/* deployment; the README notes swapping in a shared store for multi-instance  */
/* hosting.                                                                    */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const attempts = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (attempts.size > 500) {
    for (const [k, times] of attempts) {
      if (times.every((t) => now - t >= WINDOW_MS)) attempts.delete(k);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------------------- */
/* Action                                                                     */
/* -------------------------------------------------------------------------- */

export async function submitConsultation(
  _previous: ConsultationState,
  formData: FormData,
): Promise<ConsultationState> {
  const headerList = await headers();
  const clientKey =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  if (rateLimited(clientKey)) {
    return {
      status: "error",
      message: "Troppe richieste ravvicinate. Riprova tra qualche minuto.",
    };
  }

  /* -- Validation ------------------------------------------------------- */

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    idea: String(formData.get("idea") ?? ""),
    placement: String(formData.get("placement") ?? ""),
    size: String(formData.get("size") ?? ""),
    privacy: formData.get("privacy") === "on" || formData.get("privacy") === "true",
    website: String(formData.get("website") ?? ""),
    elapsedMs: String(formData.get("elapsedMs") ?? "0"),
  };

  const parsed = consultationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ConsultationFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof ConsultationFieldErrors] = issue.message;
      }
    }
    return { status: "invalid", fieldErrors };
  }

  const data = parsed.data;

  /* -- Spam heuristics --------------------------------------------------- */

  // The honeypot is enforced by the schema (max length 0), so reaching here
  // means it was empty. Timing is the second, silent signal.
  if (typeof data.elapsedMs === "number" && data.elapsedMs > 0 && data.elapsedMs < MIN_SUBMIT_ELAPSED_MS) {
    return {
      status: "error",
      message: "Invio troppo rapido. Riprova tra qualche istante.",
    };
  }

  /* -- Reference files --------------------------------------------------- */

  const files = formData
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  let references;
  try {
    const outcome = await processReferences(files);
    if (!outcome.ok) {
      return { status: "invalid", fieldErrors: { references: outcome.message } };
    }
    references = outcome.references;
  } catch (error) {
    console.error("[consultation] reference processing failed", error);
    return {
      status: "error",
      message: "Non è stato possibile elaborare i file allegati. Riprova senza allegati.",
    };
  }

  /* -- Delivery ---------------------------------------------------------- */

  if (!isDeliveryConfigured()) {
    // Never fake a success. The request is refused and the user is pointed at
    // the direct contact channels instead.
    console.error(
      "[consultation] No delivery provider configured. Set CONSULTATION_WEBHOOK_URL or CONSULTATION_RECIPIENT_EMAIL.",
    );
    return {
      status: "not-configured",
      message: bookingContent.form.unconfiguredBody,
    };
  }

  const result = await deliverConsultation({
    ...data,
    references,
    submittedAt: new Date().toISOString(),
    userAgent: headerList.get("user-agent") ?? undefined,
  });

  if (result.ok) return { status: "success" };

  if (result.reason === "not-configured") {
    return { status: "not-configured", message: bookingContent.form.unconfiguredBody };
  }

  console.error("[consultation] delivery failed:", result.message);
  return { status: "error", message: bookingContent.form.errorFallback };
}
