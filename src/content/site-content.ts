/**
 * Editable site copy — single source of truth.
 *
 * All user-facing text is Italian, except deliberately editorial English
 * headings ("THE ART BEHIND VALENTINE TATTOO", "INSTAGRAM FEED",
 * "CONNECT WITH THE TRIBE", "BOOKING / CONSULENZA").
 *
 * No statistics, response times, prices, addresses or availability appear here:
 * none have been supplied or verified by the client.
 */

import { artist, instagramProfile } from "@/config/site-config";

export const heroContent = {
  eyebrow: "CYBER TRIBAL · SIGIL · CUSTOM WORK",
  /** Rendered as a single accessible H1; the array is only a line-break hint. */
  titleLines: ["VALENTINE", "TATTOO"] as const,
  titleAccessible: "Valentine Tattoo",
  /**
   * Segments let the intro mirror the reference's mixed-weight treatment while
   * staying a single editable paragraph.
   */
  introSegments: [
    { text: "Sono ", emphasis: false },
    { text: artist.name, emphasis: true },
    { text: ",\ntatuatrice di ", emphasis: false },
    { text: artist.origin, emphasis: true },
    { text: ".\nRicevo a ", emphasis: false },
    { text: artist.city, emphasis: true },
    { text: " presso ", emphasis: false },
    { text: artist.studio, emphasis: true },
    { text: ".", emphasis: false },
  ] as const,
  introPlain: `Sono ${artist.name}, tatuatrice di ${artist.origin}. Ricevo a ${artist.city} presso ${artist.studio}.`,
  primaryCta: "Richiedi una consulenza su WhatsApp",
  secondaryCta: "Scrivimi su Instagram",
  supportingLine:
    "Tatuaggi su misura · Concept personalizzati · Cyber tribal e sigil-inspired",
  scrollLabel: "SCORRI PER ESPLORARE",
  /** Vertical ornamental rail text — brand words, never fabricated data. */
  railWords: ["CYBER TRIBAL", "SIGIL INSPIRED", "CUSTOM WORK"] as const,
} as const;

export const aboutContent = {
  eyebrow: "ABOUT",
  columnEyebrow: "ABOUT ME",
  titleLines: ["THE ART BEHIND", "VALENTINE TATTOO"] as const,
  titleAccessible: "The art behind Valentine Tattoo",
  /**
   * Each paragraph is an array of segments so key terms can carry the
   * reference's brighter weight without hard-coding markup in the component.
   */
  paragraphs: [
    [
      { text: "Sono ", emphasis: false },
      { text: `${artist.name}.`, emphasis: true },
    ],
    [
      {
        text: "Trasformo idee, simboli ed emozioni in tatuaggi costruiti sulla persona e sul corpo.",
        emphasis: false,
      },
    ],
    [
      { text: "Ricevo a ", emphasis: false },
      { text: artist.city, emphasis: true },
      { text: " presso ", emphasis: false },
      { text: artist.studio, emphasis: true },
      {
        text: ", dove ogni progetto nasce dal confronto tra tecnica, ricerca e visione.",
        emphasis: false,
      },
    ],
    [
      { text: "Il mio linguaggio visivo incontra ", emphasis: false },
      { text: "cyber tribal", emphasis: true },
      { text: ", ", emphasis: false },
      { text: "sigilism", emphasis: true },
      { text: " e ", emphasis: false },
      { text: "dark ornamental", emphasis: true },
      {
        text: ": linee affilate, forme organiche e composizioni progettate per dialogare con il placement.",
        emphasis: false,
      },
    ],
    [
      {
        text: "Ogni progetto è personale. Ogni tatuaggio parte dall’ascolto.",
        emphasis: false,
      },
    ],
  ] as const,
  /**
   * Qualitative blocks replacing the fabricated "3+ / 500+ / 100%" strip from
   * the reference screenshots. These are descriptions of the practice, not
   * unverifiable metrics.
   */
  qualities: [
    { id: "custom", title: "CUSTOM", description: "Disegni sviluppati su misura" },
    { id: "placement", title: "PLACEMENT", description: "Composizioni progettate sul corpo" },
    { id: "studio", title: "TRIGGIANO", description: `Presso ${artist.studio}` },
  ] as const,
  cta: "SCOPRI I MIEI LAVORI SU INSTAGRAM",
  portraitAlt: `Ritratto di ${artist.name}, tatuatrice di ${artist.brand}`,
  portraitPlaceholderNotice: "Ritratto in attesa della foto ufficiale",
  signatureRole: artist.role,
} as const;

export const instagramContent = {
  eyebrow: "CONNECT WITH THE TRIBE",
  title: "INSTAGRAM FEED",
  supporting: `Uno sguardo dietro le linee: lavori, dettagli, processi e nuovi progetti pubblicati su ${instagramProfile.handleWithAt}.`,
  cta: `APRI ${instagramProfile.handleWithAt.toUpperCase()} SU INSTAGRAM`,
  footerEyebrow: "ENTRA NEL MONDO VALENTINE",
  carouselLabel: "Ultimi post di Instagram",
  previousLabel: "Post precedenti",
  nextLabel: "Post successivi",
  loadingLabel: "Caricamento dei post di Instagram in corso",
  /** Shown in production when the live feed cannot be reached. */
  unavailableTitle: "Feed non disponibile in questo momento",
  unavailableBody: `Non riusciamo a caricare i post più recenti. Puoi vedere tutti i lavori direttamente sul profilo ${instagramProfile.handleWithAt}.`,
  emptyTitle: "Nessun post da mostrare",
  emptyBody: `Al momento non ci sono contenuti recenti da mostrare qui. Trovi tutto su ${instagramProfile.handleWithAt}.`,
  mediaTypeLabels: {
    IMAGE: "Immagine",
    VIDEO: "Video",
    REELS: "Reel",
    CAROUSEL_ALBUM: "Carosello",
  } as const,
} as const;

export const bookingContent = {
  eyebrow: "BOOKING / CONSULENZA",
  titleLines: ["LA TUA IDEA,", "LA MIA VISIONE."] as const,
  titleAccessible: "La tua idea, la mia visione.",
  intro:
    "Ogni tatuaggio nasce da un confronto. Raccontami il soggetto, il significato, la zona del corpo, le dimensioni e i riferimenti che hai in mente.",
  contactCardTitle: "SCEGLI IL CANALE",
  whatsappCta: "RICHIEDI UNA CONSULENZA SU WHATSAPP",
  whatsappSupport: "Contatto diretto",
  /** Shown instead of the WhatsApp button when no number is configured. */
  whatsappUnconfigured: "Contatto WhatsApp non ancora configurato",
  instagramCta: "SCRIVIMI SU INSTAGRAM",
  instagramSupport: `Messaggio privato su ${instagramProfile.handleWithAt}`,
  reassurance: [
    {
      id: "contact",
      title: "CONTATTO DIRETTO",
      description: "Scegli il canale che preferisci",
    },
    {
      id: "custom",
      title: "PROGETTO SU MISURA",
      description: "Ogni proposta viene valutata singolarmente",
    },
    {
      id: "privacy",
      title: "PRIVACY E RISERVATEZZA",
      description: "Le informazioni non vengono mostrate pubblicamente",
    },
  ] as const,
  form: {
    title: "RACCONTAMI LA TUA IDEA",
    fields: {
      name: { label: "Nome e cognome", placeholder: "Nome e cognome" },
      email: { label: "Email", placeholder: "nome@esempio.it" },
      phone: {
        label: "Telefono",
        optionalHint: "facoltativo",
        placeholder: "+39 ...",
      },
      idea: {
        label: "La tua idea",
        placeholder:
          "Descrivi il soggetto, il significato, lo stile e qualsiasi dettaglio utile.",
      },
      placement: { label: "Posizione", placeholder: "Seleziona la zona del corpo" },
      size: { label: "Dimensione", placeholder: "Seleziona la dimensione" },
      references: {
        label: "Riferimenti",
        optionalHint: "facoltativi",
        dropzoneTitle: "Trascina le immagini",
        dropzoneAction: "o clicca per selezionarle",
        removeLabel: "Rimuovi",
      },
      privacy: {
        label:
          "Ho letto l’informativa e acconsento al trattamento dei miei dati per essere ricontattata/o.",
      },
    },
    submit: "INVIA RICHIESTA",
    submitting: "INVIO IN CORSO…",
    successTitle: "Richiesta inviata",
    successBody:
      "Grazie, ho ricevuto la tua richiesta. Ti risponderò appena possibile con i prossimi passi.",
    errorTitle: "Invio non riuscito",
    errorFallback:
      "Non è stato possibile inviare la richiesta. Riprova, oppure scrivimi direttamente su WhatsApp o Instagram.",
    /** Development-only banner when no delivery provider is configured. */
    unconfiguredTitle: "Nessun provider di consegna configurato",
    unconfiguredBody:
      "Il form è pronto ma non è collegato a nessun servizio di invio. Configura CONSULTATION_WEBHOOK_URL o CONSULTATION_RECIPIENT_EMAIL. Nel frattempo il modulo rifiuta gli invii invece di simulare un successo.",
  },
  placementOptions: [
    "Braccio",
    "Avambraccio",
    "Spalla",
    "Schiena",
    "Costato",
    "Gamba",
    "Coscia",
    "Polpaccio",
    "Mano o dita",
    "Collo",
    "Altro / da definire",
  ] as const,
  sizeOptions: [
    "Fino a 5 cm",
    "5 – 10 cm",
    "10 – 20 cm",
    "20 – 30 cm",
    "Oltre 30 cm",
    "Da valutare insieme",
  ] as const,
  quote: {
    lines: [
      "Non è solo un tatuaggio.",
      "È la tua storia, disegnata sulla pelle.",
    ] as const,
    signature: artist.name,
    signatureRole: artist.role,
    portraitAlt: `${artist.name} nel suo studio`,
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} ${artist.brand} · ${artist.name}`,
    privacy: "I dati inviati tramite il modulo vengono usati solo per rispondere alla richiesta.",
  },
} as const;

export const a11yContent = {
  skipToContent: "Vai al contenuto principale",
  openMenu: "Apri il menu",
  closeMenu: "Chiudi il menu",
  menuLabel: "Menu di navigazione",
  primaryNavLabel: "Navigazione principale",
  externalLinkHint: "si apre in una nuova scheda",
} as const;
