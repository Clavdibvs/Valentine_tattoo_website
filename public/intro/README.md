# Video di apertura

Due file, generati da `npm run build:intro` a partire dai master in
`VIDEO INIZIALI/`:

    intro-desktop.mp4   1920×1080, ~5,6 MB
    intro-mobile.mp4    1080×1920, ~3,4 MB

Entrambi facoltativi: se mancano, il sito apre direttamente sull'hero.
L'intro è un'aggiunta, mai un passaggio obbligato.

## Come viene riprodotto

I clip durano 7 secondi ma si esauriscono in 3,5–4, tramite una rampa di
velocità:

| | |
|---|---|
| fino al video 5s | tasso in discesa lineare fino a 1× |
| video 5s → fine | a **1×**, quindi gli ultimi 2 secondi sono reali |

Il **mobile parte dal secondo 2,6**: il master si apre su aria morta — luminanza
piatta a ~1,4 fino a 2,5s, metà del valore finale solo verso 3,5s — e riprodurla
significherebbe qualche secondo di nero proprio mentre il visitatore si sta
chiedendo se il sito stia caricando. Il desktop non ha questo problema e parte
da 0.

Entrare nella curva più avanti abbassa anche il tasso iniziale (da 4× a ~2,9×
su mobile): da sola questa modifica ha portato i fotogrammi persi su mobile
**dal 12,4% all'1,8%**.

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
| `startAt` | dove parte ciascun taglio: desktop 0, mobile 2,6 |
| `cueAfterSeconds: 1` | secondi **reali** dopo l'avvio in cui header e contenuti cominciano a comparire |
| `fade: 1.8` | dissolvenza, calibrata per **finire** quando finisce il clip |

Il cue è in tempo reale e non in posizione del video, altrimenti cadrebbe in due
momenti diversi sui due tagli, dato che il mobile entra nella curva più tardi e
quindi raggiunge prima ogni fotogramma.

Misurato: header a ~1,2s, hero a ~1,5s, intro conclusa a 3,5s (mobile) e 4,1s
(desktop).

Nota: su desktop il clip perde ~12% dei fotogrammi, che è inerente alla
riproduzione a 4× — servirebbero 4× i fotogrammi al secondo per un display a
60 Hz. Non è stutter, ed è invariato rispetto a prima.

## Comportamento

- Con `prefers-reduced-motion` l'intro non parte **e il video non viene
  nemmeno scaricato** — la sorgente viene assegnata all'idratazione, dopo aver
  letto la preferenza, e il preload è condizionale.
- Se l'autoplay viene rifiutato, il file manca o la decodifica fallisce, gli
  elementi compaiono subito e l'overlay sparisce.
- Un watchdog libera comunque l'hero se la riproduzione si blocca.
- Pulsante "Salta" e tasto Esc.
