/**
 * Musical time for the composition.
 *
 * Everything that moves is keyed to the grid and the events measured by
 * `promo/scripts/analyze-audio.py` (window.AUDIO_MAP), never to typed-in
 * seconds: change the analysis and the picture follows.
 */

const M = window.AUDIO_MAP;

export const SIX = M.sixteenth;            // 0.17166 s
export const BEAT = M.beat;                // 0.68664 s — 87.38 BPM
export const BAR = M.bar;                  // 2.74656 s
export const T0 = M.t0;                    // bar 1 downbeat (first sound)
export const DROP = M.drop;                // bar 3 downbeat
export const GAP = M.gap;                  // the two silent sixteenths before the drop
export const FPS = M.fps;

/** Downbeat of bar `n` (1-based), plus `s` sixteenths. */
export const bar = (n, s = 0) => T0 + (n - 1) * BAR + s * SIX;

/** The bass pluck hits (the 0-3-6-9 "triplet" skeleton and its variations). */
export const PLUCKS = M.plucks;
export const KICKS = M.kicks;
export const BELLS = M.bells;
export const SNARES = M.snares;
export const HATS = M.hats;

export const plucksInBar = (n) => PLUCKS.filter((p) => p.bar === n);

/** Linear read of a per-frame envelope at time t. */
export function env(name, t) {
  const a = name === "riser" ? M.riser : M.env[name];
  const f = Math.max(0, t * FPS);
  const i = Math.floor(f);
  if (i >= a.length - 1) return a[a.length - 1];
  const k = f - i;
  return a[i] * (1 - k) + a[i + 1] * k;
}

/**
 * Sum of decaying impulses from the events at or before t: the "hit" shape the
 * picture uses to answer a sound. `attack` softens the leading edge so a hit
 * never appears in a single frame unless asked to (attack 0).
 */
export function impulse(t, times, decay = 0.25, attack = 0, weights) {
  let v = 0;
  for (let i = 0; i < times.length; i++) {
    const te = typeof times[i] === "number" ? times[i] : times[i].t;
    const dt = t - te;
    if (dt < -attack || dt > decay * 8) continue;
    const w = weights ? weights[i] : typeof times[i] === "number" ? 1 : times[i].s ?? 1;
    const a = attack > 0 ? smooth01((dt + attack) / attack) : dt >= 0 ? 1 : 0;
    v += w * a * Math.exp(-Math.max(0, dt) / decay);
  }
  return v;
}

/** Index of the last event at or before t (-1 before the first). */
export function lastIndex(t, times) {
  let k = -1;
  for (let i = 0; i < times.length; i++) {
    const te = typeof times[i] === "number" ? times[i] : times[i].t;
    if (te <= t + 1e-6) k = i;
    else break;
  }
  return k;
}

/* -------------------------------------------------------------------------- */
/* Easing                                                                     */
/* -------------------------------------------------------------------------- */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth01 = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
/** Normalised progress of t through [a, b], clamped. */
export const prog = (t, a, b) => clamp((t - a) / (b - a));

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      const d = dx(u);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    return sy(clamp(u));
  };
}

/** The site's own curve (motion-kit FORGE): a hard arrival that settles long. */
export const FORGE = bezier(0.16, 1, 0.3, 1);
export const OUT = bezier(0.22, 0.61, 0.36, 1);
export const INOUT = bezier(0.4, 0, 0.2, 1);
export const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
export const expoIn = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * (clamp(x) - 1)));
export const expoInOut = (x) => {
  x = clamp(x);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
export const cubicIn = (x) => clamp(x) ** 3;
export const cubicOut = (x) => 1 - (1 - clamp(x)) ** 3;
export const backOut = (x, s = 1.7) => {
  x = clamp(x) - 1;
  return x * x * ((s + 1) * x + s) + 1;
};
export const elasticOut = (x, p = 0.32) => {
  x = clamp(x);
  if (x === 0 || x === 1) return x;
  return Math.pow(2, -10 * x) * Math.sin(((x - p / 4) * (2 * Math.PI)) / p) + 1;
};

/** Animate a value from a to b between times t0 and t1 with an easing. */
export const tween = (t, t0, t1, a, b, ease = FORGE) => lerp(a, b, ease(prog(t, t0, t1)));

/* -------------------------------------------------------------------------- */
/* Deterministic noise                                                        */
/* -------------------------------------------------------------------------- */

/** Integer hash → [0, 1). Same inputs, same output, every render. */
export function hash(...n) {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.floor(v * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

/** Smooth 1D value noise in [-1, 1]. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/** Camera-style shake: layered value noise, amplitude in px. */
export function shake(t, amp, freq = 9, seed = 0) {
  return [
    amp * (noise1(t * freq, seed) * 0.7 + noise1(t * freq * 2.3, seed + 11) * 0.3),
    amp * (noise1(t * freq, seed + 3) * 0.7 + noise1(t * freq * 2.1, seed + 17) * 0.3),
  ];
}
