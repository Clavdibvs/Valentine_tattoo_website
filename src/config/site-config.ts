/**
 * Site configuration — single source of truth for identity, contact channels,
 * navigation and integration settings.
 *
 * Nothing factual about Valentina may be invented here. Every value is either
 * supplied by the client, read from the environment, or a purely technical
 * default.
 */

/* -------------------------------------------------------------------------- */
/* Artist identity                                                            */
/* -------------------------------------------------------------------------- */

export const artist = {
  name: "Valentina Stucchi",
  brand: "Valentine Tattoo",
  role: "Tattoo Artist",
  /** Where she is from. */
  origin: "Valenzano",
  /** Where she works. */
  city: "Triggiano",
  studio: "Crossbone Studio",
} as const;

/* -------------------------------------------------------------------------- */
/* Social / contact                                                           */
/* -------------------------------------------------------------------------- */

export const instagramProfile = {
  handle: "valentine.ttt",
  handleWithAt: "@valentine.ttt",
  url: "https://www.instagram.com/valentine.ttt/",
  /** Deep link used by the "write me a DM" CTAs. */
  directMessageUrl: "https://ig.me/m/valentine.ttt",
} as const;

/**
 * The WhatsApp number is intentionally NOT hard-coded. It must be supplied via
 * `NEXT_PUBLIC_WHATSAPP_NUMBER` (international format, digits only, e.g.
 * 39XXXXXXXXXX). When it is absent the UI degrades gracefully to Instagram
 * rather than linking to a fabricated number.
 */
const rawWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^\d]/g, "") ?? "";

export const whatsappPrefilledMessage =
  "Ciao Valentina, vorrei richiedere una consulenza per un tatuaggio.";

export const whatsapp = {
  /** Digits-only international number, or an empty string when unconfigured. */
  number: rawWhatsAppNumber,
  isConfigured: rawWhatsAppNumber.length > 0,
  /** `null` when no number is configured — callers must handle this. */
  url: rawWhatsAppNumber
    ? `https://wa.me/${rawWhatsAppNumber}?text=${encodeURIComponent(whatsappPrefilledMessage)}`
    : null,
} as const;

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export const navItems = [
  { id: "home", label: "HOME", href: "#home" },
  { id: "about", label: "ABOUT", href: "#about" },
  { id: "instagram", label: "INSTAGRAM", href: "#instagram" },
  { id: "booking", label: "BOOKING", href: "#booking" },
] as const;

export type NavItem = (typeof navItems)[number];
export type SectionId = NavItem["id"];

/* -------------------------------------------------------------------------- */
/* Instagram integration (server-side only values live in lib/instagram)       */
/* -------------------------------------------------------------------------- */

export const instagramFeed = {
  /** How many media items the section renders at most. */
  limit: 12,
  /** Items shown in the mobile 3-column grid. */
  mobileGridCount: 9,
  /** Cache lifetime in seconds for the server-side feed fetch. */
  revalidateSeconds: 3600,
} as const;

/* -------------------------------------------------------------------------- */
/* Consultation form                                                          */
/* -------------------------------------------------------------------------- */

export const consultationUpload = {
  maxFiles: 4,
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptAttribute: "image/jpeg,image/png,image/webp",
  humanReadableTypes: "JPG, PNG, WEBP",
} as const;

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export const siteMetadata = {
  title: "Valentine Tattoo — Valentina Stucchi | Tatuaggi cyber tribal a Triggiano",
  description:
    "Valentina Stucchi, tatuatrice di Valenzano. Tatuaggi su misura, cyber tribal e sigil-inspired. Riceve a Triggiano presso Crossbone Studio.",
  locale: "it_IT",
  lang: "it",
} as const;
