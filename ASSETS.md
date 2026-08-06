# Asset manifest — Valentine Tattoo

Inventario completo degli asset visivi: cosa è già nel repository, cosa è
procedurale, cosa manca ancora e va fornito dal cliente.

**Principio applicato:** nessuno screenshot di riferimento è stato ritagliato e
usato come asset, e nessuna immagine generata da AI è presentata come materiale
reale di Valentina.

---

## 1. Marchio e ornamenti — ✅ presenti (vettoriali, nel codice)

Tutti gli ornamenti sono componenti SVG generati da parametri, non file raster.
Sono ricolorabili, scalano senza perdita e pesano complessivamente pochi KB.

| Asset | Dove | Formato | Note |
| --- | --- | --- | --- |
| Logo mark | `public/brand/logo-valentine-{96,192,288}.webp` | WebP α | **logo reale fornito**, ritagliato al bounding box (5–24 KB) |
| Wordmark hero | `public/brand/wordmark-valentine-{640,960,1400}.webp` | WebP α | **lettering reale fornito**, ritagliato (67–158 KB) |
| Wordmark header | `SiteHeader` + `BrandLockup` | **testo HTML** | resta selezionabile ed editabile |
| Sigillo principale (hero) | `ornaments/SigilOrnament.tsx` + `sigil-geometry.ts` | SVG generato | lame irregolari, vuoti biomeccanici, membrane |
| Ornamenti d'angolo | `SigilOrnament.tsx` → `CornerSigil` | SVG generato | 4 orientamenti da una sola geometria |
| Badge sigillo | `SigilOrnament.tsx` → `SigilBadge` | SVG inline | usato in strip, form, quote card |
| Stella a 4 punte | `ornaments/SigilStar.tsx` | SVG inline | il marcatore più ripetuto del sito |
| Diamante separatore | `SigilStar.tsx` → `SigilDiamond` | SVG inline | |
| Divisori ornamentali | `ornaments/OrnamentDivider.tsx` | SVG + CSS | riga hairline + stella centrale |
| Arco ornamentale | `OrnamentDivider.tsx` → `OrnamentArc` | SVG inline | sopra i titoli centrati |
| Rail laterali | `ornaments/SideGlyphRail.tsx` | SVG inline | glifi **non semantici**, `aria-hidden` |
| Cornici chrome | `ui/ChromeFrame.tsx` + `globals.css` | CSS `clip-path` | hairline 1px con angoli tagliati |
| Bracket d'angolo | `ChromeFrame.tsx` → `FrameBrackets` | SVG inline | |
| Gradienti/filtri chrome | `ornaments/ChromeDefs.tsx` | `<defs>` SVG | definiti una sola volta per tutto il documento |

### Sostituzioni rispetto agli screenshot

| Nello screenshot | Nell'implementazione | Perché |
| --- | --- | --- |
| Stringa decorativa `666` | rimossa | contenuto casuale privo di significato |
| Testo verticale illeggibile sui rail | glifi ornamentali non semantici + parole del brand | pseudo-lettere non riproducibili né accessibili |
| Metriche `♥ 317  💬 12` sulle card | rimosse | metriche social inventate |
| Strip `3+ / 500+ / 100%` | 3 blocchi qualitativi (CUSTOM / PLACEMENT / TRIGGIANO) | statistiche non verificate |
| Voci nav `WORKS`, `FLASH` | rimosse | sezioni non esistenti |
| Firma manoscritta di Valentina | nome in testo reale (corsivo Bodoni) | una firma disegnata sarebbe un artefatto inventato |
| Card citazione "Non è solo un tatuaggio…" | rimossa | frase non attribuibile né verificata |

---

## 1b. Sfondi ornamentali — ✅ presenti (forniti dal cliente)

Cinque piastre desktop e quattro mobile, disegnate per proseguire l'una
nell'altra. Composte da `PageBackdrop` come **striscia unica** dietro tutto il
documento in `mix-blend-mode: screen`, non una per sezione.

| Asset | Sorgente | Export |
| --- | --- | --- |
| `hero-desktop-{1440,2048,2688}.webp` | `new references/Desktop/1.png` | 57–160 KB |
| `about-desktop-*` | `Desktop/2.png` | 53–158 KB |
| `instagram-desktop-*` | `Desktop/3.png` | 40–132 KB |
| `booking-desktop-*` | `Desktop/4.png` | 32–112 KB |
| `booking-tail-desktop-*` | `Desktop/5.png` | 33–116 KB |
| `hero-mobile-{480,760,1080}.webp` | `new references/Mobile/1.png` | 12–58 KB |
| `about-mobile-*` · `instagram-mobile-*` · `booking-mobile-*` | `Mobile/2–4.png` | idem |

**Le piastre sono ritagliate.** Ogni sorgente è una schermata autonoma: porta la
propria cornice, una riga sottile in alto (~0,5%) e un'altra in basso (81–99%
secondo l'immagine), più un piccolo divisore centrato. Corretto per una singola
schermata — ma impilate in una striscia continua quelle righe si ripetono lungo
la pagina come bordi di scatola, ed è ciò che faceva sembrare lo sfondo un
mucchio di immagini invece di un fondale unico.

`scripts/build-backdrops.mjs` **misura** dove cadono le righe in ogni immagine
(variano parecchio) e ritaglia la banda compresa fra loro. Gli ornamenti stanno
ai bordi laterali e corrono per tutta l'altezza, quindi il ritaglio non toglie
nulla di significativo. La cornice esterna della pagina è disegnata una sola
volta in CSS (`.page-frame`).

Per rigenerarle dopo aver sostituito un sorgente:

```bash
npm i --no-save sharp
node scripts/build-backdrops.mjs
```

I PNG sorgente (~60 MB in totale) restano fuori dal repository: sono ignorati in
`.gitignore` e solo i WebP ottimizzati vengono versionati (~1,5 MB).

---

## 2. Texture di sfondo — ✅ presenti (procedurali)

| Asset | Implementazione | Perché non un file |
| --- | --- | --- |
| Grana | `--grain-url` in `globals.css` — SVG `feTurbulence` come data URI | ~380 byte inline, nessuna richiesta di rete, indipendente dalla risoluzione |
| Marmo / nuvolatura | `.atmosphere::before` — gradienti radiali sovrapposti | nessun download, nessun pattern ripetuto "rumoroso" |
| Vignettatura | `.atmosphere::after` — gradiente radiale | |
| Cornice di pagina | `.page-frame` — bordo 1px con `clip-path` | |

`public/textures/` esiste come cartella prevista dalla struttura di riferimento ma
**non contiene file**: le texture sono procedurali per scelta di performance.

---

## 3. Font — ✅ presenti (self-hosted)

| Font | File | Peso | Uso |
| --- | --- | --- | --- |
| Bodoni Moda (variable, subset latin) | `public/fonts/bodoni-moda.woff2` | 46 KB | titoli, wordmark, citazione |
| Jost (variable, subset latin) | `public/fonts/jost.woff2` | 26 KB | UI, label, testo corrente |

Self-hosted via `next/font/local`: nessuna connessione a Google Fonts a runtime
(rilevante per la privacy UE) e build riproducibili offline.

**Nota sul lettering dell'hero.** Il lettering "spinato" è ora l'immagine reale
fornita dal cliente (`wordmark-valentine-*.webp`). L'elemento resta un `<h1>`
semantico: l'immagine è `aria-hidden` e il nome accessibile è testo normale in
`sr-only`. Bodoni Moda continua a servire tutti gli altri titoli.

---

## 4. Placeholder di sviluppo — ✅ presenti, mai in produzione

| Asset | Percorso | Note |
| --- | --- | --- |
| 6 placeholder feed | `public/dev/demo-01…06.svg` | ~1,4 KB l'uno, vettoriali neutri, **non** foto |

Usati **solo** se `NODE_ENV !== "production"` **e** le credenziali Instagram mancano.
Etichettati a schermo da un banner. `fetchInstagramFeed` non li restituisce mai in
produzione.

---

## 5. Fotografie reali — ❌ MANCANTI, da fornire

| File richiesto | Uso | Proporzioni | Stato |
| --- | --- | --- | --- |
| `public/images/valentina/portrait.webp` | ritratto About | 4:5 verticale | **mancante** |
| `public/images/valentina/portrait-mobile.webp` | crop mobile (facoltativo) | 4:5 | mancante — ricade su `portrait.webp` |

**Comportamento attuale:** `src/lib/portrait.ts` verifica l'esistenza del file al
render lato server. Se manca, `PortraitFrame` mostra un placeholder dichiarato —
sigillo neutro + testo *"Ritratto in attesa della foto ufficiale"* — che mantiene
le proporzioni esatte, così l'inserimento della foto non causa layout shift.

**Il ritratto femminile visibile negli screenshot di riferimento è un'immagine
generata da AI e non è stato usato.** Presentarla come Valentina sarebbe stato
scorretto.

Per completare: copiare i file nei percorsi indicati. Nessuna modifica al codice.

Consigli di esportazione: lato lungo 1600 px, WebP qualità ~80, soggetto nella metà
superiore (l'`object-position` è `center 22%`).

---

## 6. Asset opzionali non richiesti dal design attuale

Percorsi previsti dalla struttura di riferimento ma non necessari, perché
l'equivalente è vettoriale nel codice:

- `public/brand/logo-valentine.svg` → `LogoMark`
- `public/brand/wordmark-valentine.svg` → testo HTML
- `public/brand/sigil-main.svg` → `SigilOrnament`
- `public/brand/ornaments/` → `CornerSigil`

Le cartelle esistono vuote: se in futuro si vuole sostituire un ornamento con un
file disegnato a mano, basta importarlo lì e scambiare il componente.

---

## 7. Ottimizzazione

- SVG generati da parametri: nessun path ridondante, coordinate arrotondate a 1 decimale.
- `next/image` per tutte le foto: AVIF/WebP automatici, `sizes` corretti, `fill` con
  proporzioni fisse (nessun CLS), `loading="lazy"` sotto la piega.
- Media Instagram: per video e Reel si usa `thumbnail_url` — non viene mai scaricato
  un video per mostrare un'anteprima.
- Host remoti consentiti limitati ai CDN Meta (`**.cdninstagram.com`, `**.fbcdn.net`)
  in `next.config.ts`; nessun wildcard.
- Nessun WebGL, nessun Three.js: l'estetica chrome è ottenuta con SVG, gradienti CSS
  e animazioni su `transform`/`opacity`.
