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

/**
 * Section order. About sits last by request: the work comes first, the booking
 * invitation next, and the artist's story closes the page.
 */
export const navItems = [
  { id: "home", label: "HOME", href: "#home" },
  { id: "instagram", label: "INSTAGRAM", href: "#instagram" },
  { id: "creazioni", label: "CREAZIONI", href: "#creazioni" },
  { id: "flash", label: "FLASH", href: "#flash" },
  { id: "merch", label: "MERCH", href: "#merch" },
  { id: "booking", label: "BOOKING", href: "#booking" },
  { id: "about", label: "ABOUT", href: "#about" },
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
/* Curated collections                                                        */
/*                                                                            */
/* Instagram's official API exposes no story-highlights edge, so these three   */
/* sections are built from the real feed, selected by a marker in the caption. */
/* See `lib/instagram/collections.ts`.                                         */
/* -------------------------------------------------------------------------- */

export const collections = {
  creazioni: {
    envKey: "CREAZIONI",
    /**
     * The real Story Highlight this section mirrors. Used for the section CTA,
     * so visitors can open the actual highlight even while the gallery is
     * waiting on API credentials.
     */
    highlightUrl: "https://www.instagram.com/stories/highlights/18138808534098679/",
    /** Caption markers, overridable with INSTAGRAM_CREAZIONI_TAGS. */
    defaultTags: ["creazioni", "vtcreazioni", "custom", "tattoo"] as const,
    limit: 12,
    demoOffset: 0,
  },
  flash: {
    envKey: "FLASH",
    highlightUrl: "https://www.instagram.com/stories/highlights/17907459131894011/",
    defaultTags: ["flash", "vtflash", "flashtattoo", "disponibile"] as const,
    limit: 12,
    demoOffset: 4,
  },
  merch: {
    envKey: "MERCH",
    highlightUrl: "https://www.instagram.com/stories/highlights/17859497229473696/",
    defaultTags: ["merch", "vtmerch", "shop", "merchandise"] as const,
    limit: 12,
    demoOffset: 8,
  },
} as const;

export type CollectionId = keyof typeof collections;

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

/**
 * The canonical origin, written once and read by everything that needs an
 * absolute URL: `metadataBase`, the canonical link, the sitemap and robots.
 *
 * Apex, no `www`, no trailing slash. The choice matters beyond taste — Google
 * treats `valentinetattoo.it` and `www.valentinetattoo.it` as different sites,
 * so whichever one is not canonical has to redirect to this one at the DNS or
 * host level, or the two will split the same content between them.
 *
 * Hard-coded rather than read from the environment: there is one domain and it
 * is not a secret, and a sitemap that silently loses its origin on a
 * misconfigured deploy is worse than one that cannot.
 */
export const siteUrl = "https://valentinetattoo.it";

/**
 * The title is ordered brand-first: the studio name opens it, the style and
 * the place follow.
 *
 * That order is a deliberate choice by the client. It puts the name in the one
 * position nothing can truncate away — mobile results cut the tail, never the
 * head — so every impression reinforces the brand even when the visitor does
 * not click. The keywords still sit inside the tag, which is what Google reads;
 * they simply are not the first thing a human sees.
 *
 * "(Bari)" is there because Triggiano on its own has almost no search volume
 * while the province name is how people actually phrase a local tattoo search.
 * It is a qualifier, not a claim: she genuinely receives in Triggiano, which
 * is in the province of Bari, and the description says so in full.
 *
 * At 59 characters it renders whole — Google truncates the title around 600px,
 * roughly 60 characters at this mix of upper and lower case. Anything added
 * here has to displace something, not extend it.
 *
 * The artist's own name is deliberately not in the title: there is no room for
 * it beside the brand. It is the first thing in the description, where brand
 * searches still match it, and the H1 and About section carry it on the page.
 */
export const siteMetadata = {
  title: "Valentine Tattoo | Tatuaggi Cyber Tribal a Triggiano (Bari)",
  description:
    "Valentina Stucchi, tatuatrice di Valenzano. Tatuaggi su misura, cyber tribal e sigil-inspired. Riceve a Triggiano presso Crossbone Studio.",
  locale: "it_IT",
  lang: "it",
} as const;
