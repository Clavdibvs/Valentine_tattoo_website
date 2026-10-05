# Video promo — Valentine Tattoo

Video di motion design che presenta il sito, montato sui primi 31 secondi di
*Addiction (slowed)*. Due formati dalla stessa composizione e con gli stessi
tempi: **16:9** per YouTube, sito e schermi orizzontali, **9:16** per Reels,
Storie e TikTok.

| | 16:9 | 9:16 |
| --- | --- | --- |
| File | `promo/out/valentine-tattoo-promo-16x9.mp4` (48 MB, ~12 Mbit/s) | `promo/out/valentine-tattoo-promo-9x16.mp4` (48 MB, ~12 Mbit/s) |
| Formato | 1920×1080 | 1080×1920 |
| Poster | `…-16x9-poster.jpg` | `…-9x16-poster.jpg` |
| Sync | `…-16x9-sync.png` — scarto mediano +10 ms su 42 pluck | `…-9x16-sync.png` — scarto mediano +10 ms su 42 pluck |

Entrambi: 60 fps, H.264 High (BT.709) + AAC 48 kHz 320 kbps, 31,0 s dal
secondo 0 della traccia; dissolvenza in nero 29,15 → 30,90 s e audio in
dissolvenza 28,9 → 30,9 s. Il poster è il lockup finale (29,3 s). Nel grafico
del sync, "picco" è il fotogramma in cui l'immagine cambia di più vicino a ogni
pluck: uno scarto mediano di pochi millisecondi vuol dire che il movimento
cade sul colpo.

Tutto ciò che si vede viene dal sito: il lettering e il logo reali, gli sfondi
cromati, la clip d'apertura (desktop e mobile), le catture delle sezioni in
esecuzione, le gallerie già pubblicate, i font self-hosted (Bodoni Moda, Jost).
Anche il vocabolario del movimento è quello del sito: la curva `FORGE`, la
decodifica delle etichette, le hairline che si disegnano dal centro, la stella
a quattro punte, l'ember viola degli stati attivi.

**Foto di Valentina.** L'unica foto di Valentina nei video è il ritratto
pubblicato sul sito (`public/images/valentina/portrait.webp`, sezione About).
Le altre immagini sono lavori, flash, merch e post già pubblicati sul sito;
la storia "Creazioni" mostra solo opere, e la cattura desktop della sezione
Creazioni parte dalla quarta card del carosello, oltre lo scatto di Valentina
al lavoro (`RAIL_START` in `scripts/capture-site.mjs`).

---

## L'analisi dell'audio

`scripts/analyze-audio.py` legge la traccia e scrive
`composition/audio-map.js`. Nessun tempo è scritto a mano nelle scene: ogni
taglio, colpo e dissolvenza si legge da quella mappa.

**Griglia.** 87,38 BPM in 4/4. Tutti gli eventi cadono su una griglia di
sedicesimi da 0,17166 s; la battuta 1 parte col primo suono (0,050 s) e
l'attacco del drop (5,5435 s) cade esattamente 32 sedicesimi dopo. Verificato
con l'autocorrelazione delle bande: il materiale si ripete ogni 32 e 64
sedicesimi (2 e 4 battute).

**Il pluck "a terzine".** Il basso pluck suona a gruppi di **tre sedicesimi**:
colpi sui sedicesimi 0 · 3 · 6 · 9 di ogni battuta, poi una variazione
nell'ultimo quarto (15, oppure 12, oppure 10). Tre sedicesimi sono un ottavo
puntato: 0,515 s, cioè circa 116,5 colpi al minuto contro la pulsazione a
87,4. È questo 3-contro-4 che all'orecchio suona come una terzina.

```
           1   .   .   .   2   .   .   .   3   .   .   .   4   .   .   .
battuta 3  X   .   .   x   .   .   X   .   .   x   .   .   .   .   .   x
battuta 4  X   .   x   x   .   x   X   .   .   .   X   .   .   .   .   .
battuta 5  X   .   .   x   .   .   x   .   .   x   .   .   .   .   .   x
battuta 6  x   .   .   x   .   .   X   .   .   .   .   .   x   .   .   .
battuta 7  x   .   .   x   .   .   x   .   .   x   x   .   .   .   .   X
battuta 8  X   .   .   X   .   .   x   .   .   .   .   .   x   .   .   .
battuta 9  X   .   .   x   .   .   X   .   .   x   .   .   .   .   .   X
battuta 10 x   .   .   x   .   .   X   .   .   x   .   .   X   .   X   x
```

**Struttura.**

| Tempo | Battuta | Musica |
| --- | --- | --- |
| 0,05 | 1 | primo suono: drone, sub che si gonfia, linea di campanelli a sedicesimi |
| 2,80 | 2 | riser (rumore che sale nelle alte) |
| 5,21–5,54 | — | due sedicesimi di **silenzio** |
| 5,54 | 3 | **drop**: 808 + pluck; crash sul secondo pluck (6,06) |
| 16,53 | 7 | il giro di 4 battute riparte |
| 27,52 | 11 | entra la **cassa dritta** (quattro quarti) col backbeat |

## Lo storyboard

I due formati condividono ogni tempo; cambia la messa in scena. Nel 16:9 il
sito sta in una finestra del browser, nel 9:16 su un telefono.

| Tempo | 16:9 | 9:16 | Agganciato a |
| --- | --- | --- | --- |
| 0,05 | la stella-sigillo si accende, la hairline si disegna, la cornice di pagina si traccia | uguale, in verticale | primo suono |
| 0,5–2,2 | l'eyebrow del sito si decodifica | su due righe, come sull'hero mobile | la decodifica "scatta" su ogni campanello |
| 2,80–5,21 | la clip d'apertura del sito fa crescere il sigillo cromato; rail di glifi in accelerazione; zoom, aberrazione e tremolio crescono | la clip d'apertura mobile | inviluppo del riser |
| 4,08–5,03 | INSTAGRAM, CREAZIONI, FLASH, MERCH, BOOKING, ABOUT | uguale | un nome per campanello |
| 5,21 | l'immagine collassa come un CRT che si spegne; nero | uguale | il silenzio |
| 5,54 | il wordmark sbatte in scena: flash, onda d'urto, zoom burst | uguale | il drop |
| 5,54–7,09 | un riflesso cromato attraversa il wordmark | uguale | ogni pluck (0-3-6-9) |
| 6,06 | l'eyebrow entra con il "track" del sito | sopra il wordmark, su due righe | crash |
| 6,57 | — | "Resident presso Crossbone Studio", parola per parola | 3° pluck |
| 7,09–8,09 | la camera arretra: il wordmark diventa quello dell'hero, l'hero è una finestra del browser | l'hero è lo schermo di un telefono | 4° pluck |
| 8,29 → 27,52 | una sezione per battuta, con whip-scroll che atterra sul downbeat e un glitch a fette sull'intero fotogramma (più forte a 16,53, dove il giro riparte) | uguale | downbeat |
| battuta 4 | INSTAGRAM: i post escono dalla griglia | quattro attorno al telefono, l'ultimo verso chi guarda | pluck |
| battuta 5 | CREAZIONI: una storia che taglia al lavoro successivo, con la barra di avanzamento | la storia occupa l'altezza del fotogramma | pluck |
| battuta 6 | FLASH: i flash vengono distribuiti a ventaglio | il ventaglio si apre sotto il telefono | pluck |
| battuta 7 | MERCH: il rail scatta di una card | davanti al telefono | pluck |
| battuta 8 | BOOKING: "LA TUA IDEA, / LA MIA VISIONE." forgiato; arriva la CTA | il titolo sopra il telefono, la pagina scorre fino al form | pluck |
| battuta 9 | ABOUT: il ritratto, poi CUSTOM · PLACEMENT · TRIGGIANO | il ritratto spinge il telefono fuori campo; le tre parole in colonna | 0-3-6, la "terzina" |
| battuta 10 | il telefono passa per tutte e sette le sezioni | un browser desktop passa per le sette sezioni | 7 pluck = 7 sezioni |
| 27,52 | lockup: logo, wordmark, indirizzo, @valentine.ttt | lockup in colonna | la cassa |
| 28,2 / 28,9 | l'indirizzo si decodifica, poi il glint | uguale | cassa |
| 29,15 → 30,9 | dissolvenza di immagine e suono | uguale | — |

Nel 16:9 la navigazione del sito, in basso, fa da indice: la voce attiva si
accende e la sottolineatura ember scorre a ogni sezione. Nel 9:16 l'indice è
in alto, a segmenti come l'avanzamento di una storia. Nel verticale testi e
card restano tra y ≈ 250 e 1530, fuori dalle interfacce che Reels e Storie
sovrappongono in alto e in basso.

Nel verticale il passaggio dal wordmark libero al telefono (7,09 s) funziona
perché la tipografia libera è quella dell'hero mobile, misurata sulla cattura:
eyebrow in Jost 12,14 px con tracking 0,26 em, "Resident presso…" in Bodoni
corsivo 18,34 px, alle stesse quote. Durante la dissolvenza nulla si sdoppia.

---

## Rigenerare i video

Servono Python 3 con `numpy scipy librosa matplotlib`, Node 22, ffmpeg e
Playwright: gli script lo prendono dal progetto se installato, altrimenti
dall'installazione globale (`npm root -g`).

```bash
# 1. Mappa audio
python3 promo/scripts/analyze-audio.py "<percorso>/Addiction_slowed.mp3"

# 2. Catture del sito in esecuzione (promo/captures, non versionate)
npm run build && npx next start -p 3123 &
node promo/scripts/capture-site.mjs http://localhost:3123
#    una cattura sola: ONLY=desktop-creazioni node promo/scripts/capture-site.mjs …

# 3. Render: anteprima veloce, poi il master e la copia di consegna.
#    --format=16x9 (predefinito) oppure --format=9x16
node promo/scripts/render.mjs --format=9x16 --scale=0.5 --fps=30 \
  --audio="<percorso>/Addiction_slowed.mp3" --out=promo/.cache/preview.mp4
for F in 16x9 9x16; do
  node promo/scripts/render.mjs --format=$F --samples=auto --workers=2 --crf=12 \
    --audio="<percorso>/Addiction_slowed.mp3" --out=promo/.cache/master-$F.mp4 \
    --deliver=promo/out/valentine-tattoo-promo-$F.mp4
done

# 4. Verifica del sync (grafico + scarto tra pluck e picchi dell'immagine)
python3 promo/scripts/check-sync.py promo/out/valentine-tattoo-promo-9x16.mp4

# Fotogrammi singoli per controllo
node promo/scripts/render.mjs --format=9x16 --scale=0.5 --stills=5.6,9.6,27.6
```

Il render è diviso in blocchi da due secondi salvati in `promo/.cache/chunks/`:
se si interrompe, rilanciando lo stesso comando riparte dai blocchi mancanti.
I blocchi stanno sotto una chiave calcolata dal codice della composizione, dalla
mappa audio e dai parametri (formato compreso), quindi una modifica non mescola
mai blocchi vecchi e nuovi.

La traccia sorgente e le catture restano fuori dal repository, come gli altri
sorgenti media del progetto: i video finali sono gli unici file pesanti
versionati.

## Come è fatto

`composition/` è una pagina che disegna un fotogramma come funzione pura del
tempo: nessun orologio, nessuna animazione del browser. `render.mjs` la apre in
Chromium headless (`?format=16x9` o `?format=9x16`), chiede un fotogramma alla
volta, legge i pixel dal buffer WebGL e li passa direttamente a ffmpeg. Lo
stesso fotogramma esce sempre identico, quindi il sync dipende solo dalla
mappa audio.

- `lib/engine.js` — compositor WebGL2 2.5D: layer in un mondo in pixel con
  camera prospettica, precomp (la pagina dentro il browser e il telefono, la
  storia), shader specializzati per effetto (riflesso cromato, split RGB, blur
  direzionale, glitch, maschere), bloom, aberrazione cromatica, zoom burst,
  grana, vignettatura, dissolvenza. Il motion blur è reale: ogni fotogramma
  media 2–4 sotto-fotogrammi su un otturatore a 180°, di più dove il
  movimento è veloce (`samplesAt` in `scenes/index.js`).
- `lib/format.js` — il formato scelto dall'URL: dimensioni e centro del
  fotogramma.
- `lib/timing.js` — griglia musicale, eventi, curve (`FORGE` è la stessa
  curva del sito), rumore deterministico.
- `lib/draw2d.js` — tipografia e ornamenti del sito in Canvas2D; i path degli
  ornamenti sono copiati da `src/components/ornaments`.
- `scenes/` — `intro.js` (battute 1–2) e `final.js` (11 → fine) si impaginano
  per entrambi i formati; `drop.js` (3) e `tour.js` (4–10) sono il 16:9,
  `v/drop.js` e `v/tour.js` il 9:16.
