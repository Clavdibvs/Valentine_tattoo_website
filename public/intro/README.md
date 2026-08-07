# Video di apertura

Due file, generati da `npm run build:intro` a partire dai master in
`VIDEO INIZIALI/`:

    intro-desktop.mp4   1920×1080, 60 fps, ~3,2 MB, 4,050s
    intro-mobile.mp4    1080×1920, 60 fps, ~1,3 MB, 3,283s

Le durate reali sono scritte dalla build in `intro-manifest.json` e lette da lì:
è la rampa a deciderle, e solo lo script che la applica le conosce al fotogramma.

Entrambi facoltativi: se mancano, il sito apre direttamente sull'hero.
L'intro è un'aggiunta, mai un passaggio obbligato.

## La rampa è cotta dentro il file

I master durano 7 secondi e si esauriscono in 3,3–4,1 tramite una rampa di
velocità:

| | |
|---|---|
| fino al video 5s | tasso in discesa lineare da 4× a 1×, coperto in 2 secondi |
| video 5s → fine | a **1×**, quindi gli ultimi 2 secondi sono reali |

Il tasso cala *linearmente nel tempo* — è questo che si legge come rampa e non
come cambio di marcia. Il valore iniziale non è scelto a occhio: per una discesa
lineare da r₀ a 1 in 2 secondi il video coperto è (r₀ + 1), quindi r₀ = 4 dà
esattamente i 5 secondi voluti. Espressa in funzione della posizione:

    rate(v) = √(16 − 3v)      per v ≤ 5

e integrata, dà il tempo di uscita di ogni posizione del clip:

    t(v) = (8 − 2√(16 − 3v)) / 3

### Perché non è più applicata dal browser

Lo era, con `video.playbackRate` a ogni fotogramma. Era corretta e faceva
comunque scattare il video sul telefono.

I master sono a **24 fps**. Al picco della rampa il browser si trovava a dover
presentare circa 70 fotogrammi al secondo su un display a 60 Hz. Non può: ne
scarta circa uno su sette — e li scarta a intervalli **irregolari**. È
l'irregolarità che l'occhio legge come scatto. Il file non è mai stato il
problema: 3,87 Mbps per 1080×1920 è perfettamente sano.

Ora la rampa vive nei file, ricampionati da `scripts/bake-intro-ramp.swift` su
una griglia a **60 fps costanti**. La pagina riproduce a 1× e non tocca mai
`playbackRate`: ogni fotogramma cade su un refresh.

Misurato, dopo:

| | prima | dopo |
|---|---|---|
| fotogrammi persi (mobile) | 12,4% → 1,8% | **0,0%** |
| fotogrammi persi (desktop) | 12,4% | **0,4%** |
| dev.std della cadenza (mobile) | — | 0,9 ms |
| scarti oltre 25 ms (mobile) | — | 0 |
| peso mobile | 3,4 MB | 1,3 MB |
| peso desktop | 5,6 MB | 3,2 MB |

Il calo di peso non è una compressione più aggressiva: il ricampionamento toglie
la ridondanza del 4K a 24 fps, la traccia audio sparisce (il clip è muto nella
pagina, e su iOS un cambio di tasto trascina il clock audio in una risincronia
che si vede) e il mobile non spedisce più i due secondi vuoti del suo master.

Il **mobile parte dal secondo 2,6**: il master si apre su aria morta — luminanza
piatta a ~1,4 fino a 2,5s — e riprodurla significherebbe qualche secondo di nero
proprio mentre il visitatore si sta chiedendo se il sito stia caricando. Ora il
taglio avviene in fase di build, quindi quei secondi non vengono nemmeno
scaricati. Il desktop non ha questo problema e parte da 0.

Niente B-frame: farebbero risparmiare poco e costerebbero al decoder un buffer
di riordino e la latenza che ne segue — il compromesso sbagliato per un clip il
cui unico scopo è scorrere senza intoppi su un telefono.

## Il ritaglio

Lo sfondo hero non è l'immagine intera: `build-backdrops.mjs` ritaglia ogni
piastra fra le sue cornici e pubblica le frazioni usate in
`src/content/backdrop-crop.json`. Il video riceve **lo stesso ritaglio**, letto
da lì e mai ricopiato a mano — altrimenti al momento del passaggio l'immagine
scivolerebbe in verticale, proprio quando deve essere invisibile.

Per questo i master vanno consegnati **interi**, non pre-ritagliati.

La scala di uscita è esatta — 1080×1920 e 1920×1080, le misure delle piastre —
perché la pagina stira il video per riempire il riquadro (`object-fit: fill`) e
una larghezza dispari sarebbe uno schiacciamento permanente.

Verificato sull'ultimo fotogramma: **0px su mobile** (minimo netto della curva di
correlazione), **−2px su desktop** con curva quasi piatta, cioè al più 2px su 900
e comunque sotto la dissolvenza.

## Tempi

In `src/lib/intro-timing.ts`:

| | |
|---|---|
| `cueAfterSeconds: 1` | secondi dopo l'avvio in cui header e contenuti cominciano a comparire |
| `fade: 1.8` | dissolvenza, calibrata per **finire** quando finisce il clip |

Cue e dissolvenza sono su normali timer. Prima erano guidati da un ciclo per
fotogramma, perché la rampa ne richiedeva comunque uno; ora che posizione del
clip e tempo reale coincidono, quel ciclo sveglierebbe il thread principale
sessanta volte al secondo durante l'unica animazione che non deve essere
disturbata.

Misurato: cue a 1,00s su entrambi, intro conclusa a 3,33s (mobile) e 4,06s
(desktop).

## Comportamento

- Con `prefers-reduced-motion` l'intro non parte **e il video non viene
  nemmeno scaricato** — la sorgente viene assegnata all'idratazione, dopo aver
  letto la preferenza, e il preload è condizionale.
- Se l'autoplay viene rifiutato, il file manca o la decodifica fallisce, gli
  elementi compaiono subito e l'overlay sparisce.
- Un watchdog libera comunque l'hero se la riproduzione si blocca.
- Pulsante "Salta" e tasto Esc, che sbloccano la pagina **subito**.
- Lo scorrimento è bloccato per la durata del clip e rilasciato appena finisce.
  Su una ricarica a metà pagina l'intro viene saltata del tutto: sarebbe fuori
  schermo, e bloccare la pagina per un video che non si vede non avrebbe senso.
