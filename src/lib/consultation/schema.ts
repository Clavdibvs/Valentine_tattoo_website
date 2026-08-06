import { z } from "zod";

import { bookingContent } from "@/content/site-content";
import { consultationUpload } from "@/config/site-config";

/**
 * One schema, used by both the browser and the server action. The client never
 * gets to decide what is valid — the server re-validates the same shape.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const consultationSchema = z
  .object({
    name: trimmed(120).min(2, "Inserisci il tuo nome e cognome."),
    email: z.string().trim().max(180).email("Inserisci un’email valida."),
    phone: trimmed(40)
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => !value || /^[+\d][\d\s().\-/]{5,}$/.test(value),
        "Inserisci un numero di telefono valido.",
      ),
    idea: trimmed(4000).min(20, "Raccontami almeno qualche dettaglio in più (min. 20 caratteri)."),
    placement: z
      .string()
      .trim()
      .refine(
        (value) => (bookingContent.placementOptions as readonly string[]).includes(value),
        "Seleziona una posizione.",
      ),
    size: z
      .string()
      .trim()
      .refine(
        (value) => (bookingContent.sizeOptions as readonly string[]).includes(value),
        "Seleziona una dimensione.",
      ),
    privacy: z.literal(true, { message: "È necessario acconsentire per inviare la richiesta." }),
    /** Honeypot — must stay empty. Bots fill it in. */
    website: z.string().max(0).optional().or(z.literal("")),
    /** Milliseconds between form mount and submit — instant submits are bots. */
    elapsedMs: z.coerce.number().int().nonnegative().optional(),
  })
  .strict();

export type ConsultationInput = z.input<typeof consultationSchema>;
export type ConsultationData = z.output<typeof consultationSchema>;

/** Field-level errors keyed by field name, as returned to the client. */
export type ConsultationFieldErrors = Partial<Record<keyof ConsultationData | "references", string>>;

export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Il file è vuoto.")
  .refine(
    (file) => file.size <= consultationUpload.maxFileSizeBytes,
    `Ogni file deve essere sotto i ${Math.round(consultationUpload.maxFileSizeBytes / (1024 * 1024))} MB.`,
  )
  .refine(
    (file) => (consultationUpload.acceptedMimeTypes as readonly string[]).includes(file.type),
    `Formati ammessi: ${consultationUpload.humanReadableTypes}.`,
  );

/** Minimum plausible time-to-submit for a human, in milliseconds. */
export const MIN_SUBMIT_ELAPSED_MS = 2500;
