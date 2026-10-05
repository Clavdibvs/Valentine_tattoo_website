/**
 * 9:16 — bar 3 (5.54 → 8.29 s): the drop, ending inside the phone.
 *
 * Same beats as the 16:9 drop — the slam on the first sixteenth, a glint per
 * pluck, the crash bringing the eyebrow in — but laid out like the site's
 * mobile hero: the eyebrow on two lines above the wordmark, "Resident presso
 * Crossbone Studio" under it. On the fourth pluck the camera pulls back and
 * all of it turns out to be the hero on a phone's screen.
 */

import * as D from "../../lib/draw2d.js";
import { F } from "../../lib/format.js";
import { DROP, plucksInBar, impulse, prog, clamp, lerp, FORGE, expoOut, shake, INOUT } from "../../lib/timing.js";
import { S, PHONE } from "../common.js";

export const PL3 = plucksInBar(3);
export const PULL0 = PL3[3].t;
export const PULL1 = PULL0 + 1.0;

/**
 * The mobile hero capture, in CSS px of its 390×844 viewport: the wordmark is
 * template-matched (r = 0.999), the lines are measured on the capture, and the
 * type is the site's own at that width (globals.css, HeroSection.module.css).
 */
const CSS_W = 390;
const HERO_MARK = { x: 195, y: 358, w: 346 };
const HERO_EYEBROW = { y: [230, 253.3], size: 12.14, tracking: 0.26, star: 9, gap: 0.9 };
const HERO_RESIDENT = { baseline: 473.3, size: 18.34, tracking: 0.02 };

/** The phone's resting pose on the hero, shared with the tour. */
export const HOME_POSE = { x: 540, y: 1010, s: 0.86 };
export const SCREEN = { w: PHONE.w - 2 * PHONE.screenInset, h: PHONE.h - 2 * PHONE.screenInset };
/** Design px per CSS px on the phone's screen (the capture fills its width, top-aligned). */
const K = SCREEN.w / CSS_W;

const FREE = { x: 540, y: 900, w: 960 };
const FK = FREE.w / HERO_MARK.w; // free layout px per CSS px
const freeY = (cssY) => FREE.y + (cssY - HERO_MARK.y) * FK;

const WX = HOME_POSE.x + (HERO_MARK.x - CSS_W / 2) * K * HOME_POSE.s;
const WY = HOME_POSE.y + (HERO_MARK.y * K - SCREEN.h / 2) * HOME_POSE.s;
const Z0 = FREE.w / (HERO_MARK.w * K * HOME_POSE.s);
const C0 = [WX, WY + (F.cy - FREE.y) / Z0];

function toWorld(L) {
  return { ...L, screen: false, x: C0[0] + (L.x - F.cx) / Z0, y: C0[1] + (L.y - F.cy) / Z0, w: L.w / Z0, h: L.h / Z0 };
}

export function pullbackCamera(t) {
  const e = FORGE(prog(t, PULL0, PULL1));
  const e2 = INOUT(prog(t, PULL0, PULL1 - 0.1));
  return {
    zoom: Math.exp(lerp(Math.log(Z0), 0, e)),
    x: lerp(C0[0], F.cx, e2),
    y: lerp(C0[1], F.cy, e2),
    ry: -0.18 * Math.sin(Math.PI * e2),
    roll: 0.02 * Math.sin(Math.PI * e2),
  };
}

/** The hero eyebrow line with the site's sigil star between its two words. */
function eyebrowLine(ctx, w, h, parts, size, track) {
  D.font(ctx, { family: D.SANS, size, weight: 400, tracking: track });
  ctx.fillStyle = "#e2e2e6";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const star = HERO_EYEBROW.star * FK;
  const gap = 2 * HERO_EYEBROW.gap * size + star;
  const widths = parts.map((p) => ctx.measureText(p).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let x = w / 2 - total / 2;
  parts.forEach((p, i) => {
    ctx.fillText(p, x, h / 2);
    x += widths[i];
    if (i < parts.length - 1) {
      D.sigilStar(ctx, x + gap / 2 - (size * track) / 2, h / 2, star);
      x += gap;
    }
  });
}

export function drop(t, Lout, cam, post) {
  if (t < DROP - 0.02 || t > PULL1 + 0.2) return;
  const L = [];
  const since = t - DROP;
  const pl = impulse(t, PL3, 0.14);
  const plSoft = impulse(t, PL3, 0.4);
  const [shx, shy] = shake(t, 16 * Math.exp(-since / 0.22) + 5 * pl, 14, 21);
  const fadeOut = 1 - prog(t, PULL0, PULL0 + 0.14);
  const bgOut = 1 - prog(t, PULL0 + 0.05, PULL0 + 0.6);

  /* ---- backdrop: the site's mobile tendrils, scaled to the frame's height --- */
  {
    const a = clamp(since / 0.06) * bgOut;
    const s = 1.25 - 0.17 * FORGE(prog(t, DROP, DROP + 1.3)) + 0.04 * since;
    const tex = S.A.bd_about_m;
    const h = F.H * 1.02;
    L.push({ tex, x: F.cx + shx * 0.5, y: F.cy + shy * 0.5, w: (h * tex.w) / tex.h, h, s, screen: true, blend: "screen", opacity: 0.9 * a, bright: 0.9 + 0.9 * pl });
    L.push({ tex: S.dotViolet, x: F.cx, y: FREE.y, w: 1300, h: 1300, screen: true, blend: "add", opacity: (0.22 + 0.35 * plSoft) * a });
  }

  /* ---- shockwaves --------------------------------------------------------- */
  for (const [t0, size, k] of [[DROP, 2600, 1], [PL3[1].t, 2000, 0.6]]) {
    const p = prog(t, t0, t0 + 0.75);
    if (p > 0 && p < 1) {
      const s = 120 + size * expoOut(p);
      L.push({ tex: S.ring, x: F.cx, y: FREE.y, w: s, h: s, screen: true, blend: "add", opacity: k * 0.85 * (1 - p) ** 2 });
    }
  }

  /* ---- the wordmark --------------------------------------------------------- */
  const slam = lerp(1.6, 1, FORGE(prog(t, DROP, DROP + 0.55)));
  const bump = 1 + 0.022 * pl;
  const W = FREE.w * slam * bump;
  const H = (W * 640) / 1400;
  const mx = FREE.x + shx, my = FREE.y + shy;
  {
    const e = Math.exp(-since / 0.16);
    for (let i = 1; i <= 3; i++) {
      L.push({ tex: S.A.wordmark, x: mx, y: my, w: W * (1 + 0.09 * i * e), h: H * (1 + 0.09 * i * e), screen: true, blend: "add", opacity: (0.4 / i) * e * fadeOut });
    }
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

  /* ---- the eyebrow, tracking in on the crash, where the hero has it -------- */
  {
    const t0 = PL3[1].t;
    const p = prog(t, t0, t0 + 1.25);
    if (p > 0) {
      // At this size the line nearly spans the frame: a short track-in keeps it inside.
      const track = lerp(0.5, HERO_EYEBROW.tracking, FORGE(p));
      const size = HERO_EYEBROW.size * FK;
      const rows = [["CYBER TRIBAL", "BIOMECHANICAL"], ["CUSTOM WORK"]];
      rows.forEach((parts, i) => {
        const tex = S.E.cached("vdrop:eyebrow" + i, 1500, 80, track.toFixed(3), (ctx, w, h) => eyebrowLine(ctx, w, h, parts, size, track));
        L.push({ tex, x: F.cx + shx, y: freeY(HERO_EYEBROW.y[i]) + shy, w: 1500, h: 80, screen: true, opacity: clamp(p * 4 - i * 0.5) * fadeOut });
      });
    }
  }

  /* ---- "Resident presso Crossbone Studio", word by word on the third pluck -- */
  {
    const t0 = PL3[2].t;
    if (t >= t0) {
      const words = ["Resident", "presso", "Crossbone", "Studio"];
      const c = S.E.canvas("vdrop:resident", 1300, 120);
      const ctx = c.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1300, 120);
      D.drawGlyphs(ctx, words.join(" "), { family: D.DISPLAY, size: HERO_RESIDENT.size * FK, weight: 400, style: "italic", tracking: HERO_RESIDENT.tracking }, 650, 82, {
        fill: "#ececf0",
        each: (i) => {
          // Which word this glyph belongs to: count spaces before it.
          const wi = words.join(" ").slice(0, i).split(" ").length - 1;
          const a = clamp((t - t0 - wi * 0.07) / 0.25);
          return a <= 0 ? null : { alpha: a, dy: 18 * (1 - FORGE(a)) };
        },
      });
      S.E.upload(c);
      // The canvas's baseline (y 82) on the capture's.
      L.push({ tex: c, x: F.cx + shx, y: freeY(HERO_RESIDENT.baseline) - 22 + shy, w: 1300, h: 120, screen: true, opacity: fadeOut });
    }
  }

  post.flash = 0.95 * Math.exp(-Math.max(0, since) / 0.085) + 0.18 * impulse(t, [PL3[1].t], 0.08);
  post.zoomBlur = 0.24 * Math.exp(-Math.max(0, since) / 0.13) + 0.05 * pl;
  post.ca = 0.0015 + 0.03 * Math.exp(-since / 0.18) + 0.006 * pl;
  post.distort = -0.08 * Math.exp(-since / 0.2);
  post.bloom = 0.6 + 0.35 * pl;
  post.exposure = 1 + 0.15 * pl;
  post.glitch = 0.6 * Math.exp(-Math.max(0, since) / 0.055) + 0.3 * impulse(t, [PL3[1].t], 0.05);
  post.glitchSeed = Math.floor(t * 30);

  if (t >= PULL0) Object.assign(cam, pullbackCamera(t));
  for (const l of L) Lout.push(t >= PULL0 && l.screen ? toWorld(l) : l);
}
