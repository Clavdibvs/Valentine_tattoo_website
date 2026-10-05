/**
 * Bars 1–2 (0 → 5.21 s): ignition and build.
 *
 * Bar 1: the first sound lights the site's sigil star; a hairline draws out of
 * it and the hero eyebrow decodes, its scramble ticking on the bell line.
 * Bar 2: the site's own opening clip grows its chrome sigil while the riser
 * climbs; glyph rails accelerate; the section names flash on the last bells.
 * At 5.21 s the track drops out for two sixteenths: the picture collapses like
 * a CRT switching off, and holds black until the drop.
 */

import * as D from "../lib/draw2d.js";
import { bar, BELLS, GAP, env, impulse, prog, clamp, FORGE, expoOut, expoIn, cubicIn, shake, hash, lastIndex } from "../lib/timing.js";
import { S, SECTIONS, dust } from "./common.js";

const T1 = bar(1);
const T2 = bar(2);
const CUT = GAP[0];

/** Opening-clip frames (public/intro/intro-desktop.mp4), extracted by render.mjs. */
const CLIP_FRAMES = 243;
const clipCache = new Map();

function clipTime(t) {
  // 0.8 s → end of the clip across bar 2: the sigil completes as the riser peaks.
  return 0.8 + (4.05 - 0.8) * prog(t, T2 - 0.15, CUT);
}

export async function prepareIntro(t, spread) {
  if (t < T2 - 0.3 || t > CUT + 0.05) {
    for (const [, v] of clipCache) S.E.gl.deleteTexture(v.tex);
    clipCache.clear();
    return;
  }
  const want = new Set();
  for (const dt of [-spread, 0, spread]) want.add(Math.min(CLIP_FRAMES - 1, Math.round(clipTime(t + dt) * 60)));
  for (const i of want) {
    if (clipCache.has(i)) continue;
    const url = `/promo/.cache/intro/f${String(i + 1).padStart(3, "0")}.jpg`;
    const res = await fetch(url);
    const bmp = await createImageBitmap(await res.blob());
    const gl = S.E.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    S.E.setFilter(tex, true);
    clipCache.set(i, { tex, w: bmp.width, h: bmp.height, flipY: false });
  }
  for (const [k, v] of clipCache) {
    if (!want.has(k) && clipCache.size > 6) {
      S.E.gl.deleteTexture(v.tex);
      clipCache.delete(k);
    }
  }
}

/** The last bells of bar 2 carry the section names, one per note. */
const WORD_BELLS = BELLS.filter((b) => b >= 4.0 && b < CUT - 0.05).slice(-6);
const WORDS = SECTIONS.slice(1).map((s) => s.word);

export function intro(t, L, cam, post) {
  if (t > CUT + 0.3) return;
  const E = S.E;
  const inner = [];
  const sub = env("sub", t);
  const riser = t > T2 ? clamp(env("riser", t)) : 0;
  const build = prog(t, T2, CUT);
  const bellHit = impulse(t, BELLS, 0.18);

  /* ---- atmosphere --------------------------------------------------------- */
  inner.push({ tex: S.atmos, x: 960, y: 540, w: 1920, h: 1080, opacity: 0.55 + 0.25 * sub });

  // The site's tendrils, barely there, uncovered by the star's light.
  {
    const bd = S.A.bd_about;
    const reveal = expoOut(prog(t, T1, T1 + 2.4));
    const out = prog(t, T2 + 0.2, T2 + 1.2);
    const w = 1920 * 1.12;
    inner.push({
      tex: bd, x: 960, y: 540, w, h: (w * bd.h) / bd.w, s: 1.08 - 0.06 * prog(t, T1, T2 + 1.2), blend: "screen",
      opacity: (0.2 + 0.1 * sub + 0.18 * bellHit) * (1 - out), reveal: { type: "radial", p: reveal, soft: 0.7 },
    });
  }

  // The page frame (globals.css .page-frame) drawing itself around the picture.
  {
    const p = FORGE(prog(t, T1 + 0.2, T1 + 2.2));
    const frame = S.E.cached("intro:frame", 1920, 1080, p.toFixed(3), (ctx, w, h) => {
      const m = 26, n = 14;
      ctx.strokeStyle = "rgba(235,235,240,0.32)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // From the middle of the top and bottom edges outward, round the notched corners.
      const half = (w - 2 * m) / 2;
      const len = half * p;
      ctx.moveTo(w / 2 - len, m);
      ctx.lineTo(w / 2 + len, m);
      ctx.moveTo(w / 2 - len, h - m);
      ctx.lineTo(w / 2 + len, h - m);
      if (p > 0.82) {
        const k = (p - 0.82) / 0.18;
        const v = (h / 2 - m - n) * k;
        for (const x of [m, w - m]) {
          ctx.moveTo(x, m + n);
          ctx.lineTo(x, m + n + v);
          ctx.moveTo(x, h - m - n);
          ctx.lineTo(x, h - m - n - v);
        }
        ctx.moveTo(m + n, m); ctx.lineTo(m, m + n);
        ctx.moveTo(w - m - n, m); ctx.lineTo(w - m, m + n);
        ctx.moveTo(m + n, h - m); ctx.lineTo(m, h - m - n);
        ctx.moveTo(w - m - n, h - m); ctx.lineTo(w - m, h - m - n);
      }
      ctx.stroke();
      if (p > 0.95) {
        const a = (p - 0.95) / 0.05;
        D.brackets(ctx, m + 10, m + 10, w - 2 * m - 20, h - 2 * m - 20, { size: 22, alpha: 0.7 * a, width: 1.4 });
        D.sigilStar(ctx, w / 2, m, 16, { alpha: a });
        D.sigilStar(ctx, w / 2, h - m, 16, { alpha: a });
      }
    });
    inner.push({ tex: frame, x: 960, y: 540, w: 1920, h: 1080, opacity: 0.9 });
  }
  inner.push({ tex: dust(t, 0.55 * clamp(t / 1.5)), x: 960, y: 540, w: 1920, h: 1080, blend: "add" });

  /* ---- bar 2: the opening clip grows the sigil ---------------------------- */
  if (t > T2 - 0.3) {
    const fi = Math.min(CLIP_FRAMES - 1, Math.round(clipTime(t) * 60));
    const frame = clipCache.get(fi) ?? [...clipCache.values()].pop();
    if (frame) {
      const k = FORGE(build);
      inner.push({
        tex: frame, x: 960 - 330 * k, y: 540 + 20 * k, w: 1920 * 0.96, h: 1080 * 0.94, s: 1.02 + 0.3 * cubicIn(build),
        uv: [0.02, 0.03, 0.98, 0.97], blend: "screen",
        opacity: clamp(prog(t, T2 - 0.25, T2 + 0.45)) * 0.95, bright: 1 + 0.6 * riser, contrast: 1.08,
      });
    }
  }

  /* ---- glyph rails, accelerating with the riser --------------------------- */
  if (t > T2 - 0.1) {
    const a = clamp(prog(t, T2 - 0.1, T2 + 0.6));
    const off = 30 * (t - T2) + 1400 * Math.pow(build, 3.2);
    const P = 1040 * 1.6;
    for (const [x, dir] of [[132, 1], [1788, -1]]) {
      const y0 = (((dir * off) % P) + P) % P;
      for (let k = -1; k < 1; k++) {
        inner.push({ tex: S.rail, x, y: y0 + k * P, ay: 0, w: 64 * 1.6, h: P, opacity: a * 0.55, blur: [0, 60 * Math.pow(build, 3)] });
      }
    }
  }

  /* ---- the hairline and its beads ------------------------------------------ */
  {
    const p = FORGE(prog(t, T1 + 0.05, T1 + 1.9));
    const c = E.canvas("intro:line", 1920, 120);
    const ctx = c.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1920, 120);
    const span = 1180 + 600 * expoOut(build);
    D.hairline(ctx, 960 - span / 2, 960 + span / 2, 60, p, { alpha: 0.9 + 0.6 * bellHit, width: 1.2 });
    if (p > 0.92) {
      const da = clamp((p - 0.92) / 0.08);
      D.diamond(ctx, 960 - (span / 2) * p, 60, 9, da);
      D.diamond(ctx, 960 + (span / 2) * p, 60, 9, da);
    }
    // A bead lights on the line at every bell.
    const ib = lastIndex(t, BELLS);
    for (let i = Math.max(0, ib - 4); i <= ib; i++) {
      const age = t - BELLS[i];
      const a = Math.exp(-age / 0.22);
      const side = hash(i, 4) < 0.5 ? -1 : 1;
      const x = 960 + side * (60 + hash(i, 7) * (span / 2 - 80) * p);
      D.bloomDot(ctx, x, 60, 26, a * 0.9);
      D.diamond(ctx, x, 60, 5, a);
    }
    E.upload(c);
    inner.push({ tex: c, x: 960, y: 540, w: 1920, h: 120, opacity: 1 - prog(t, CUT - 0.5, CUT) * 0.3 });
  }

  /* ---- the star ------------------------------------------------------------ */
  {
    const ign = prog(t, T1, T1 + 1.15);
    const size = 92 * FORGE(ign) * (1 + 1.1 * expoIn(build)) * (1 + 0.04 * bellHit);
    const rot = (1 - FORGE(ign)) * -2.4 + Math.pow(build, 2.4) * 5.5;
    const glow = 0.35 + 0.5 * sub + 0.6 * impulse(t, [T1], 0.45) + 0.9 * Math.pow(build, 3);
    inner.push({ tex: S.dot, x: 960, y: 540, w: 520 * (0.6 + glow), h: 520 * (0.6 + glow), opacity: Math.min(1, glow) * 0.8, blend: "add" });
    inner.push({ tex: S.starGlow, x: 960, y: 540, w: size * 1.55, h: size * 1.55, rz: rot, opacity: 0.6, blend: "add" });
    inner.push({ tex: S.star, x: 960, y: 540, w: size, h: size, rz: rot });
    // Lens glint on the first hit, and again as the riser crests.
    const g = impulse(t, [T1], 0.35) + Math.pow(build, 4) * 0.75;
    inner.push({ tex: S.glint, x: 960, y: 540, w: 900 * g, h: 900 * g, rz: 0.12, opacity: Math.min(1, g), blend: "add" });
  }

  /* ---- anamorphic streak ---------------------------------------------------- */
  {
    const a = 0.12 + 0.25 * impulse(t, [T1], 0.5) + 0.9 * Math.pow(riser, 2.2);
    inner.push({ tex: S.streak, x: 960, y: 540, w: 1920 * (0.8 + 0.8 * build), h: 18 + 50 * riser, opacity: Math.min(1, a), blend: "add", tint: [0.86, 0.74, 1], tintAmt: 0.25 });
  }

  /* ---- eyebrow decode (bar 1), dissolving upward in bar 2 ------------------- */
  {
    const dp = prog(t, T1 + 0.45, T1 + 2.15);
    if (dp > 0) {
      // The scramble ticks with the bell line rather than a clock.
      const tick = lastIndex(t, BELLS) / 20;
      const tex = S.E.cached("intro:eyebrow", 1500, 60, D.decode(SECTIONS[0].eyebrow, dp, tick, 5), (ctx, w, h) => {
        D.font(ctx, { family: D.SANS, size: 21, weight: 500, tracking: 0.46 });
        ctx.fillStyle = "#d9d9de";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(D.decode(SECTIONS[0].eyebrow, dp, tick, 5), w / 2, h / 2);
      });
      const out = prog(t, T2 + 0.05, T2 + 0.75);
      inner.push({ tex, x: 960, y: 486 - 30 * expoIn(out), w: 1500, h: 60, opacity: 1 - out, blur: [0, 40 * out] });
      const tex2 = S.E.cached("intro:sub", 900, 50, D.decode("TRIGGIANO · BARI", prog(t, T1 + 1.1, T1 + 2.3), tick, 9), (ctx, w, h) => {
        D.font(ctx, { family: D.SANS, size: 15, weight: 400, tracking: 0.6 });
        ctx.fillStyle = "#9a9aa0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(D.decode("TRIGGIANO · BARI", prog(t, T1 + 1.1, T1 + 2.3), tick, 9), w / 2, h / 2);
      });
      inner.push({ tex: tex2, x: 960, y: 594 + 30 * expoIn(out), w: 900, h: 50, opacity: 1 - out, blur: [0, 40 * out] });
    }
  }

  /* ---- section names on the last bells ------------------------------------- */
  {
    const k = lastIndex(t, WORD_BELLS);
    if (k >= 0 && t < CUT) {
      const age = t - WORD_BELLS[k];
      const word = WORDS[k];
      const tex = S.E.cached("intro:word", 1900, 260, word, (ctx, w, h) => {
        D.font(ctx, { family: D.DISPLAY, size: 168, weight: 400, tracking: 0.08 });
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const width = ctx.measureText(word).width;
        ctx.fillStyle = D.chromeGradient(ctx, w / 2 - width / 2, h / 2 - 90, width, 180);
        ctx.fillText(word, w / 2, h / 2 + 10);
      }, true);
      const s = 1.16 - 0.16 * expoOut(age / 0.16) + k * 0.02;
      inner.push({ tex, x: 960, y: 540, w: 1900, h: 260, s, opacity: 0.95 * Math.exp(-age / 0.5), rgb: 10 * Math.exp(-age / 0.06), shine: { pos: -0.5 + age * 4, width: 0.06, angle: 0.4, amt: 1.2 } });
    }
  }

  /* ---- render the intro flat, then place it: camera push, shake, CRT off -- */
  const pc = E.precomp("intro", 1920, 1080, inner, { float: true });
  const zoom = 1 + 0.03 * prog(t, T1, T2) + 0.22 * cubicIn(build);
  const [sx, sy] = shake(t, 1.5 * sub + 9 * Math.pow(riser, 3), 11, 7);
  let scaleY = 1, scaleX = 1, bright = 1;
  if (t >= CUT) {
    const a = prog(t, CUT, CUT + 0.075);
    const b = prog(t, CUT + 0.075, CUT + 0.16);
    scaleY = Math.max(0.0035, 1 - expoIn(a) * 0.999);
    scaleX = 1 - expoIn(b) * 0.999;
    bright = 1 + 5 * a;
  }
  const off = t >= CUT ? 1 - prog(t, CUT + 0.13, CUT + 0.24) : 1;
  // Nothing before the first sound: the picture wakes with it.
  const wake = clamp((t - T1 + 0.008) / 0.03);
  L.push({
    tex: pc, x: 960 + sx, y: 540 + sy, w: 1920, h: 1080, sx: zoom * scaleX, sy: zoom * scaleY, screen: true,
    opacity: off * wake, bright,
  });
  if (t >= CUT) {
    // The collapsed line and the dot it leaves.
    const a = prog(t, CUT, CUT + 0.075);
    const b = prog(t, CUT + 0.075, CUT + 0.16);
    const fade = 1 - prog(t, CUT + 0.16, CUT + 0.26);
    L.push({ tex: S.streak, x: 960, y: 540, w: 1920 * (1 - expoIn(b)) + 40, h: 10, opacity: a * fade, blend: "add", screen: true });
    L.push({ tex: S.dot, x: 960, y: 540, w: 160, h: 160, opacity: b * fade, blend: "add", screen: true });
  }

  post.ca = 0.0015 + 0.02 * Math.pow(riser, 2.5);
  post.zoomBlur = 0.12 * Math.pow(build, 4);
  post.bloom = 0.55 + 0.4 * riser;
  post.flash = 0.25 * impulse(t, [T1], 0.12, 0.0);
}
