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
| Logo mark "VT" | `src/components/ornaments/BrandMark.tsx` → `LogoMark` | SVG inline | monogramma chrome, 64×72 viewBox |
| Wordmark | `SiteHeader` + `BrandLockup` | **testo HTML** | resta selezionabile ed editabile |
| Firma "Valentina Stucchi" | `BrandMark.tsx` → `SignatureMark` | SVG inline | tracciato disegnato a mano; evita una terza famiglia di font |
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

**Nota sul lettering dell'hero.** Le lettere "spinate" degli screenshot sono un
rendering AI non riproducibile con un font con licenza. L'H1 usa Bodoni Moda con il
trattamento chrome (gradiente `background-clip: text` + bloom + sweep). Resta un
`<h1>` semantico e selezionabile — vedi *Differenze deliberate* nel report finale.

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
| `public/images/valentina/portrait-quote.webp` | crop card citazione (facoltativo) | 3:4 | mancante — ricade su `portrait.webp` |

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
