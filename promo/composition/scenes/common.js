/**
 * Shared pieces: sprites drawn once, the browser window and phone that carry
 * the site captures, the section data, and small layer helpers.
 */

import * as D from "../lib/draw2d.js";
import { F } from "../lib/format.js";
import { clamp, hash, FORGE, prog, lastIndex } from "../lib/timing.js";
import { PICKS } from "../assets.js";

export const S = { E: null, A: null };

/** The site's sections in page order, with the copy each one carries. */
export const SECTIONS = [
  { id: "home", index: "01", eyebrow: "CYBER TRIBAL · BIOMECHANICAL · CUSTOM WORK", title: "VALENTINE TATTOO", word: "HOME", nav: "HOME" },
  { id: "instagram", index: "02", eyebrow: "CONNECT WITH THE TRIBE", title: "INSTAGRAM FEED", word: "INSTAGRAM", nav: "INSTAGRAM" },
  { id: "creazioni", index: "03", eyebrow: "SELECTED WORK", title: "CREAZIONI", word: "CREAZIONI", nav: "CREAZIONI" },
  { id: "flash", index: "04", eyebrow: "READY TO INK", title: "FLASH", word: "FLASH", nav: "FLASH" },
  { id: "merch", index: "05", eyebrow: "WEAR THE MARK", title: "MERCH", word: "MERCH", nav: "MERCH" },
  { id: "booking", index: "06", eyebrow: "BOOKING / CONSULENZA", title: "LA TUA IDEA, LA MIA VISIONE.", word: "BOOKING", nav: "BOOKING" },
  { id: "about", index: "07", eyebrow: "ABOUT", title: "THE ART BEHIND VALENTINE TATTOO", word: "ABOUT", nav: "ABOUT" },
];

export const WINDOW = { w: 1920, h: 1080, bar: 56, radius: 18 };
export const PHONE = { w: 640, h: 1310, screenInset: 22, radius: 98, screenRadius: 78 };

export function initCommon(E, A) {
  S.E = E;
  S.A = A;

  S.star = E.cached("sprite:star", 512, 512, 1, (ctx) => D.sigilStar(ctx, 256, 256, 500), true);
  S.starGlow = E.cached("sprite:starglow", 512, 512, 1, (ctx) => D.sigilStar(ctx, 256, 256, 330, { glow: 70 }), true);
  S.glint = E.cached("sprite:glint", 512, 512, 1, (ctx) => D.glint(ctx, 256, 256, 250, 1), true);
  S.dot = E.cached("sprite:dot", 256, 256, 1, (ctx) => D.bloomDot(ctx, 128, 128, 128, 1.6), true);
  S.dotViolet = E.cached("sprite:dotv", 256, 256, 1, (ctx) => D.bloomDot(ctx, 128, 128, 128, 1.4, "196,146,255"), true);
  S.ring = E.cached("sprite:ring", 1024, 1024, 1, (ctx) => {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(512, 512, 500 - i * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${[0.9, 0.5, 0.25, 0.12, 0.06, 0.03][i]})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  }, true);
  S.streak = E.cached("sprite:streak", 1024, 64, 1, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "rgba(220,200,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(220,200,255,0)");
    const v = ctx.createLinearGradient(0, 0, 0, 64);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(0.5, "rgba(0,0,0,1)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 64);
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1024, 64);
  }, true);
  S.shadow = E.cached("sprite:shadow", 512, 320, 1, (ctx) => {
    ctx.shadowColor = "rgba(0,0,0,1)";
    ctx.shadowBlur = 60;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(90, 90, 332, 140);
  }, true);
  S.atmos = E.cached("sprite:atmos", F.W / 2, F.H / 2, 1, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.463, 0, w / 2, h * 0.463, Math.max(w, h) * 0.646);
    g.addColorStop(0, "rgba(28,26,32,1)");
    g.addColorStop(0.5, "rgba(12,12,14,1)");
    g.addColorStop(1, "rgba(5,5,5,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, true);
  S.rail = E.cached("sprite:rail", 64, 1040, 1, (ctx) => {
    for (let k = 0; k < 4; k++) D.glyphRail(ctx, 32, k * 260, 1, { alpha: 0.9 });
  }, true);

  S.browser = E.cached("dev:browser", WINDOW.w, WINDOW.h + WINDOW.bar, 1, drawBrowserFrame, true);
  S.phone = E.cached("dev:phone", PHONE.w, PHONE.h, 1, drawPhoneFrame, true);
  S.cardFrame = E.cached("dev:cardframe", 540, 960, 1, (ctx) => {
    D.notchedRect(ctx, 3, 3, 534, 954, 26);
    ctx.strokeStyle = "rgba(235,235,235,0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    D.brackets(ctx, 16, 16, 508, 928, { size: 34, width: 2.4, alpha: 0.9 });
  }, true);
}

function drawBrowserFrame(ctx, w, h) {
  const r = WINDOW.radius, bar = WINDOW.bar;
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, h - 2, r);
  ctx.fillStyle = "#08080a";
  ctx.fill();
  // Title bar.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, bar, [r, r, 0, 0]);
  const g = ctx.createLinearGradient(0, 0, 0, bar);
  g.addColorStop(0, "#17171a");
  g.addColorStop(1, "#0d0d0f");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(1, bar, w - 2, 1);
  // Window controls, deliberately quiet.
  for (const [i, c] of [[0, "#3b3b40"], [1, "#333338"], [2, "#2c2c31"]].entries()) {
    ctx.beginPath();
    ctx.arc(34 + i * 26, bar / 2 + 1, 7, 0, Math.PI * 2);
    ctx.fillStyle = c[1];
    ctx.fill();
  }
  // Address field.
  const pw = 560, ph = 34, px = w / 2 - pw / 2, py = bar / 2 - ph / 2 + 1;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 17);
  ctx.fillStyle = "#121215";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
  // Lock.
  ctx.strokeStyle = "rgba(220,220,225,0.75)";
  ctx.lineWidth = 1.6;
  const lx = w / 2 - 104, ly = bar / 2 + 1;
  ctx.strokeRect(lx - 6, ly - 2, 12, 9);
  ctx.beginPath();
  ctx.arc(lx, ly - 2, 4, Math.PI, 0);
  ctx.stroke();
  D.font(ctx, { family: D.SANS, size: 19, weight: 400, tracking: 0.02 });
  ctx.fillStyle = "#d2d2d6";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("valentinetattoo.it", w / 2 - 88, bar / 2 + 2);
  // Hairline border with a brighter top edge, like light catching metal.
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, h - 2, r);
  const b = ctx.createLinearGradient(0, 0, 0, h);
  b.addColorStop(0, "rgba(255,255,255,0.32)");
  b.addColorStop(0.1, "rgba(255,255,255,0.12)");
  b.addColorStop(1, "rgba(255,255,255,0.08)");
  ctx.strokeStyle = b;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPhoneFrame(ctx, w, h) {
  const { radius, screenInset, screenRadius } = PHONE;
  // Body with a chrome rim.
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, radius);
  const rim = ctx.createLinearGradient(0, 0, w, h);
  rim.addColorStop(0, "#9aa0a8");
  rim.addColorStop(0.18, "#2a2d31");
  rim.addColorStop(0.42, "#e6e9ec");
  rim.addColorStop(0.6, "#3a3e43");
  rim.addColorStop(0.82, "#c9ced3");
  rim.addColorStop(1, "#24272b");
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, radius - 6);
  ctx.fillStyle = "#050506";
  ctx.fill();
  // Screen hole.
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.roundRect(screenInset, screenInset, w - screenInset * 2, h - screenInset * 2, screenRadius);
  ctx.fill();
  ctx.restore();
  // Island.
  ctx.beginPath();
  ctx.roundRect(w / 2 - 64, screenInset + 22, 128, 36, 18);
  ctx.fillStyle = "#000";
  ctx.fill();
  // Side keys.
  ctx.fillStyle = "#8d939a";
  ctx.fillRect(0, 300, 4, 90);
  ctx.fillRect(0, 410, 4, 90);
  ctx.fillRect(w - 4, 360, 4, 140);
}

/* -------------------------------------------------------------------------- */
/* Devices as layer groups                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The browser window at a node. `content` is a texture of the 1920×1080 page
 * viewport. Returns the layers back to front.
 */
export function browserLayers(matrix, content, { opacity = 1, glow = 0, shine = null, contentOpts = {} } = {}) {
  const out = [];
  const H = WINDOW.h + WINDOW.bar;
  out.push({ tex: S.shadow, matrix: shift(matrix, 0, 40), w: WINDOW.w * 1.22, h: H * 1.55, opacity: 0.85 * opacity });
  if (glow > 0) out.push({ tex: S.dotViolet, matrix, w: WINDOW.w * 1.5, h: H * 1.3, opacity: glow * opacity, blend: "add" });
  out.push({ tex: S.browser, matrix, w: WINDOW.w, h: H, opacity });
  out.push({
    tex: content, matrix: shift(matrix, 0, WINDOW.bar / 2), w: WINDOW.w, h: WINDOW.h, opacity,
    radius: WINDOW.radius, ...contentOpts,
  });
  if (shine && shine.amt > 0.01) out.push({ tex: S.browser, matrix, w: WINDOW.w, h: H, opacity: opacity * 0.9, blend: "add", bright: 0, shine });
  return out;
}

/** The phone at a node, showing `content` (a mobile capture or precomp). */
export function phoneLayers(matrix, content, { opacity = 1, uv, contentOpts = {}, shadow = true } = {}) {
  const out = [];
  const sw = PHONE.w - PHONE.screenInset * 2, sh = PHONE.h - PHONE.screenInset * 2;
  if (shadow) out.push({ tex: S.shadow, matrix, w: PHONE.w * 2.1, h: PHONE.h * 1.5, opacity: 0.9 * opacity });
  out.push({ tex: content, matrix, w: sw, h: sh, opacity, radius: PHONE.screenRadius, uv: uv ?? coverUV(content, sw, sh), ...contentOpts });
  out.push({ tex: S.phone, matrix, w: PHONE.w, h: PHONE.h, opacity });
  return out;
}

/** UV rect that makes a texture cover a w×h box (centre crop). */
export function coverUV(tex, w, h, align = 0.5) {
  const ta = tex.w / tex.h, ba = w / h;
  if (ta > ba) {
    const k = ba / ta;
    return [(1 - k) * align, 0, (1 - k) * align + k, 1];
  }
  const k = ta / ba;
  return [0, (1 - k) * align, 1, (1 - k) * align + k];
}

/** Top-aligned cover crop (for tall captures whose top is what matters). */
export const coverTop = (tex, w, h) => coverUV(tex, w, h, 0);

export function shift(matrix, x, y, z = 0) {
  const m = matrix.slice();
  m[12] += m[0] * x + m[4] * y + m[8] * z;
  m[13] += m[1] * x + m[5] * y + m[9] * z;
  m[14] += m[2] * x + m[6] * y + m[10] * z;
  return m;
}

/**
 * The "Creazioni" highlight as an Instagram story: the work on screen cuts to
 * the next on each pluck in `P`, under the story's own progress segments,
 * avatar and name. Returns the 540×960 precomp and the age of the last cut.
 */
export function storyFrame(t, P, endT) {
  const k = Math.max(0, lastIndex(t, P));
  const imgIdx = PICKS.creazioni[Math.min(k, PICKS.creazioni.length - 1)];
  const age = t - P[k].t;
  const tex = S.A.creazioni[imgIdx];
  const SW = 540, SH = 960;
  const layers = [];
  const zoom = 1.14 - 0.14 * FORGE(clamp(age / 0.5)) + 0.02 * (age);
  layers.push({ tex, x: SW / 2, y: SH / 2, w: SW * zoom, h: SH * zoom, uv: coverUV(tex, SW, SH), rgb: 12 * Math.exp(-age / 0.07), glitch: 0.04 * Math.exp(-age / 0.05), seed: k * 7 });
  // Story chrome: progress segments, avatar, name.
  const ui = S.E.canvas("story:ui", SW, SH);
  const ctx = ui.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, SW, SH);
  const g = ctx.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 180);
  const n = P.length, gap = 6, segW = (SW - 28 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const a = P[i].t, b = i + 1 < n ? P[i + 1].t : endT;
    const f = clamp((t - a) / (b - a));
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.roundRect(14 + i * (segW + gap), 16, segW, 4, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.roundRect(14 + i * (segW + gap), 16, segW * f, 4, 2);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(40, 56, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0b0c";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  D.font(ctx, { family: D.SANS, size: 17, weight: 500, tracking: 0.02 });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("valentine.ttt", 72, 50);
  D.font(ctx, { family: D.SANS, size: 13, weight: 400, tracking: 0.28 });
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("CREAZIONI", 72, 70);
  S.E.upload(ui);
  layers.push({ tex: ui, x: SW / 2, y: SH / 2, w: SW, h: SH });
  layers.push({ tex: S.A.logo, x: 40, y: 56, w: 22, h: 31.5 });
  layers.push({ color: [1, 1, 1, 1], x: SW / 2, y: SH / 2, w: SW, h: SH, opacity: 0.55 * Math.exp(-age / 0.06) * (k > 0 ? 1 : 0), blend: "add" });
  const pc = S.E.precomp("story", SW, SH, layers, { clear: [0, 0, 0, 1] });
  return { pc, age, SW, SH };
}

/* -------------------------------------------------------------------------- */
/* Background                                                                 */
/* -------------------------------------------------------------------------- */

/** A huge outline word that drifts behind everything (one per section). */
export function bigWord(word) {
  return S.E.cached("bigword:" + word, 3400, 560, word, (ctx, w, h) => {
    D.font(ctx, { family: D.DISPLAY, size: 430, weight: 400, tracking: 0.06 });
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "rgba(235,238,242,0.55)";
    ctx.strokeText(word, w / 2, h / 2 + 20);
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillText(word, w / 2, h / 2 + 20);
  });
}

/** Drifting dust: a few hundred specks in depth, drawn into one canvas. */
export function dust(t, amount = 1, cam = { x: F.cx, y: F.cy }) {
  // Half-resolution canvas; the wrap spans a margin past each edge.
  const cw = F.W / 2, ch = F.H / 2, sx = cw + 140, sy = ch + 100;
  // Its own scatter per format, checked so that no speck parks beside a
  // punctuation mark of a headline (the 16:9 one is the original).
  const seed = F.vertical ? 40 : 0;
  const c = S.E.canvas("dust", cw, ch);
  const ctx = c.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  if (amount > 0) {
    for (let i = 0; i < 170; i++) {
      const z = hash(i, 3 + seed);
      const sp = 6 + z * 26;
      const x = ((hash(i, 1 + seed) * sx + t * sp * (hash(i, 9 + seed) - 0.3) - (cam.x - F.cx) * z * 0.25) % sx + sx) % sx - 70;
      const y = ((hash(i, 2 + seed) * sy - t * sp * 0.6 - (cam.y - F.cy) * z * 0.25) % sy + sy) % sy - 50;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash(i, 5 + seed) * 3) + i);
      const a = amount * (0.12 + 0.5 * z) * tw;
      const r = 0.5 + z * 1.6;
      ctx.fillStyle = `rgba(235,230,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  S.E.upload(c);
  return c;
}

/* -------------------------------------------------------------------------- */
/* Text helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A label that decodes like the site's [data-decode]. The canvas is redrawn
 * only when the visible string changes (20 Hz at most).
 */
export function decodeLabel(name, text, p, t, { size = 20, weight = 500, tracking = 0.42, color = "#d7d7db", w = 1400, h = 64, family = D.SANS, align = "center", seed = 1 } = {}) {
  const shown = D.decode(text, p, t, seed);
  return S.E.cached("decode:" + name, w, h, shown + "|" + size + color, (ctx) => {
    D.font(ctx, { family, size, weight, tracking });
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = align;
    const x = align === "center" ? w / 2 : align === "left" ? 4 : w - 4;
    ctx.fillText(shown, x, h / 2);
  });
}

/** Static text in a canvas sized to it; the key is the text and style. */
export function textTex(name, text, { size = 64, weight = 400, tracking = 0, family = D.DISPLAY, style = "normal", chrome = false, color = "#e8e8e8", w = 1800, h, align = "center", glow = 0 } = {}) {
  h = h ?? Math.ceil(size * 1.5);
  const key = [text, size, weight, tracking, family, style, chrome, color, glow].join("|");
  return S.E.cached("text:" + name, w, h, key, (ctx) => {
    D.font(ctx, { family, size, weight, tracking, style });
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = align;
    const x = align === "center" ? w / 2 : align === "left" ? 8 : w - 8;
    const y = h / 2 + size * 0.34;
    if (glow) {
      ctx.shadowColor = "rgba(255,255,255,0.55)";
      ctx.shadowBlur = glow;
    }
    if (chrome) {
      const width = ctx.measureText(text).width;
      const left = align === "center" ? x - width / 2 : align === "left" ? x : x - width;
      ctx.fillStyle = D.chromeGradient(ctx, left, y - size * 0.8, width, size);
    } else ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }, true);
}

/** Smooth on/off envelope for an element alive between a and b. */
export function life(t, a, b, fadeIn = 0.15, fadeOut = 0.15) {
  return clamp(Math.min(prog(t, a, a + fadeIn), 1 - prog(t, b - fadeOut, b)));
}

export { FORGE };
