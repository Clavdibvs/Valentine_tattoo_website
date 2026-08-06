# Valentine Tattoo

Sito ufficiale one-page di **Valentina Stucchi**, tatuatrice di Valenzano che riceve a
Triggiano presso Crossbone Studio.

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · GSAP/ScrollTrigger ·
Motion · Zod.

---

## Indice

1. [Installazione](#installazione)
2. [Comandi](#comandi)
3. [Struttura](#struttura)
4. [Dove si modificano i testi](#dove-si-modificano-i-testi)
5. [Configurazione WhatsApp](#configurazione-whatsapp)
6. [Collegare l'account Instagram](#collegare-laccount-instagram)
7. [Rinnovo del token Instagram](#rinnovo-del-token-instagram)
8. [Modulo di consulenza](#modulo-di-consulenza)
9. [Asset reali mancanti](#asset-reali-mancanti)
10. [Accessibilità e motion](#accessibilità-e-motion)
11. [Deploy](#deploy)

---

## Installazione

```bash
npm install
cp .env.example .env.local     # poi compilare .env.local
npm run dev                    # http://localhost:3000
```

`.env.local` non viene mai committato. `.env.example` è il template, senza segreti.

Il sito funziona anche **senza nessuna variabile configurata**: in quel caso nasconde
i pulsanti WhatsApp, mostra uno stato "feed non disponibile" al posto della galleria
Instagram e il modulo rifiuta gli invii spiegando il motivo. Non inventa mai dati.

---

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm start` | Avvia la build di produzione |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript senza emit |
| `npm run check` | lint + typecheck + build (da usare prima di ogni deploy) |
| `npm run instagram:exchange` | Converte un token short-lived in long-lived |
| `npm run instagram:refresh` | Rinnova il token long-lived per altri 60 giorni |

---

## Sezioni

L'ordine è **Home → Instagram → Creazioni → Flash → Merch → Booking → About**.
About chiude la pagina: prima il lavoro, poi l'invito a scrivere, infine la
storia dell'artista.

### Creazioni, Flash e Merch

Erano richieste come "storie in evidenza" di Instagram. **L'API ufficiale non
espone gli highlight**: il nodo IG User ha `media`, `stories` (solo le 24 ore
attive), `tags` e `mentions`, e nessun edge per gli highlight. I servizi terzi
che li offrono sono scraper, esclusi dal brief e contrari ai ToS di Instagram.

Le tre sezioni sono quindi costruite **dal feed reale**, selezionando i post da
un marcatore nella didascalia. Valentina tagga un post una volta e finisce nella
sezione giusta — nessuna modifica al codice, nessuna seconda chiamata API,
nessuno scraping.

Due modalità, in ordine di priorità:

1. **Lista esplicita** — `INSTAGRAM_<NOME>_MEDIA_IDS`: id dei media separati da
   virgola. Controllo manuale totale, nell'ordine indicato.
2. **Marcatori nella didascalia** — `INSTAGRAM_<NOME>_TAGS`: hashtag o parole
   chiave. I default coprono già i casi ovvi (`#flash` → FLASH, `#merch` →
   MERCH); si sovrascrivono solo se lei usa tag diversi.

Tutte e quattro le sezioni Instagram leggono **la stessa risposta in cache**:
una sola richiesta upstream per finestra di revalidazione.

---

## Struttura

```
src/
  app/
    layout.tsx                  font self-hosted, metadata, bootstrap motion
    page.tsx                    assembla le 4 sezioni
    globals.css                 design system chrome (token, frame, tipografia)
    actions/consultation.ts     server action del modulo
  components/
    layout/                     SiteHeader, MobileMenu
    sections/                   Hero, About, Instagram, Booking
    ui/                         ChromeFrame, ChromeButton, SectionHeading, …
    ornaments/                  sigilli, rail, divisori, monogramma (tutti SVG)
    instagram/                  card, feed, stati (skeleton / vuoto / errore)
    booking/                    ConsultationForm, ReferenceUploader
    animation/                  ScrollAnimations (solo GSAP)
  config/site-config.ts         identità, contatti, navigazione, integrazioni
  content/site-content.ts       TUTTI i testi visibili
  lib/
    instagram/                  data layer server-side + tipi + dati demo
    consultation/               schema Zod, adapter di consegna, storage
    hooks/                      sezione attiva, stato di scroll
scripts/refresh-instagram-token.mjs
design-references/              gli 8 screenshot di riferimento
```

**Sfondo ornamentale.** `PageBackdrop` è una striscia unica che copre l'intero
documento, non una piastra per sezione: le immagini fornite sono state disegnate
per proseguire l'una nell'altra, e separarle per sezione produceva bande
orizzontali visibili. Le piastre si sovrappongono in `mix-blend-mode: screen` —
l'arte è cromo chiaro su nero puro, e sotto `screen` il nero non contribuisce —
con una maschera alpha che elimina la cornice orizzontale di ogni piastra. Il
risultato non ha giunture. Per sostituire un'immagine basta rimpiazzare i WebP in
`public/backdrops/`.

**Divisione delle librerie di animazione** (nessun elemento è animato da entrambe):

- **GSAP + ScrollTrigger** — reveal di sezione, entrata/uscita delle sezioni,
  parallasse dello sfondo, line draw, sweep chrome. Solo animazioni da scroll.
- **Motion** — menu mobile, stati hover/tap dei pulsanti, presence del form,
  transizioni di layout dell'uploader.
- **Transizioni CSS** — colore, opacità, bordo, glow.

---

## Dove si modificano i testi

Tutti i contenuti visibili stanno in **`src/content/site-content.ts`**.
Dati identitari, contatti e link in **`src/config/site-config.ts`**.
Non c'è testo hard-coded nei componenti e nessun testo è dentro un'immagine.

---

## Configurazione WhatsApp

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=39XXXXXXXXXX
```

Formato internazionale, **solo cifre**, senza `+` e senza spazi.
Il messaggio precompilato è in `site-config.ts` (`whatsappPrefilledMessage`).

Se la variabile è vuota il sito **non mostra** i pulsanti WhatsApp e propone
Instagram: non viene mai generato un link verso un numero inventato.

> ⚠️ **Le variabili `NEXT_PUBLIC_*` vengono inlineate durante la build.**
> `NEXT_PUBLIC_WHATSAPP_NUMBER` deve quindi essere presente **al momento della
> build**, non solo a runtime. Se si cambia il numero occorre **rideployare**,
> non basta riavviare il processo. Le variabili server-side (Instagram, form)
> vengono invece lette a runtime e non richiedono una nuova build.

---

## Collegare l'account Instagram

La galleria usa l'**Instagram API with Instagram Login** (`graph.instagram.com`),
lato server. Nessuno scraping, nessun endpoint privato, nessun token nel browser.

> ⚠️ **Finché queste variabili non sono compilate la galleria NON mostra post.**
> In sviluppo compaiono placeholder vettoriali con un banner giallo; in
> produzione compare "Feed non disponibile" con il link al profilo. È il
> comportamento voluto: il sito non inventa mai contenuti.

**Prerequisito:** l'account `@valentine.ttt` deve essere **Professional**
(Business o Creator), non personale. Si cambia dall'app Instagram:
*Impostazioni → Tipo di account e strumenti → Passa a un account professionale*.
Gli account personali non sono accessibili da nessuna API ufficiale.

1. Su [developers.facebook.com](https://developers.facebook.com/apps) creare un'app
   e aggiungere il prodotto **Instagram** → *API setup with Instagram login*.
2. Aggiungere l'account come tester e accettare l'invito dalle impostazioni
   Instagram dell'account.
3. Richiedere il permesso **`instagram_business_basic`** (sufficiente per leggere i
   media; non servono permessi di pubblicazione o messaggistica).
4. In *Instagram → API setup with Instagram login* usare il pulsante
   **"Generate token"** accanto all'account: si ottiene un token e, nella
   stessa schermata, l'**Instagram user ID** numerico.
   In alternativa, completando il flusso OAuth si ottiene un token
   *short-lived* (1 ora) da convertire:

   ```bash
   INSTAGRAM_ACCESS_TOKEN=<short-lived> INSTAGRAM_APP_SECRET=<app secret> \
     npm run instagram:exchange
   ```

5. Copiare in `.env.local` (e nelle variabili d'ambiente dell'hosting):

   ```bash
   INSTAGRAM_USER_ID=<id numerico dell'account>
   INSTAGRAM_ACCESS_TOKEN=<token long-lived>
   INSTAGRAM_API_VERSION=v25.0
   INSTAGRAM_FEED_LIMIT=12
   ```

> `INSTAGRAM_ACCESS_TOKEN` **non deve mai** avere il prefisso `NEXT_PUBLIC_`.
> Il token resta sul server: viene usato solo dentro `src/lib/instagram/client.ts`,
> che è marcato `server-only`.

**Caching.** Il feed è memorizzato dalla data cache di Next per 1 ora
(`instagramFeed.revalidateSeconds`). Instagram non viene interrogato a ogni
visita, gli URL CDN (che scadono) vengono rinfrescati con regolarità e i rate
limit sono rispettati. Per invalidare manualmente: `revalidateTag("instagram-feed")`.

**Versione API.** `INSTAGRAM_API_VERSION` è configurabile perché Meta cambia
periodicamente versioni e nomi dei permessi: verificare la documentazione
ufficiale prima di un aggiornamento.

**Stati gestiti:** caricamento (skeleton), feed vuoto, token scaduto, rate limit,
permessi mancanti, errore di rete, credenziali assenti. In ogni caso di errore
la sezione mostra un messaggio sobrio e il link diretto al profilo reale — non
vengono **mai** mostrati post finti in produzione.

**Dati demo.** Solo in sviluppo e solo se le credenziali mancano, la griglia usa
placeholder vettoriali neutri (`public/dev/`), etichettati come tali da un banner.

**Diagnostica rapida.** Se dopo la configurazione il feed resta vuoto, il motivo
esatto viene stampato nei log del server come `[instagram] <motivo>: <messaggio>`
e, in sviluppo, mostrato anche a schermo. I casi tipici:

| Messaggio | Causa | Rimedio |
| --- | --- | --- |
| `token-expired` | token scaduto o non valido | `npm run instagram:refresh`, o rifare il login se già scaduto |
| `unauthorized` | manca `instagram_business_basic` | aggiungere il permesso all'app |
| `rate-limited` | troppe richieste | attendere; la cache di 1 ora normalmente lo evita |
| `not-configured` | variabili assenti | compilare `INSTAGRAM_USER_ID` e `INSTAGRAM_ACCESS_TOKEN` |

---

## Rinnovo del token Instagram

I token long-lived durano **~60 giorni** e non si rinnovano da soli.

```bash
npm run instagram:refresh
```

Lo script stampa il nuovo token: va incollato nelle variabili d'ambiente
dell'hosting, poi si rideploya.

> ⚠️ Un token **già scaduto non può essere rinnovato**: bisogna rifare il flusso di
> login. Impostare un promemoria ricorrente **ogni 50 giorni**.

---

## Modulo di consulenza

Validazione con lo **stesso schema Zod** lato client e lato server
(`src/lib/consultation/schema.ts`). Il client non decide cosa è valido.

Protezione anti-spam: honeypot, soglia di tempo minimo di compilazione, rate limit
per IP (5 invii / 10 minuti). I file allegati sono validati per numero, dimensione,
MIME dichiarato **e magic number**; i nomi file vengono sanificati.

### Provider di consegna

Va configurata **una** delle due opzioni. Senza nessuna delle due il modulo
**rifiuta l'invio** e lo dichiara: non finge mai un successo.

**A — Webhook** (Make, Zapier, n8n, API propria…):

```bash
CONSULTATION_WEBHOOK_URL=https://...
CONTACT_PROVIDER_API_KEY=...        # opzionale, inviato come Bearer
```

**B — Email transazionale:**

```bash
CONSULTATION_RECIPIENT_EMAIL=valentina@...
CONTACT_PROVIDER_API_URL=https://api.resend.com/emails   # o altro provider
CONSULTATION_SENDER_EMAIL="Valentine Tattoo <no-reply@dominio.it>"
CONTACT_PROVIDER_API_KEY=...
```

### Archiviazione dei riferimenti (opzionale)

```bash
UPLOAD_STORAGE_BUCKET=
UPLOAD_STORAGE_ENDPOINT=
UPLOAD_STORAGE_TOKEN=
```

Senza storage i file vengono comunque validati e i loro metadati viaggiano con la
richiesta; solo i binari non vengono conservati.

> Il rate limit è in memoria, quindi per-istanza. Su un hosting multi-istanza
> sostituirlo con uno store condiviso (Redis, Upstash) in
> `src/app/actions/consultation.ts`.

---

## Asset reali mancanti

Vedi **[ASSETS.md](./ASSETS.md)** per il manifest completo.

Da fornire (nessun sostituto generato è stato spacciato per reale):

| File | Uso |
| --- | --- |
| `public/images/valentina/portrait.webp` | ritratto sezione About |
| `public/images/valentina/portrait-mobile.webp` | crop verticale (opzionale) |

Finché non ci sono, le cornici mostrano un **placeholder neutro dichiarato**
("Ritratto in attesa della foto ufficiale") che conserva le proporzioni esatte,
così l'inserimento della foto reale non provoca layout shift. Basta copiare il file
nel percorso indicato: nessuna modifica al codice.

---

## Accessibilità e motion

- Struttura semantica con landmark, un solo `<h1>`, gerarchia `<h2>` coerente.
- Skip link, focus visibile ovunque, target interattivi ≥ 44 × 44 px.
- Menu mobile: `role="dialog"`, focus trap, chiusura con `Esc`, blocco dello scroll,
  focus restituito al pulsante che l'ha aperto.
- Carosello Instagram: navigabile da tastiera (frecce ←/→), controlli etichettati.
- Modulo: label reali, descrizioni collegate, errori associati con `aria-describedby`,
  stati di caricamento/successo/errore annunciati.
- `alt` derivato da un estratto **sanificato e accorciato** della caption reale;
  gli ornamenti sono `aria-hidden` e `pointer-events: none`.
- `prefers-reduced-motion: reduce`: parallasse, deriva e shimmer disattivati, nessuna
  animazione in esecuzione, tutti i contenuti visibili.
- Senza JavaScript la pagina è completamente leggibile e utilizzabile: i reveal
  vengono messi in scena solo quando il motore di animazione è realmente attivo, con
  un watchdog che li rimuove se non parte.

---

## Deploy

```bash
npm run check     # lint + typecheck + build
```

Impostare sull'hosting tutte le variabili di `.env.example` che si vogliono attive.
Il progetto è un'app Next.js standard: funziona su Vercel senza configurazione
aggiuntiva; su altri host servono Node 20+ e `npm run build && npm start`.
