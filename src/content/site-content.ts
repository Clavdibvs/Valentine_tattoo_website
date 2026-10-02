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
  eyebrow: "CYBER TRIBAL · BIOMECHANICAL · CUSTOM WORK",
  /**
   * The same three words as separate items, so a phone can break them as
   * "CYBER TRIBAL · BIOMECHANICAL" over "CUSTOM WORK" instead of leaving a
   * separator hanging at the end of the first line.
   */
  eyebrowItems: ["CYBER TRIBAL", "BIOMECHANICAL", "CUSTOM WORK"] as const,
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
  /**
   * Mobile carries a single line instead of the three-line introduction: on a
   * phone the wordmark plus three lines of copy plus two stacked CTAs crowded
   * the opening screen. The full introduction is still on desktop, and the
   * artist's name and studio are given in full in About either way.
   */
  introShort: `Resident presso ${artist.studio}`,
  /**
   * The primary call to action stays on the page: it leads to Booking, where
   * the form and every direct channel are together. The secondary one opens a
   * direct channel — WhatsApp when a number is configured, Instagram otherwise.
   */
  bookingCta: "Richiedi una consulenza",
  primaryCta: "Scrivimi su WhatsApp",
  secondaryCta: "Scrivimi su Instagram",
  supportingLine:
    "Tatuaggi su misura · Concept personalizzati · Cyber tribal e biomeccanico",
  supportingItems: [
    "Tatuaggi su misura",
    "Concept personalizzati",
    "Cyber tribal e biomeccanico",
  ] as const,
  scrollLabel: "SCORRI PER ESPLORARE",
  /** Vertical ornamental rail text — brand words, never fabricated data. */
  railWords: ["CYBER TRIBAL", "BIOMECHANICAL", "CUSTOM WORK"] as const,
} as const;

export const aboutContent = {
  eyebrow: "ABOUT",
  titleLines: ["THE ART BEHIND", "VALENTINE TATTOO"] as const,
  titleAccessible: "The art behind Valentine Tattoo",
  /**
   * Each paragraph is an array of segments so key terms can carry the
   * reference's brighter weight without hard-coding markup in the component.
   */
  paragraphs: [
    [
      { text: "Sono ", emphasis: false },
      { text: artist.name, emphasis: true },
      { text: ", tatuatrice in provincia di ", emphasis: false },
      { text: "Bari", emphasis: true },
      { text: ". Ricevo a ", emphasis: false },
      { text: artist.city, emphasis: true },
      { text: " presso ", emphasis: false },
      { text: artist.studio, emphasis: true },
      { text: ".", emphasis: false },
    ],
    [
      {
        text: "Il mio lavoro consiste nel trasformare idee, simboli ed emozioni in tatuaggi unici, progettati per adattarsi armoniosamente alle forme del corpo e valorizzarne la struttura.",
        emphasis: false,
      },
    ],
    [
      { text: "Il mio linguaggio visivo unisce influenze ", emphasis: false },
      { text: "cybertribal", emphasis: true },
      { text: ", ", emphasis: false },
      { text: "biomeccaniche", emphasis: true },
      { text: " e ", emphasis: false },
      { text: "dark ornamental", emphasis: true },
      { text: ".", emphasis: false },
    ],
    [
      {
        text: "Ogni progetto nasce dall\u2019ascolto della tua richiesta e prende forma direttamente sul corpo, attraverso una bozza realizzata a pennarello: permette di vedere fin da subito l\u2019insieme del tatuaggio sulla zona scelta. Da quella base sviluppo poi il disegno definitivo.",
        emphasis: false,
      },
    ],
    [
      { text: "Il preventivo tiene conto del tempo necessario alla progettazione, di una prima seduta di ", emphasis: false },
      { text: "ghostlines", emphasis: true },
      {
        text: " \u2014 in cui l\u2019intero stencil viene ricalcato con linee molto leggere \u2014 e delle sedute successive, durante le quali il tatuaggio viene completato progressivamente.",
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
  portraitAlt: `${artist.name}, tatuatrice di ${artist.brand}`,
  portraitPlaceholderNotice: "Ritratto in attesa della foto ufficiale",
  signatureRole: artist.role,
} as const;

export const instagramContent = {
  eyebrow: "CONNECT WITH THE TRIBE",
  title: "INSTAGRAM FEED",
  supporting: `Uno sguardo ai lavori e ai nuovi progetti pubblicati su ${instagramProfile.handleWithAt}.`,
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
  /**
   * The enlarged view. A tap on a tile opens the image here first; the link out
   * to Instagram is the deliberate second step, under it.
   */
  lightbox: {
    /** Accessible name of the dialog. */
    label: "Immagine ingrandita",
    close: "Chiudi l'immagine",
    /** Hint on the tile itself, for screen readers and title tooltips. */
    openHint: "Ingrandisci l'immagine",
    cta: "APRI SU INSTAGRAM",
    /** Sits above the button, explaining where it goes. */
    ctaEyebrow: "GUARDA IL POST ORIGINALE",
    previous: "Foto precedente",
    next: "Foto successiva",
  },
} as const;

/**
 * The three curated collections. Editorial English eyebrows follow the same
 * convention as "CONNECT WITH THE TRIBE"; everything else is Italian.
 */
export const collectionContent = {
  creazioni: {
    eyebrow: "SELECTED WORK",
    title: "CREAZIONI",
    supporting:
      "La continua ricerca della mia espressione artistica, in forme sempre diverse.",
    cta: "VEDI TUTTO SU INSTAGRAM",
    emptyTitle: "Nessuna creazione da mostrare",
    emptyBody: `I lavori più recenti sono pubblicati su ${instagramProfile.handleWithAt}.`,
    carouselLabel: "Creazioni pubblicate su Instagram",
  },
  flash: {
    eyebrow: "READY TO INK",
    title: "FLASH",
    supporting:
      "Disegni già pronti, pensati per essere tatuati. Scrivimi per sapere quali sono ancora disponibili.",
    cta: "CHIEDI DISPONIBILITÀ",
    emptyTitle: "Nessun flash disponibile ora",
    emptyBody: `I nuovi flash vengono pubblicati su ${instagramProfile.handleWithAt}.`,
    carouselLabel: "Disegni flash pubblicati su Instagram",
  },
  merch: {
    eyebrow: "WEAR THE MARK",
    title: "MERCH",
    supporting:
      "Capi e stampe che portano fuori dalla pelle lo stesso linguaggio dei tatuaggi.",
    cta: "SCOPRI IL MERCH",
    emptyTitle: "Nessun articolo da mostrare",
    emptyBody: `Le novità vengono annunciate su ${instagramProfile.handleWithAt}.`,
    carouselLabel: "Merch pubblicato su Instagram",
  },
} as const;

export const bookingContent = {
  eyebrow: "BOOKING / CONSULENZA",
  titleLines: ["LA TUA IDEA,", "LA MIA VISIONE."] as const,
  titleAccessible: "La tua idea, la mia visione.",
  /** Set as a lead line in the display serif, then a quieter deck below it. */
  introLead: "Ogni tatuaggio nasce da un confronto.",
  introBody:
    "Raccontami il soggetto, il significato, la zona del corpo, le dimensioni e i riferimenti che hai in mente.",
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
  legal: {
    copyright: `© ${new Date().getFullYear()} ${artist.brand} · ${artist.name}`,
    privacy: "I dati inviati tramite il modulo vengono usati solo per rispondere alla richiesta.",
  },
} as const;

/**
 * Frequently asked questions.
 *
 * Every answer here comes from something the client has actually described —
 * where she works, the three influences, the marker draft taken directly on the
 * body, the ghostlines session, the three things a quote is built from. Nothing
 * states a price, a duration, a response time or an availability, for the same
 * reason nothing else on this file does: none of it has been supplied.
 *
 * ## Written to be quoted
 *
 * Each answer names its own subject and stands on its own, rather than
 * continuing the question grammatically ("Valentina Stucchi tatua a
 * Triggiano...", not "A Triggiano, presso..."). A search result snippet, a
 * Google AI Overview or an assistant summarising the page lifts one answer out
 * of its context, and a fragment that only parses next to its heading arrives
 * there as nonsense. The named entities — the artist, the brand, the town, the
 * province, the studio, the three styles, ghostlines — are repeated inside the
 * answers for the same reason.
 *
 * The questions are phrased the way someone would actually type or ask them,
 * which is what a question-shaped query has to match.
 */
export const faqContent = {
  eyebrow: "BEFORE YOU BOOK",
  /**
   * Two lines, not one.
   *
   * "DOMANDE FREQUENTI" set on a single line is the widest heading on the
   * site: 336px against the 346px a 390px-wide phone has to give it. It fits,
   * but with 5px a side, and only above roughly 382px — narrower than that it
   * wraps on its own, so the same heading looked deliberate on one phone and
   * cramped on the next. Worse, the fallback face renders before Bodoni loads
   * and does not have to be the same width, which puts a real overflow inside
   * the margin of error. Breaking it here makes the shape the same everywhere.
   *
   * The break is visual only — `titleAccessible` is what a screen reader says.
   */
  titleLines: ["DOMANDE", "FREQUENTI"] as const,
  titleAccessible: "Domande frequenti",
  supporting:
    "Come nasce un progetto, come si svolgono le sedute e come richiedere una consulenza.",
  /** The close of the page: where to go once the questions are answered. */
  closingTitle: "Hai un’altra domanda?",
  closingBody: "Scrivimi: ogni richiesta viene letta e valutata singolarmente.",
  closingBooking: "Richiedi una consulenza",
  closingInstagram: "Scrivimi su Instagram",
  items: [
    {
      id: "dove",
      question: "Dove tatua Valentine Tattoo?",
      answer: `Valentine Tattoo \u00e8 il progetto di ${artist.name}, tatuatrice in provincia di Bari. Riceve a ${artist.city}, presso ${artist.studio}.`,
    },
    {
      id: "stili",
      question: "Quali stili di tatuaggio realizza Valentina Stucchi?",
      answer:
        "Il linguaggio visivo di Valentine Tattoo unisce influenze cybertribal, biomeccaniche e dark ornamental. Sono tatuaggi custom: ogni disegno nasce su misura e viene progettato per adattarsi alle forme del corpo e valorizzarne la struttura.",
    },
    {
      id: "progetto",
      question: "Come nasce un tatuaggio custom?",
      answer:
        "Ogni progetto parte dall\u2019ascolto della richiesta. Il tatuaggio prende poi forma direttamente sul corpo, con una bozza realizzata a pennarello che permette di vedere fin da subito l\u2019insieme del disegno sulla zona scelta. Da quella base viene sviluppato il disegno definitivo.",
    },
    {
      id: "ghostlines",
      question: "Che cosa sono le ghostlines?",
      answer:
        "Le ghostlines sono la prima seduta del tatuaggio: l\u2019intero stencil viene ricalcato sulla pelle con linee molto leggere, fissando la struttura completa del disegno. Le sedute successive partono da quella traccia e completano il tatuaggio progressivamente.",
    },
    {
      id: "preventivo",
      question: "Come viene calcolato il preventivo di un tatuaggio?",
      answer:
        "Il preventivo tiene conto di tre elementi: il tempo necessario alla progettazione del disegno, la prima seduta di ghostlines e le sedute successive in cui il tatuaggio viene completato. Ogni progetto viene valutato singolarmente, perch\u00e9 soggetto, dimensione, zona del corpo e livello di dettaglio cambiano il tempo di lavoro.",
    },
    {
      id: "idea",
      question: "Posso proporre una mia idea o portare dei riferimenti?",
      answer:
        "S\u00ec: il punto di partenza \u00e8 sempre la tua idea. Nel modulo di consulenza di questa pagina puoi descrivere soggetto, significato, zona del corpo e dimensione, e allegare le immagini di riferimento che ti sembrano utili.",
    },
    {
      id: "flash",
      question: "Che differenza c\u2019\u00e8 tra un flash e un tatuaggio custom?",
      answer: `I flash sono disegni gi\u00e0 pronti, pensati per essere tatuati; un tatuaggio custom viene invece progettato da zero sulla tua richiesta e sul tuo corpo. I flash ancora disponibili vengono pubblicati su Instagram, su ${instagramProfile.handleWithAt}.`,
    },
    {
      id: "consulenza",
      question: "Come si richiede una consulenza a Valentine Tattoo?",
      answer: `Puoi compilare il modulo di consulenza in questa pagina, raccontando la tua idea e allegando eventuali riferimenti, oppure scrivere un messaggio privato su Instagram a ${instagramProfile.handleWithAt}. Ogni richiesta viene letta e valutata singolarmente.`,
    },
  ] as const,
} as const;

/** Persistent chrome: header call to action, footer, back-to-top. */
export const siteChromeContent = {
  headerCta: "CONSULENZA",
  footerPlace: `${artist.city} · ${artist.studio}`,
  backToTop: "Torna su",
} as const;

export const a11yContent = {
  skipToContent: "Vai al contenuto principale",
  openMenu: "Apri il menu",
  closeMenu: "Chiudi il menu",
  menuLabel: "Menu di navigazione",
  primaryNavLabel: "Navigazione principale",
  externalLinkHint: "si apre in una nuova scheda",
} as const;
