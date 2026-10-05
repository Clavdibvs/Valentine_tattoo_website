/**
 * Bar 3 (5.54 → 8.29 s): the drop.
 *
 * The wordmark slams in on the first sixteenth after the silence. Every bass
 * pluck (sixteenths 0-3-6-9-15, the line's "triplet" pattern) sends a chrome
 * glint across it; the crash on the second pluck brings the eyebrow in with the
 * site's tracking reveal, the third drops the sigil star, and on the fourth the
 * camera pulls back: the free wordmark becomes the one in the site's hero, and
 * the hero turns out to be a browser window — the tour begins.
 */

import * as D from "../lib/draw2d.js";
import { DROP, plucksInBar, impulse, prog, clamp, lerp, FORGE, expoOut, shake, INOUT } from "../lib/timing.js";
import { S, SECTIONS } from "./common.js";

export const PL3 = plucksInBar(3);
export const PULL0 = PL3[3].t;            // the fourth pluck starts the pull-back
export const PULL1 = PULL0 + 1.0;

/** Where the hero capture's wordmark sits (design px; template-matched on the capture, r = 0.967). */
const HERO_MARK = { x: 554, y: 436, w: 712 };
/** The browser's resting pose on the hero, shared with the tour. */
export const HOME_POSE = { x: 960, y: 566, s: 0.72 };
const WINDOW_BAR = 56;

const FREE = { x: 960, y: 505, w: 1240 };

/** The camera at the first frame of the pull-back: the hero's wordmark fills the frame exactly as the free one did. */
const WX = HOME_POSE.x + (HERO_MARK.x - 960) * HOME_POSE.s;
const WY = HOME_POSE.y + (HERO_MARK.y - 540 + WINDOW_BAR / 2) * HOME_POSE.s;
const Z0 = FREE.w / (HERO_MARK.w * HOME_POSE.s);
const C0 = [WX, WY + (540 - FREE.y) / Z0];

/**
 * From the pull-back on, the free layers live in the world at the spot the
 * camera showed them, so they recede with it while they hand over.
 */
function toWorld(L) {
  return { ...L, screen: false, x: C0[0] + (L.x - 960) / Z0, y: C0[1] + (L.y - 540) / Z0, w: L.w / Z0, h: L.h / Z0 };
}

/** Camera for the pull-back: from "the wordmark fills the frame" to rest. */
export function pullbackCamera(t) {
  const e = FORGE(prog(t, PULL0, PULL1));
  const e2 = INOUT(prog(t, PULL0, PULL1 - 0.1));
  return {
    zoom: Math.exp(lerp(Math.log(Z0), 0, e)),
    x: lerp(C0[0], 960, e2),
    y: lerp(C0[1], 540, e2),
    ry: 0.16 * Math.sin(Math.PI * e2),
    roll: -0.025 * Math.sin(Math.PI * e2),
  };
}

export function drop(t, Lout, cam, post) {
  if (t < DROP - 0.02 || t > PULL1 + 0.2) return;
  const L = [];
  const since = t - DROP;
  const pl = impulse(t, PL3, 0.14);
  const plSoft = impulse(t, PL3, 0.4);
  const [shx, shy] = shake(t, 16 * Math.exp(-since / 0.22) + 5 * pl, 14, 21);
  const fadeOut = 1 - prog(t, PULL0, PULL0 + 0.14);         // free layers hand over to the browser
  const bgOut = 1 - prog(t, PULL0 + 0.05, PULL0 + 0.6);

  /* ---- backdrop: the about-section tendrils, framing the mark -------------- */
  {
    const a = clamp(since / 0.06) * bgOut;
    const s = 1.25 - 0.17 * FORGE(prog(t, DROP, DROP + 1.3)) + 0.04 * since;
    const tex = S.A.bd_about;
    const w = 1920 * 1.08;
    L.push({ tex, x: 960 + shx * 0.5, y: 540 + shy * 0.5, w, h: (w * tex.h) / tex.w, s, screen: true, blend: "screen", opacity: 0.9 * a, bright: 0.9 + 0.9 * pl });
    L.push({ tex: S.dotViolet, x: 960, y: 520, w: 1700, h: 900, screen: true, blend: "add", opacity: (0.22 + 0.35 * plSoft) * a });
  }

  /* ---- shockwaves: the drop, and the crash on the second pluck ------------- */
  for (const [t0, size, k] of [[DROP, 2600, 1], [PL3[1].t, 2000, 0.6]]) {
    const p = prog(t, t0, t0 + 0.75);
    if (p > 0 && p < 1) {
      const s = 120 + size * expoOut(p);
      L.push({ tex: S.ring, x: 960, y: 520, w: s, h: s, screen: true, blend: "add", opacity: k * 0.85 * (1 - p) ** 2 });
    }
  }

  /* ---- the wordmark ---------------------------------------------------------- */
  const slam = lerp(1.6, 1, FORGE(prog(t, DROP, DROP + 0.55)));
  const bump = 1 + 0.022 * pl;
  const W = FREE.w * slam * bump;
  const H = (W * 640) / 1400;
  const mx = FREE.x + shx, my = FREE.y + shy;
  {
    // Echo trail on the slam.
    const e = Math.exp(-since / 0.16);
    for (let i = 1; i <= 3; i++) {
      L.push({ tex: S.A.wordmark, x: mx, y: my, w: W * (1 + 0.09 * i * e), h: H * (1 + 0.09 * i * e), screen: true, blend: "add", opacity: (0.4 / i) * e * fadeOut });
    }
    // Glint: the latest pluck sweeps a band across; directions alternate.
    const last = PL3.filter((p) => p.t <= t + 1e-4).length - 1;
    let shine = null;
    if (last >= 0) {
      const p = PL3[last];
      const age = t - p.t;
      const dir = last % 2 ? -1 : 1;
      shine = { pos: dir * lerp(-0.75, 0.75, expoOut(age / 0.55)), width: 0.07, angle: 0.42, amt: 1.5 * p.s * Math.exp(-age / 0.6) };
    }
    L.push({
      tex: S.A.wordmark, x: mx, y: my, w: W, h: H, screen: true, opacity: fadeOut,
      rgb: 16 * Math.exp(-since / 0.12) + 5 * pl, rgbDir: [1, 0.15], glitch: 0.06 * Math.exp(-since / 0.09), seed: Math.floor(t * 30),
      shine, bright: 1 + 0.25 * pl,
    });
  }

  /* ---- the eyebrow, tracking in on the crash ---------------------------------- */
  {
    const t0 = PL3[1].t;
    const p = prog(t, t0, t0 + 1.25);
    if (p > 0) {
      const track = lerp(1.25, 0.46, FORGE(p));
      const tex = S.E.cached("drop:eyebrow", 1800, 70, track.toFixed(3), (ctx, w, h) => {
        D.font(ctx, { family: D.SANS, size: 24, weight: 500, tracking: track });
        ctx.fillStyle = "#e2e2e6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(SECTIONS[0].eyebrow, w / 2, h / 2);
      });
      L.push({ tex, x: 960 + shx, y: 842 + shy, w: 1800, h: 70, screen: true, opacity: clamp(p * 4) * fadeOut });
      const line = S.E.canvas("drop:line", 1400, 20);
      line.ctx.clearRect(0, 0, 1400, 20);
      D.hairline(line.ctx, 0, 1400, 10, FORGE(prog(t, t0, t0 + 1.0)), { alpha: 1.2, width: 1.2 });
      D.diamond(line.ctx, 700, 10, 9, clamp(p * 3));
      S.E.upload(line);
      L.push({ tex: line, x: 960 + shx, y: 795 + shy, w: 1400, h: 20, screen: true, opacity: fadeOut });
    }
  }

  /* ---- the sigil star, dropping in on the third pluck ------------------------- */
  {
    const t0 = PL3[2].t;
    const p = prog(t, t0, t0 + 0.7);
    if (p > 0) {
      const y = lerp(40, 118, FORGE(p));
      const s = 96 * (1 + 0.15 * impulse(t, [t0], 0.1));
      L.push({ tex: S.starGlow, x: 969 + shx, y: y + shy, w: s * 1.6, h: s * 1.6, screen: true, blend: "add", opacity: 0.7 * fadeOut });
      L.push({ tex: S.star, x: 969 + shx, y: y + shy, w: s, h: s * 1.25, rz: (1 - FORGE(p)) * 2.2, screen: true, opacity: clamp(p * 5) * fadeOut });
      const g = impulse(t, [t0], 0.28);
      L.push({ tex: S.glint, x: 969 + shx, y: y + shy, w: 700 * g, h: 700 * g, screen: true, blend: "add", opacity: Math.min(1, g) * fadeOut });
    }
  }

  /* ---- post ---------------------------------------------------------------- */
  post.flash = 0.95 * Math.exp(-Math.max(0, since) / 0.085) + 0.18 * impulse(t, [PL3[1].t], 0.08);
  post.zoomBlur = 0.24 * Math.exp(-Math.max(0, since) / 0.13) + 0.05 * pl;
  post.ca = 0.0015 + 0.03 * Math.exp(-since / 0.18) + 0.006 * pl;
  post.distort = -0.08 * Math.exp(-since / 0.2);
  post.glitch = 0.6 * Math.exp(-Math.max(0, since) / 0.055) + 0.3 * impulse(t, [PL3[1].t], 0.05);
  post.glitchSeed = Math.floor(t * 30);
  post.bloom = 0.6 + 0.35 * pl;
  post.exposure = 1 + 0.15 * pl;

  /* ---- pull-back camera ------------------------------------------------------- */
  if (t >= PULL0) Object.assign(cam, pullbackCamera(t));
  for (const l of L) Lout.push(t >= PULL0 && l.screen ? toWorld(l) : l);
}
