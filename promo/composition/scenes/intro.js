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
import { F } from "../lib/format.js";
import { bar, BELLS, GAP, env, impulse, prog, clamp, FORGE, expoOut, expoIn, cubicIn, shake, hash, lastIndex } from "../lib/timing.js";
import { S, SECTIONS, dust } from "./common.js";

const T1 = bar(1);
const T2 = bar(2);
const CUT = GAP[0];

/**
 * The site's opening clip, as frames extracted by render.mjs: the desktop cut
 * for 16:9, the phone cut (already portrait) for 9:16.
 */
const CLIP = F.vertical
  ? { frames: 197, dir: "intro-mobile", from: 0.3, to: 3.28 }
  : { frames: 243, dir: "intro", from: 0.8, to: 4.05 };
const CLIP_FRAMES = CLIP.frames;
const clipCache = new Map();

function clipTime(t) {
  // Across bar 2: the sigil completes as the riser peaks.
  return CLIP.from + (CLIP.to - CLIP.from) * prog(t, T2 - 0.15, CUT);
}

/** Layout per format, in design pixels. */
const LAY = F.vertical
  ? { span: 760, spanGrow: 220, rails: [[70, 1], [F.W - 70, -1]], railScale: 1.25, wordSize: 112, eyebrowY: [858, 894], subY: 1030, eyebrowSize: 21 }
  : { span: 1180, spanGrow: 600, rails: [[132, 1], [1788, -1]], railScale: 1.6, wordSize: 168, eyebrowY: [486], subY: 594, eyebrowSize: 21 };

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
    const url = `/promo/.cache/${CLIP.dir}/f${String(i + 1).padStart(3, "0")}.jpg`;
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

  const { cx, cy, W, H } = F;

  /* ---- atmosphere --------------------------------------------------------- */
  inner.push({ tex: S.atmos, x: cx, y: cy, w: W, h: H, opacity: 0.55 + 0.25 * sub });

  // The site's tendrils, barely there, uncovered by the star's light.
  {
    const bd = F.vertical ? S.A.bd_about_m : S.A.bd_about;
    const reveal = expoOut(prog(t, T1, T1 + 2.4));
    const out = prog(t, T2 + 0.2, T2 + 1.2);
    // Landscape plates span the width; the phone plates are scaled to the height.
    const w = F.vertical ? (H * 1.04 * bd.w) / bd.h : W * 1.12;
    inner.push({
      tex: bd, x: cx, y: cy, w, h: (w * bd.h) / bd.w, s: 1.08 - 0.06 * prog(t, T1, T2 + 1.2), blend: "screen",
      opacity: (0.2 + 0.1 * sub + 0.18 * bellHit) * (1 - out), reveal: { type: "radial", p: reveal, soft: 0.7 },
    });
  }

  // The page frame (globals.css .page-frame) drawing itself around the picture.
  {
    const p = FORGE(prog(t, T1 + 0.2, T1 + 2.2));
    const frame = S.E.cached("intro:frame", W, H, p.toFixed(3), (ctx, w, h) => {
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
    inner.push({ tex: frame, x: cx, y: cy, w: W, h: H, opacity: 0.9 });
  }
  inner.push({ tex: dust(t, 0.55 * clamp(t / 1.5)), x: cx, y: cy, w: W, h: H, blend: "add" });

  /* ---- bar 2: the opening clip grows the sigil ---------------------------- */
  if (t > T2 - 0.3) {
    const fi = Math.min(CLIP_FRAMES - 1, Math.round(clipTime(t) * 60));
    const frame = clipCache.get(fi) ?? [...clipCache.values()].pop();
    if (frame) {
      const k = FORGE(build);
      // Desktop: drift toward the sigil on the right. Phone: the cut is already
      // composed for portrait, so it only pushes in.
      const pan = F.vertical ? [0, 0] : [-330 * k, 20 * k];
      inner.push({
        tex: frame, x: cx + pan[0], y: cy + pan[1], w: W * 0.96, h: H * 0.94, s: 1.02 + 0.3 * cubicIn(build),
        uv: [0.02, 0.03, 0.98, 0.97], blend: "screen",
        opacity: clamp(prog(t, T2 - 0.25, T2 + 0.45)) * 0.95, bright: 1 + 0.6 * riser, contrast: 1.08,
      });
    }
  }

  /* ---- glyph rails, accelerating with the riser --------------------------- */
  if (t > T2 - 0.1) {
    const a = clamp(prog(t, T2 - 0.1, T2 + 0.6));
    const off = 30 * (t - T2) + 1400 * Math.pow(build, 3.2);
    const P = 1040 * LAY.railScale;
    for (const [x, dir] of LAY.rails) {
      const y0 = (((dir * off) % P) + P) % P;
      for (let k = -1; k * P + y0 < H; k++) {
        inner.push({ tex: S.rail, x, y: y0 + k * P, ay: 0, w: 64 * LAY.railScale, h: P, opacity: a * 0.55, blur: [0, 60 * Math.pow(build, 3)] });
      }
    }
  }

  /* ---- the hairline and its beads ------------------------------------------ */
  {
    const p = FORGE(prog(t, T1 + 0.05, T1 + 1.9));
    const c = E.canvas("intro:line", W, 120);
    const ctx = c.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, 120);
    const span = LAY.span + LAY.spanGrow * expoOut(build);
    D.hairline(ctx, cx - span / 2, cx + span / 2, 60, p, { alpha: 0.9 + 0.6 * bellHit, width: 1.2 });
    if (p > 0.92) {
      const da = clamp((p - 0.92) / 0.08);
      D.diamond(ctx, cx - (span / 2) * p, 60, 9, da);
      D.diamond(ctx, cx + (span / 2) * p, 60, 9, da);
    }
    // A bead lights on the line at every bell.
    const ib = lastIndex(t, BELLS);
    for (let i = Math.max(0, ib - 4); i <= ib; i++) {
      const age = t - BELLS[i];
      const a = Math.exp(-age / 0.22);
      const side = hash(i, 4) < 0.5 ? -1 : 1;
      const x = cx + side * (60 + hash(i, 7) * (span / 2 - 80) * p);
      D.bloomDot(ctx, x, 60, 26, a * 0.9);
      D.diamond(ctx, x, 60, 5, a);
    }
    E.upload(c);
    inner.push({ tex: c, x: cx, y: cy, w: W, h: 120, opacity: 1 - prog(t, CUT - 0.5, CUT) * 0.3 });
  }

  /* ---- the star ------------------------------------------------------------ */
  {
    const ign = prog(t, T1, T1 + 1.15);
    const size = 92 * FORGE(ign) * (1 + 1.1 * expoIn(build)) * (1 + 0.04 * bellHit);
    const rot = (1 - FORGE(ign)) * -2.4 + Math.pow(build, 2.4) * 5.5;
    const glow = 0.35 + 0.5 * sub + 0.6 * impulse(t, [T1], 0.45) + 0.9 * Math.pow(build, 3);
    inner.push({ tex: S.dot, x: cx, y: cy, w: 520 * (0.6 + glow), h: 520 * (0.6 + glow), opacity: Math.min(1, glow) * 0.8, blend: "add" });
    inner.push({ tex: S.starGlow, x: cx, y: cy, w: size * 1.55, h: size * 1.55, rz: rot, opacity: 0.6, blend: "add" });
    inner.push({ tex: S.star, x: cx, y: cy, w: size, h: size, rz: rot });
    // Lens glint on the first hit, and again as the riser crests.
    const g = impulse(t, [T1], 0.35) + Math.pow(build, 4) * 0.75;
    inner.push({ tex: S.glint, x: cx, y: cy, w: 900 * g, h: 900 * g, rz: 0.12, opacity: Math.min(1, g), blend: "add" });
  }

  /* ---- anamorphic streak ---------------------------------------------------- */
  {
    const a = 0.12 + 0.25 * impulse(t, [T1], 0.5) + 0.9 * Math.pow(riser, 2.2);
    inner.push({ tex: S.streak, x: cx, y: cy, w: W * (0.8 + 0.8 * build), h: 18 + 50 * riser, opacity: Math.min(1, a), blend: "add", tint: [0.86, 0.74, 1], tintAmt: 0.25 });
  }

  /* ---- eyebrow decode (bar 1), dissolving upward in bar 2 ------------------- */
  {
    const dp = prog(t, T1 + 0.45, T1 + 2.15);
    if (dp > 0) {
      // The scramble ticks with the bell line rather than a clock.
      const tick = lastIndex(t, BELLS) / 20;
      const out = prog(t, T2 + 0.05, T2 + 0.75);
      // One line on the desktop; on the phone the hero's own two lines.
      const lines = F.vertical ? ["CYBER TRIBAL · BIOMECHANICAL", "CUSTOM WORK"] : [SECTIONS[0].eyebrow];
      lines.forEach((line, li) => {
        const lp = clamp(dp * (1 + 0.25 * li) - 0.25 * li);
        const shown = D.decode(line, lp, tick, 5 + li);
        const tex = S.E.cached("intro:eyebrow" + li, 1500, 60, shown, (ctx, w, h) => {
          D.font(ctx, { family: D.SANS, size: LAY.eyebrowSize, weight: 500, tracking: 0.46 });
          ctx.fillStyle = "#d9d9de";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(shown, w / 2, h / 2);
        });
        inner.push({ tex, x: cx, y: LAY.eyebrowY[li] - 30 * expoIn(out), w: 1500, h: 60, opacity: 1 - out, blur: [0, 40 * out] });
      });
      const tex2 = S.E.cached("intro:sub", 900, 50, D.decode("TRIGGIANO · BARI", prog(t, T1 + 1.1, T1 + 2.3), tick, 9), (ctx, w, h) => {
        D.font(ctx, { family: D.SANS, size: 15, weight: 400, tracking: 0.6 });
        ctx.fillStyle = "#9a9aa0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(D.decode("TRIGGIANO · BARI", prog(t, T1 + 1.1, T1 + 2.3), tick, 9), w / 2, h / 2);
      });
      inner.push({ tex: tex2, x: cx, y: LAY.subY + 30 * expoIn(out), w: 900, h: 50, opacity: 1 - out, blur: [0, 40 * out] });
    }
  }

  /* ---- section names on the last bells ------------------------------------- */
  {
    const k = lastIndex(t, WORD_BELLS);
    if (k >= 0 && t < CUT) {
      const age = t - WORD_BELLS[k];
      const word = WORDS[k];
      const tex = S.E.cached("intro:word", 1900, 260, word, (ctx, w, h) => {
        D.font(ctx, { family: D.DISPLAY, size: LAY.wordSize, weight: 400, tracking: 0.08 });
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const width = ctx.measureText(word).width;
        ctx.fillStyle = D.chromeGradient(ctx, w / 2 - width / 2, h / 2 - 90, width, 180);
        ctx.fillText(word, w / 2, h / 2 + 10);
      }, true);
      const s = 1.16 - 0.16 * expoOut(age / 0.16) + k * 0.02;
      inner.push({ tex, x: cx, y: cy, w: 1900, h: 260, s, opacity: 0.95 * Math.exp(-age / 0.5), rgb: 10 * Math.exp(-age / 0.06), shine: { pos: -0.5 + age * 4, width: 0.06, angle: 0.4, amt: 1.2 } });
    }
  }

  /* ---- render the intro flat, then place it: camera push, shake, CRT off -- */
  const pc = E.precomp("intro", W, H, inner, { float: true });
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
    tex: pc, x: cx + sx, y: cy + sy, w: W, h: H, sx: zoom * scaleX, sy: zoom * scaleY, screen: true,
    opacity: off * wake, bright,
  });
  if (t >= CUT) {
    // The collapsed line and the dot it leaves.
    const a = prog(t, CUT, CUT + 0.075);
    const b = prog(t, CUT + 0.075, CUT + 0.16);
    const fade = 1 - prog(t, CUT + 0.16, CUT + 0.26);
    L.push({ tex: S.streak, x: cx, y: cy, w: W * (1 - expoIn(b)) + 40, h: 10, opacity: a * fade, blend: "add", screen: true });
    L.push({ tex: S.dot, x: cx, y: cy, w: 160, h: 160, opacity: b * fade, blend: "add", screen: true });
  }

  post.ca = 0.0015 + 0.02 * Math.pow(riser, 2.5);
  post.zoomBlur = 0.12 * Math.pow(build, 4);
  post.bloom = 0.55 + 0.4 * riser;
  post.flash = 0.25 * impulse(t, [T1], 0.12, 0.0);
}
