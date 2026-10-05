/**
 * The composition: which scene draws when, and the frame-wide grade.
 *
 *   0.05  bar 1   ignition          intro.js
 *   2.80  bar 2   build (riser)     intro.js
 *   5.21          two silent 16ths  CRT off, black
 *   5.54  bar 3   drop: wordmark    drop.js   (9:16: v/drop.js)
 *   8.29  bar 4–10 the site tour     tour.js   (9:16: v/tour.js)
 *  27.52  bar 11  kick: lockup      final.js
 *  29.15 → 30.90  fade to black (audio fades 28.9 → 30.9, render.mjs)
 *
 * The intro and the lockup lay themselves out for either format; the drop and
 * the tour are staged differently for a tall frame (a phone instead of a
 * browser window), so each format has its own module. Both share every time.
 */

import { F } from "../lib/format.js";
import { GAP, DROP, bar, PLUCKS, INOUT, prog } from "../lib/timing.js";
import { initCommon } from "./common.js";
import { intro, prepareIntro } from "./intro.js";
import * as landscape from "./drop.js";
import * as portrait from "./v/drop.js";
import { tour as tourH } from "./tour.js";
import { tour as tourV } from "./v/tour.js";
import { final, FADE } from "./final.js";

const { drop, PULL0, PULL1 } = F.vertical ? portrait : landscape;
const tour = F.vertical ? tourV : tourH;

export function init(E, A) {
  initCommon(E, A);
}

export async function prepare(t, spread) {
  await prepareIntro(t, spread);
}

export function build(t) {
  const layers = [];
  const camera = { x: F.cx, y: F.cy, zoom: 1, roll: 0, rx: 0, ry: 0 };
  const post = { bloom: 0.55, bloomWide: 0.32, exposure: 1, flash: 0, ca: 0.0015, distort: 0, zoomBlur: 0 };
  intro(t, layers, camera, post);
  if (t >= GAP[0]) drop(t, layers, camera, post);
  tour(t, layers, camera, post);
  final(t, layers, camera, post);
  return { layers, camera, post };
}

build.output = (t) => ({
  grain: 0.042,
  vignette: 0.42,
  sat: 0.94,
  tintShadow: [0.004, 0.0, 0.01],
  tintHigh: [0.006, 0.002, 0.012],
  fade: INOUT(prog(t, FADE[0], FADE[1])),
});

/**
 * Motion-blur subframes per output frame: four where things move fast (the
 * riser's end, the slam, the pull-back, every whip, the final push), three
 * just after each pluck gesture, two elsewhere.
 */
const FAST = [
  [4.6, GAP[1]], [DROP, DROP + 0.45], [PULL0, PULL1], [27.0, bar(11) + 0.5],
  ...[4, 5, 6, 7, 8, 9, 10].map((n) => [bar(n) - 0.32, bar(n) + 0.3]),
];
export function samplesAt(t) {
  if (FAST.some(([a, b]) => t >= a && t <= b)) return 4;
  if (PLUCKS.some((p) => t >= p.t && t <= p.t + 0.4)) return 3;
  return 2;
}
