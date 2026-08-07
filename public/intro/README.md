# Video di apertura

Due file, generati da `npm run build:intro` a partire dai master in
`VIDEO INIZIALI/`:

    intro-desktop.mp4   1920×1080, ~5,6 MB
    intro-mobile.mp4    1080×1920, ~3,4 MB

Entrambi facoltativi: se mancano, il sito apre direttamente sull'hero.
L'intro è un'aggiunta, mai un passaggio obbligato.

## Come viene riprodotto

I clip durano 7 secondi ma si esauriscono in **4**, tramite una rampa di
velocità:

| | |
|---|---|
| video 0 → 5s | in **2 secondi reali**, con il tasso che scende da 4× a 1× |
| video 5s → fine | a **1×**, quindi gli ultimi 2 secondi sono reali |

Il tasso cala *linearmente nel tempo* — è questo che si legge come rampa e non
come cambio di marcia. Il valore iniziale non è scelto a occhio: per una discesa
lineare da r₀ a 1 in 2 secondi il video coperto è (r₀ + 1), quindi r₀ = 4 dà
esattamente i 5 secondi voluti.

Il tasso è ricavato dalla posizione del video, non da un cronometro:

    rate(v) = √(16 − 3v)      per v ≤ 5

che è la stessa curva risolta per posizione, e si autocorregge: un fotogramma
perso rientra da solo al giro successivo.

## Il ritaglio

Lo sfondo hero non è l'immagine intera: `build-backdrops.mjs` ritaglia ogni
piastra fra le sue cornici e pubblica le frazioni usate in
`src/content/backdrop-crop.json`. Il video riceve **lo stesso ritaglio**, letto
da lì e mai ricopiato a mano — altrimenti al momento del passaggio l'immagine
scivolerebbe in verticale, proprio quando deve essere invisibile.

Per questo i master vanno consegnati **interi**, non pre-ritagliati.

Verificato: scostamento verticale 0px su desktop, −1px su mobile.

## Tempi

In `src/lib/intro-timing.ts`:

| | |
|---|---|
| `cueAtVideoTime: 5` | il video arriva a 5s (≈ 2s reali) e l'hero comincia a comparire |
| `fade: 1.2` | dissolvenza, calibrata per **finire** quando finisce il clip |

Misurato: hero visibile a ~2,5s, intro conclusa a ~4,2s.

## Comportamento

- Con `prefers-reduced-motion` l'intro non parte **e il video non viene
  nemmeno scaricato** — la sorgente viene assegnata all'idratazione, dopo aver
  letto la preferenza, e il preload è condizionale.
- Se l'autoplay viene rifiutato, il file manca o la decodifica fallisce, gli
  elementi compaiono subito e l'overlay sparisce.
- Un watchdog libera comunque l'hero se la riproduzione si blocca.
- Pulsante "Salta" e tasto Esc.
