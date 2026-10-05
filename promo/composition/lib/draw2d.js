/**
 * Canvas2D drawing in the site's own vocabulary: chrome-filled Bodoni, tracked
 * Jost labels, the decode scramble, the sigil star, hairlines, brackets.
 * Ornament paths are copied verbatim from src/components/ornaments.
 */

import { hash, clamp, FORGE, expoOut } from "./timing.js";

export const DISPLAY = '"Bodoni Moda VT", "Bodoni Moda", Didot, serif';
export const SANS = '"Jost VT", Jost, "Helvetica Neue", Arial, sans-serif';

/** The site's --chrome-gradient stops (globals.css), 177°. */
const CHROME_STOPS = [
  [0, "#8e949b"], [0.11, "#ffffff"], [0.21, "#dde2e7"], [0.34, "#7e858d"], [0.45, "#5f656d"],
  [0.55, "#f6f8fa"], [0.65, "#c6ccd2"], [0.77, "#878e96"], [0.89, "#f8fafc"], [1, "#9ba2a9"],
];

/** Chrome fill spanning a box, at the site's 177° angle. */
export function chromeGradient(ctx, x, y, w, h, stops = CHROME_STOPS) {
  const a = (177 * Math.PI) / 180;
  const cx = x + w / 2, cy = y + h / 2;
  const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
  const dx = (Math.sin(a) * len) / 2, dy = (-Math.cos(a) * len) / 2;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function font(ctx, { family = DISPLAY, size = 48, weight = 400, style = "normal", tracking = 0 }) {
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${tracking * size}px`;
}

/**
 * Lays a string out letter by letter so each glyph can be animated alone.
 * Returns the glyphs with their x offsets from the left edge and the width.
 */
export function layout(ctx, text, spec) {
  font(ctx, spec);
  const tracking = (spec.tracking ?? 0) * (spec.size ?? 48);
  ctx.letterSpacing = "0px";
  const glyphs = [];
  let x = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    glyphs.push({ ch, x, w });
    x += w + tracking;
  }
  const width = x - tracking;
  return { glyphs, width };
}

/**
 * Draws a string with a per-glyph transform callback:
 * each(i, glyph) → { dx, dy, s, rot, alpha, ch } (all optional).
 */
export function drawGlyphs(ctx, text, spec, x, y, { align = "center", fill = "#e8e8e8", chrome = false, each, glow = 0, glowColor = "rgba(255,255,255,0.6)", stroke = 0, strokeStyle } = {}) {
  const { glyphs, width } = layout(ctx, text, spec);
  const size = spec.size ?? 48;
  const left = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const box = [left, y - size * 0.82, width, size];
  const fillStyle = chrome ? chromeGradient(ctx, ...box, chrome === true ? undefined : chrome) : fill;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const tr = each ? each(i, g, glyphs.length) : {};
    if (tr === null) continue;
    const alpha = tr.alpha ?? 1;
    if (alpha <= 0.002) continue;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const cx = left + g.x + g.w / 2 + (tr.dx ?? 0);
    const cy = y - size * 0.35 + (tr.dy ?? 0);
    ctx.translate(cx, cy);
    if (tr.rot) ctx.rotate(tr.rot);
    if (tr.s != null && tr.s !== 1) ctx.scale(tr.s, tr.s);
    ctx.translate(-cx, -cy);
    if (glow > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glow;
    }
    ctx.fillStyle = tr.fill ?? fillStyle;
    const ch = tr.ch ?? g.ch;
    if (stroke > 0) {
      ctx.lineWidth = stroke;
      ctx.strokeStyle = strokeStyle ?? fillStyle;
      ctx.strokeText(ch, left + g.x + (tr.dx ?? 0), y + (tr.dy ?? 0));
    } else {
      ctx.fillText(ch, left + g.x + (tr.dx ?? 0), y + (tr.dy ?? 0));
    }
    ctx.restore();
  }
  return { left, width, glyphs };
}

/** The site's decode pool (motion-kit NOISE). */
export const NOISE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/\\<>";

/**
 * The site's decode: letters settle left to right over the last 70% of the
 * run; the rest is noise, redrawn about twenty times a second. Deterministic:
 * the noise is a function of the 20 Hz tick and the letter index.
 */
export function decode(text, p, t, seed = 1) {
  if (p >= 1) return text;
  if (p <= 0) return "";
  const settled = Math.floor(Math.max(0, (p - 0.3) / 0.7) * text.length);
  const tick = Math.floor(t * 20);
  let out = text.slice(0, settled);
  const visible = Math.ceil(clamp(p / 0.3) * text.length);
  for (let i = settled; i < text.length; i++) {
    if (i >= Math.max(settled, visible)) { out += " "; continue; }
    out += text[i] === " " ? " " : NOISE[Math.floor(hash(tick, i, seed) * NOISE.length)];
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Ornaments                                                                  */
/* -------------------------------------------------------------------------- */

const STAR_OUTER = new Path2D("M12 0c.35 5.6 1.9 9.1 5.2 10.6L24 12l-6.8 1.4C13.9 14.9 12.35 18.4 12 24c-.35-5.6-1.9-9.1-5.2-10.6L0 12l6.8-1.4C10.1 9.1 11.65 5.6 12 0Z");
const STAR_INNER = new Path2D("M12 6.6c.16 2.2.83 3.6 2.3 4.2L17 12l-2.7 1.2c-1.47.6-2.14 2-2.3 4.2-.16-2.2-.83-3.6-2.3-4.2L7 12l2.7-1.2c1.47-.6 2.14-2 2.3-4.2Z");
const DIAMOND = new Path2D("M5 0 6.6 3.4 10 5 6.6 6.6 5 10 3.4 6.6 0 5l3.4-1.6Z");

/** SigilStar (ornaments/SigilStar.tsx) centred at (x, y), `size` px across. */
export function sigilStar(ctx, x, y, size, { rot = 0, alpha = 1, glow = 0, fill } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const k = size / 24;
  ctx.scale(k, k);
  ctx.translate(-12, -12);
  if (glow) {
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = glow / k;
  }
  ctx.fillStyle = fill ?? chromeGradient(ctx, 0, 0, 24, 24, [
    [0, "#20242a"], [0.09, "#e9edf1"], [0.15, "#7d848c"], [0.3, "#1c2025"], [0.44, "#c3c9d0"], [0.5, "#ffffff"],
    [0.57, "#5b6169"], [0.72, "#161a1e"], [0.84, "#aeb5bd"], [0.92, "#f2f5f8"], [1, "#2a2e34"],
  ]);
  ctx.fill(STAR_OUTER);
  ctx.shadowBlur = 0;
  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = "#ffffff";
  ctx.fill(STAR_INNER);
  ctx.restore();
}

export function diamond(ctx, x, y, size, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 10, size / 10);
  ctx.fillStyle = "#d6d9dd";
  ctx.fill(DIAMOND);
  ctx.restore();
}

/**
 * A hairline drawn from an origin outward (the site's data-draw), with the
 * same brightness falloff toward its ends as the CSS rules.
 */
export function hairline(ctx, x0, x1, y, p, { from = "center", alpha = 1, width = 1, color = "255,255,255" } = {}) {
  if (p <= 0) return;
  const len = x1 - x0;
  let a = x0, b = x1;
  if (from === "center") {
    const c = (x0 + x1) / 2;
    a = c - (len / 2) * p;
    b = c + (len / 2) * p;
  } else if (from === "left") b = x0 + len * p;
  else a = x1 - len * p;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(0.5, `rgba(${color},${0.55 * alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(a, y - width / 2, b - a, width);
}

/** Corner brackets (ui/ChromeFrame FrameBrackets) around a rectangle. */
export function brackets(ctx, x, y, w, h, { size = 18, alpha = 1, p = 1, width = 1.2, color = "#dfe3e8" } = {}) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  const s = size * p;
  const corners = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of corners) {
    ctx.moveTo(cx + dx * s, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * s);
  }
  ctx.stroke();
  ctx.restore();
}

/** The notched chrome frame outline (ui/ChromeFrame): corners cut at 45°. */
export function notchedRect(ctx, x, y, w, h, notch = 12) {
  ctx.beginPath();
  ctx.moveTo(x + notch, y);
  ctx.lineTo(x + w - notch, y);
  ctx.lineTo(x + w, y + notch);
  ctx.lineTo(x + w, y + h - notch);
  ctx.lineTo(x + w - notch, y + h);
  ctx.lineTo(x + notch, y + h);
  ctx.lineTo(x, y + h - notch);
  ctx.lineTo(x, y + notch);
  ctx.closePath();
}

/** Ornamental, non-semantic glyph rail (ornaments/SideGlyphRail.tsx), 24 px wide units. */
const RAIL_A = [
  "M8 10v14M16 10v14", "M12 44l5 6-5 6-5-6 5-6Z", "M7 50h10", "M12 76l4 10-4 10-4-10 4-10Z", "M12 118v18M6 127h12",
  "M8 122l8 10M16 122l-8 10", "M12 156c4 4 4 10 0 14-4-4-4-10 0-14Z", "M6 186h12M9 192h6", "M12 214l6 8h-12l6-8Z",
  "M12 236v14", "M8 242h8",
].map((d) => new Path2D(d));

export function glyphRail(ctx, x, y, scale, { alpha = 1, color = "#cfd3d8", lineWidth = 1.1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x - 12 * scale, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  for (const p of RAIL_A) ctx.stroke(p);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(12, 98, 1.6, 0, Math.PI * 2);
  ctx.arc(12, 172, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** OrnamentArc (ornaments/OrnamentDivider.tsx), drawn from its keystone outward. */
export function ornamentArc(ctx, cx, y, width, p, alpha = 1) {
  const k = width / 620;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx - 310 * k, y);
  ctx.scale(k, k);
  const arcs = [
    { d: new Path2D("M10 52C120 22 220 8 310 8s190 14 300 44"), w: 1, a: 1 },
    { d: new Path2D("M150 44c60-16 110-24 160-24s100 8 160 24"), w: 0.75, a: 0.7 },
  ];
  ctx.lineCap = "round";
  for (const arc of arcs) {
    ctx.save();
    // Reveal from the keystone outward with a clip that widens.
    ctx.beginPath();
    ctx.rect(310 - 310 * p, -5, 620 * p, 70);
    ctx.clip();
    ctx.strokeStyle = `rgba(255,255,255,${0.32 * arc.a})`;
    ctx.lineWidth = arc.w / k;
    ctx.stroke(arc.d);
    ctx.restore();
  }
  ctx.restore();
  sigilStar(ctx, cx, y + 15 * k, 30 * k * FORGE(clamp(p * 1.4)), { rot: (1 - FORGE(clamp(p * 1.4))) * -1.2, alpha });
}

/** Soft radial glow (vt-bloom). */
export function bloomDot(ctx, x, y, r, alpha = 1, color = "255,255,255") {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${0.55 * alpha})`);
  g.addColorStop(0.45, `rgba(${color},${0.12 * alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A thin four-point glint (lens star) for sparkles and impacts. */
export function glint(ctx, x, y, size, alpha = 1, rot = 0) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = "lighter";
  for (const [sx, sy] of [[1, 0.06], [0.06, 1]]) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(235,225,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  bloomDot(ctx, 0, 0, size * 0.35, 1);
  ctx.restore();
}

export { expoOut };
