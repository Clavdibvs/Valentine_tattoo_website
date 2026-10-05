/**
 * 9:16 — bars 4–10 (8.29 → 27.52 s): the site on a phone, one section per bar.
 *
 * The phone takes the browser's part: on every downbeat its page whip-scrolls
 * to the next section while it swings to a new angle, and the plucks drive the
 * same gesture per bar as in 16:9, re-laid for a tall frame. On the About
 * downbeat the portrait pushes the phone out of frame. Bar 10 mirrors the
 * landscape cut: there the phone cut through every section, here a desktop
 * browser does, one section per pluck.
 *
 * Across the top, the section progress reads like a story's segments. Text
 * and the gesture cards stay inside y ≈ 250–1530, clear of the interface that
 * Reels and Stories lay over the top and bottom of the frame.
 */

import * as D from "../../lib/draw2d.js";
import { F } from "../../lib/format.js";
import { bar, plucksInBar, impulse, env, prog, clamp, lerp, FORGE, INOUT, expoOut, expoIn, cubicIn, cubicOut, backOut, shake, lastIndex, noise1 } from "../../lib/timing.js";
import { node, M4 } from "../../lib/engine.js";
import { S, SECTIONS, PHONE, browserLayers, phoneLayers, coverUV, coverTop, shift, bigWord, dust, decodeLabel, textTex, life, storyFrame } from "../common.js";
import { PICKS } from "../../assets.js";
import { PULL0, PULL1, HOME_POSE, SCREEN } from "./drop.js";

const TB = [4, 5, 6, 7, 8, 9, 10].map((n) => bar(n));
const END = bar(11);
const ORDER = ["home", "instagram", "creazioni", "flash", "merch", "booking", "about"];
const PLUCKS_ALL = [4, 5, 6, 7, 8, 9].flatMap((n) => plucksInBar(n));

const POSES = [
  { x: HOME_POSE.x, y: HOME_POSE.y, z: 0, s: HOME_POSE.s, rx: 0, ry: 0, rz: 0 }, // home
  { x: 540, y: 1000, z: -60, s: 0.8, rx: 0.1, ry: -0.24, rz: 0 },             // instagram
  { x: 540, y: 1060, z: -760, s: 0.8, rx: 0.05, ry: 0.32, rz: 0 },             // creazioni: the story comes forward
  { x: 540, y: 860, z: -320, s: 0.8, rx: 0.42, ry: 0, rz: 0 },                 // flash: tilted back
  { x: 540, y: 790, z: -220, s: 0.76, rx: 0.08, ry: 0.2, rz: -0.02 },          // merch
  { x: 540, y: 1150, z: -120, s: 0.72, rx: 0.05, ry: -0.18, rz: 0 },           // booking: headline above
  { x: 540, y: 2750, z: -500, s: 0.72, rx: -0.55, ry: 0.15, rz: 0.1 },          // about: pushed out below
];
/** The phone is gone once the About push has carried it out of frame. */
const PHONE_GONE = TB[5] + 0.7;

function sectionAt(t) {
  let k = 0;
  for (let i = 0; i < 6; i++) if (t >= TB[i]) k = i + 1;
  return k;
}

function poseAt(t) {
  let a = POSES[0], b = POSES[0], k = 0;
  for (let i = 0; i < POSES.length - 1; i++) {
    const t0 = TB[i] - 0.14, t1 = TB[i] + 0.8;
    if (t >= t0) {
      a = POSES[i];
      b = POSES[i + 1];
      k = FORGE(prog(t, t0, t1));
    }
  }
  const p = {};
  for (const key of ["x", "y", "z", "s", "rx", "ry", "rz"]) p[key] = lerp(a[key], b[key], k);
  const pl = impulse(t, PLUCKS_ALL, 0.12);
  const fl = prog(t, PULL1 - 0.4, PULL1 + 0.6);
  p.y += 8 * fl * Math.sin((t / 4.1) * Math.PI * 2);
  p.ry += 0.02 * fl * Math.sin((t / 5.3) * Math.PI * 2);
  p.s *= 1 + 0.01 * pl;
  return p;
}

/* -------------------------------------------------------------------------- */
/* The page on the phone                                                      */
/* -------------------------------------------------------------------------- */

/** The mobile capture of a section, cropped to the screen (top-aligned), scrolled by `scroll` (0–1 of the spare height). */
function mobileUV(id, scroll = 0) {
  const tex = S.A["mob_" + id];
  const uv = coverTop(tex, SCREEN.w, SCREEN.h);
  const span = uv[3] - uv[1];
  const off = scroll * (1 - span);
  return { tex, uv: [uv[0], uv[1] + off, uv[2], uv[1] + off + span] };
}

function phoneContent(t) {
  const layers = [];
  const i = sectionAt(t);
  const tb = i > 0 ? TB[i - 1] : -10;
  const k = INOUT(prog(t, tb - 0.24, tb + 0.015));
  const settle = t > tb + 0.015 ? -30 * Math.exp(-(t - tb - 0.015) / 0.075) * Math.sin(((t - tb - 0.015) / 0.16) * Math.PI) : 0;
  const v = Math.abs(k - INOUT(prog(t - 1 / 120, tb - 0.24, tb + 0.015))) * SCREEN.h * 120;
  const blur = [0, Math.min(240, v * 0.022)];
  // Booking scrolls down to the form on its third pluck.
  const P8 = plucksInBar(8);
  const scrollOf = (id) => (id === "booking" ? 0.0 + 0.24 * FORGE(prog(t, P8[2].t, P8[2].t + 0.7)) : 0);
  const draw = (id, y, extra = {}) => {
    const { tex, uv } = mobileUV(id, scrollOf(id));
    layers.push({ tex, uv, x: SCREEN.w / 2, y, w: SCREEN.w, h: SCREEN.h, ...extra });
  };
  if (i > 0 && k < 1) {
    draw(ORDER[i - 1], SCREEN.h / 2 - SCREEN.h * k, { blur });
    draw(ORDER[i], SCREEN.h / 2 + SCREEN.h * (1 - k), { blur });
  } else {
    const rest = i > 0 ? t - tb : t - PULL0;
    draw(ORDER[i], SCREEN.h / 2 + settle - 10 * cubicOut(clamp(rest / 2.6)), { h: SCREEN.h + 20 });
  }
  return S.E.precomp("msite", SCREEN.w, SCREEN.h, layers, { clear: [0.02, 0.02, 0.02, 1] });
}

/* -------------------------------------------------------------------------- */
/* Bar gestures                                                               */
/* -------------------------------------------------------------------------- */

/** Bar 4 — posts pulled out of the phone's feed grid, one per pluck. */
function instagramPops(t, L, pm, pose) {
  const P = plucksInBar(4).filter((p) => p.slot > 0).slice(0, 5);
  // The phone's 3×3 grid, in CSS px of the 390×844 capture.
  const cells = { 1: [0, 0], 7: [0, 2], 3: [2, 0], 6: [2, 1], 4: [0, 1] };
  const cx = [85.5, 195, 305], cy = [374, 510, 646];
  const K = SCREEN.w / 390;
  // Four around the phone, inside the frame's margins; the last one comes
  // straight out of the grid at the viewer.
  const targets = [
    { x: 262, y: 590, z: 260, ry: 0.45, rz: -0.07 },
    { x: 818, y: 625, z: 280, ry: -0.45, rz: 0.06 },
    { x: 278, y: 1300, z: 300, ry: 0.32, rz: 0.05 },
    { x: 802, y: 1330, z: 290, ry: -0.32, rz: -0.05 },
    { x: 540, y: 990, z: 430, ry: 0, rz: -0.02, rx: -0.1 },
  ];
  const exit = prog(t, TB[1] - 0.2, TB[1] + 0.25);
  P.forEach((p, n) => {
    const idx = PICKS.feedPopV[n];
    const [c, r] = cells[idx];
    const age = t - p.t;
    if (age < 0) return;
    const k = FORGE(clamp(age / 0.6));
    const lx = (cx[c] - 195) * K, ly = cy[r] * K - SCREEN.h / 2;
    const start = M4.apply(pm, lx, ly, 0);
    const T = targets[n];
    const x = lerp(start[0], T.x, k), y = lerp(start[1], T.y, k), z = lerp(start[2], T.z, k) + exit * 1600;
    const s = lerp(pose.s * (103 * K) / 216, 1.12, k);
    const m = node({ x, y, z, rx: lerp(pose.rx, T.rx ?? 0, k), ry: lerp(pose.ry, T.ry, k), rz: lerp(0, T.rz, k), s });
    const tex = S.A.feed[idx];
    const bumpAll = 1 + 0.03 * impulse(t, P.slice(n + 1), 0.1);
    const op = clamp(age / 0.05) * (1 - exit);
    L.push({ tex: S.shadow, matrix: shift(m, 0, 30), w: 430, h: 470, opacity: 0.8 * op * k });
    L.push({
      tex, matrix: m, w: 216 * bumpAll, h: 269 * bumpAll, uv: coverUV(tex, 216, 269), radius: 10, opacity: op,
      shine: { pos: lerp(-0.8, 0.8, expoOut(age / 0.7)), width: 0.09, angle: 0.5, amt: 0.9 * Math.exp(-age / 0.8) },
      bright: 1.18, contrast: 1.06,
    });
    L.push({ tex: S.cardFrame, matrix: m, w: 230 * bumpAll, h: 283 * bumpAll, opacity: 0.7 * op });
  });
}

/** Bar 5 — the "Creazioni" highlight opens full height in front of the phone. */
function creazioniStory(t, L) {
  const P = plucksInBar(5);
  const enter = FORGE(prog(t, TB[1] - 0.1, TB[1] + 0.7));
  const exit = expoIn(prog(t, TB[2] - 0.22, TB[2] + 0.12));
  if (enter <= 0 || exit >= 1) return;
  const { pc, age, SW, SH } = storyFrame(t, P, TB[2]);
  const m = node({
    x: 540 - exit * 1300, y: lerp(2700, 930, enter), z: 160, rx: lerp(0.6, 0, enter), ry: -exit * 1.1, rz: lerp(-0.1, 0, enter),
    s: 1.2 * (1 + 0.012 * impulse(t, P, 0.1)),
  });
  L.push({ tex: S.shadow, matrix: shift(m, 0, 40), w: 1100, h: 1400, opacity: 0.9 * (1 - exit) });
  L.push({ tex: pc, matrix: m, w: SW, h: SH, radius: 22, opacity: 1 - exit, shine: { pos: lerp(-0.7, 0.7, expoOut(age / 0.6)), width: 0.08, angle: 0.4, amt: 0.35 * Math.exp(-age / 0.5) } });
  L.push({ tex: S.cardFrame, matrix: m, w: SW + 22, h: SH + 22, opacity: 0.45 * (1 - exit) });
}

/** Bar 6 — flash sheets dealt into a fan across the lower half. */
function flashDeal(t, L) {
  const P = plucksInBar(6);
  const fan = [
    { x: -292, y: 62, rz: -0.24 },
    { x: -98, y: 8, rz: -0.08 },
    { x: 98, y: 8, rz: 0.08 },
    { x: 292, y: 62, rz: 0.24 },
  ];
  const exit = prog(t, TB[3] - 0.3, TB[3] + 0.08);
  P.slice(0, 4).forEach((p, n) => {
    const age = t - p.t;
    if (age < 0) return;
    const k = FORGE(clamp(age / 0.55));
    const f = fan[n];
    const e = cubicIn(clamp(exit * 1.3 - n * 0.08));
    const x = 540 + lerp(f.x * 0.2, f.x, k) + e * f.x * 0.6;
    const y = lerp(2500, 1120 + f.y, k) + e * 1300;
    const m = node({ x, y, z: 120 + n * 30, rx: lerp(0.5, 0.08, k), ry: lerp(0.4 * Math.sign(f.x), 0, k), rz: lerp(f.rz * 3, f.rz, k), s: 0.8 * (1 + 0.025 * impulse(t, P.slice(n + 1), 0.1)) });
    const tex = S.A.flash[PICKS.flash[n]];
    L.push({ tex: S.shadow, matrix: shift(m, 0, 30), w: 600, h: 820, opacity: 0.9 * k * (1 - e) });
    L.push({
      tex, matrix: m, w: 330, h: 587, radius: 12, blur: [0, 90 * e],
      shine: { pos: lerp(-0.8, 0.9, expoOut(age / 0.7)), width: 0.1, angle: 0.55, amt: 0.8 * Math.exp(-age / 0.7) },
    });
    L.push({ tex: S.cardFrame, matrix: m, w: 346, h: 603, opacity: 0.5 });
  });
}

/** Bar 7 — the merch rail, one card per pluck. */
function merchRail(t, L) {
  const P = plucksInBar(7);
  const enter = FORGE(prog(t, TB[3] - 0.04, TB[3] + 0.6));
  const exit = expoIn(prog(t, TB[4] - 0.25, TB[4] + 0.1));
  if (enter <= 0 || exit >= 1) return;
  let pos = 0;
  P.forEach((p, i) => {
    if (i === 0) return;
    pos += backOut(clamp((t - p.t) / 0.32), 1.9);
  });
  pos += exit * 5;
  const items = PICKS.merch;
  const gap = 300;
  for (let i = 0; i < items.length; i++) {
    const d = i - pos - 1;
    const x = 540 + d * gap + (1 - enter) * 1200;
    if (x < -300 || x > F.W + 300) continue;
    const focus = Math.exp(-(d * d) / 0.35);
    const m = node({ x, y: 1240 - 40 * focus, z: 150 + 150 * focus, ry: -d * 0.14, s: 0.9 + 0.25 * focus });
    const tex = S.A.merch[items[i]];
    const lastAge = t - (P[lastIndex(t, P)]?.t ?? -9);
    L.push({ tex: S.shadow, matrix: shift(m, 0, 24), w: 520, h: 740, opacity: 0.85 * enter });
    L.push({
      tex, matrix: m, w: 270, h: 480, uv: coverUV(tex, 270, 480), radius: 12, opacity: enter * (1 - exit), bright: 0.65 + 0.4 * focus,
      shine: focus > 0.5 ? { pos: lerp(-0.8, 0.8, expoOut(lastAge / 0.5)), width: 0.1, angle: 0.5, amt: 0.7 * Math.exp(-lastAge / 0.5) } : null,
    });
    L.push({ tex: S.cardFrame, matrix: m, w: 286, h: 496, opacity: 0.35 + 0.4 * focus });
  }
}

/** A headline line forged letter by letter from `t0`. */
function forged(name, text, t0, t, size, y, z, exit) {
  const age = t - t0;
  if (age < 0) return null;
  const c = S.E.canvas("vforge:" + name, 1080, Math.ceil(size * 1.7));
  const ctx = c.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.w, c.h);
  D.drawGlyphs(ctx, text, { family: D.DISPLAY, size, weight: 400, tracking: 0.05 }, 540, size * 1.2, {
    chrome: true,
    each: (i) => {
      const a = age - i * 0.024;
      const k = FORGE(clamp(a / 0.42));
      if (a < 0) return null;
      return { s: lerp(1.9, 1, k), dy: lerp(-30, 0, k), alpha: clamp(a / 0.08) };
    },
  });
  S.E.upload(c);
  const g = Math.exp(-age / 0.5);
  return { tex: c, x: 540, y, z, w: 1080, h: c.h, opacity: 1 - exit, rgb: 8 * Math.exp(-age / 0.08), shine: { pos: lerp(-0.6, 0.6, expoOut(age / 0.7)), width: 0.06, angle: 0.3, amt: 1.2 * g } };
}

/** Bar 8 — "LA TUA IDEA, / LA MIA VISIONE." above the phone; the CTA lands on the last pluck. */
function booking(t, L) {
  const P = plucksInBar(8);
  const enter = FORGE(prog(t, TB[4] - 0.1, TB[4] + 0.7));
  const exit = expoIn(prog(t, TB[5] - 0.25, TB[5] + 0.1));
  if (enter <= 0 || exit >= 1) return;
  for (const l of [forged("l1", "LA TUA IDEA,", P[0].t, t, 84, 330, 120, exit), forged("l2", "LA MIA VISIONE.", P[1].t, t, 84, 430, 120, exit)]) if (l) L.push(l);
  const tc = P[P.length - 1].t;
  const ac = t - tc;
  if (ac >= 0) {
    const k = backOut(clamp(ac / 0.4), 2.2);
    const tex = S.E.cached("cta:booking", 760, 120, 1, (ctx, w, h) => {
      D.notchedRect(ctx, 6, 14, w - 12, h - 28, 14);
      ctx.fillStyle = "rgba(8,8,10,0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(235,235,240,0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();
      D.font(ctx, { family: D.SANS, size: 24, weight: 500, tracking: 0.28 });
      ctx.fillStyle = "#f1f1f4";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RICHIEDI UNA CONSULENZA  →", w / 2 + 6, h / 2 + 1);
      D.sigilStar(ctx, 52, h / 2, 22);
    }, true);
    // World y 1410 at this depth lands at ~1480 on screen.
    L.push({ tex: S.dotViolet, x: 540, y: 1410, z: 300, w: 1000, h: 340, blend: "add", opacity: 0.5 * Math.exp(-ac / 0.6) + 0.15 });
    L.push({ tex, x: 540, y: 1410, z: 320, w: 760, h: 120, s: k, opacity: clamp(ac / 0.06) * (1 - exit), shine: { pos: lerp(-0.7, 0.7, expoOut(ac / 0.6)), width: 0.08, angle: 0.2, amt: 1.3 * Math.exp(-ac / 0.6) } });
  }
}

/** Bar 9 — the site's portrait, then CUSTOM · PLACEMENT · TRIGGIANO on 0-3-6. */
function about(t, L) {
  const P = plucksInBar(9);
  const enter = FORGE(prog(t, TB[5] - 0.1, TB[5] + 0.75));
  const exit = expoIn(prog(t, TB[6] - 0.22, TB[6] + 0.1));
  if (enter <= 0 || exit >= 1) return;
  const pm = node({ x: 540 - exit * 1100, y: lerp(-500, 640, enter), z: 200, rx: lerp(-0.6, 0, enter), ry: 0.12 * (1 - enter) + 0.08, rz: lerp(0.08, -0.015, enter), s: 1 + 0.015 * impulse(t, P, 0.1) });
  const tex = S.A.portrait;
  const last = P[P.length - 1];
  const sa = t - last.t;
  L.push({ tex: S.shadow, matrix: shift(pm, 0, 40), w: 900, h: 1100, opacity: 0.9 * (1 - exit) });
  L.push({
    tex, matrix: pm, w: 430, h: 538, uv: coverUV(tex, 430, 538, 0.3), radius: 6, opacity: 1 - exit, contrast: 1.06, sat: 0.85,
    shine: sa >= 0 ? { pos: lerp(-0.8, 0.8, expoOut(sa / 0.6)), width: 0.1, angle: 0.5, amt: 0.8 * Math.exp(-sa / 0.6) } : null,
  });
  const frame = S.E.cached("about:frame", 480, 588, 1, (ctx, w, h) => {
    D.notchedRect(ctx, 3, 3, w - 6, h - 6, 22);
    ctx.strokeStyle = "rgba(235,235,240,0.7)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    D.brackets(ctx, 14, 14, w - 28, h - 28, { size: 30, width: 2.2 });
  }, true);
  L.push({ tex: frame, matrix: pm, w: 480, h: 588, opacity: 1 - exit });
  const n4 = P[3];
  if (n4 && t >= n4.t) {
    const a = t - n4.t;
    const nm = textTex("about:name", "Valentina Stucchi", { size: 52, style: "italic", w: 760, h: 90 });
    const role = decodeLabel("about:role", "TATTOO ARTIST · TRIGGIANO", prog(t, n4.t, n4.t + 0.7), t, { size: 15, w: 760, h: 40, tracking: 0.5, seed: 4 });
    L.push({ tex: nm, matrix: shift(pm, 0, 338, 40), w: 760, h: 90, opacity: clamp(a / 0.2) * (1 - exit) });
    L.push({ tex: role, matrix: shift(pm, 0, 392, 40), w: 760, h: 40, opacity: 1 - exit });
  }
  const Q = [["CUSTOM", "Disegni sviluppati su misura"], ["PLACEMENT", "Composizioni progettate sul corpo"], ["TRIGGIANO", "Presso Crossbone Studio"]];
  Q.forEach(([word, desc], i) => {
    const p = P[i];
    const a = t - p.t;
    if (a < 0) return;
    const k = FORGE(clamp(a / 0.5));
    const y = 1153 + i * 128;
    const wt = textTex("qv:" + word, word, { size: 88, chrome: true, w: 1080, h: 130, tracking: 0.05 });
    const dt = textTex("qdv:" + word, desc.toUpperCase(), { family: D.SANS, size: 16, weight: 500, tracking: 0.36, color: "#bdbdc4", w: 1080, h: 40 });
    L.push({ tex: wt, x: 540, y: y + 30 * (1 - k), z: 200, w: 1080, h: 130, opacity: clamp(a / 0.08) * (1 - exit), rgb: 9 * Math.exp(-a / 0.08), shine: { pos: lerp(-0.6, 0.7, expoOut(a / 0.7)), width: 0.06, angle: 0.3, amt: 1.3 * Math.exp(-a / 0.6) }, blur: [0, 50 * (1 - k)] });
    L.push({ tex: dt, x: 540, y: y + 58, z: 200, w: 1080, h: 40, opacity: clamp((a - 0.12) / 0.3) * (1 - exit) });
  });
}

/** Bar 10 — a desktop browser cuts through every section, one per pluck. */
function desktopMontage(t, L, post) {
  const P = plucksInBar(10);
  const t0 = TB[6];
  const enter = FORGE(prog(t, t0 - 0.12, t0 + 0.55));
  if (enter <= 0 || t > END + 0.05) return;
  const k = Math.max(0, lastIndex(t, P));
  const age = t - P[k].t;
  const id = ORDER[Math.min(6, k)];
  const swing = prog(t, t0, END);
  const push = expoIn(prog(t, P[P.length - 2].t, END));
  const m = node({
    x: 540 + 8 * Math.sin(t * 2), y: lerp(2200, 930, enter), z: 80 + 1500 * push,
    ry: lerp(-0.42, 0.38, swing) + 0.1 * Math.sin(k * 2.1), rx: 0.08, rz: lerp(0.05, -0.03, swing),
    s: 0.5 * (1 + 0.03 * Math.exp(-age / 0.1)),
  });
  const content = S.A["desk_" + id];
  for (const l of browserLayers(m, content, { contentOpts: { rgb: 10 * Math.exp(-age / 0.06), glitch: 0.05 * Math.exp(-age / 0.05), seed: k * 13, bright: 1 + 0.5 * Math.exp(-age / 0.08) } })) L.push(l);
  const sec = SECTIONS[Math.min(6, k)];
  const idx = textTex("dm:idx", sec.index, { size: 150, chrome: true, w: 500, h: 210 });
  L.push({ tex: idx, x: 540, y: 470, z: 60, w: 500, h: 210, opacity: enter * (1 - push), rgb: 10 * Math.exp(-age / 0.07), s: 1 + 0.08 * Math.exp(-age / 0.1) });
  const nm = decodeLabel("dm:name", sec.word, clamp(age / 0.22), t, { size: 34, w: 800, h: 70, tracking: 0.42, family: D.SANS, weight: 500, seed: k });
  L.push({ tex: nm, x: 540, y: 1320, z: 60, w: 800, h: 70, opacity: enter * (1 - push) });
  const ey = decodeLabel("dm:eyebrow", sec.eyebrow.length > 26 ? "VALENTINETATTOO.IT" : sec.eyebrow, clamp(age / 0.3), t, { size: 16, w: 900, h: 40, tracking: 0.5, color: "#9d9da4", seed: k + 3 });
  L.push({ tex: ey, x: 540, y: 1378, z: 60, w: 900, h: 40, opacity: enter * (1 - push) });
  post.flash += 0.22 * Math.exp(-age / 0.05) * (k > 0 ? 1 : 0);
  post.zoomBlur += 0.18 * push;
  post.glitch = (post.glitch ?? 0) + 0.3 * Math.exp(-age / 0.045) * (k > 0 ? 1 : 0);
}

/* -------------------------------------------------------------------------- */
/* HUD: progress like a story's segments, and the section label              */
/* -------------------------------------------------------------------------- */

function hud(t, L) {
  const a = life(t, PULL1 - 0.35, END + 0.05, 0.4, 0.2);
  if (a <= 0) return;
  let active = sectionAt(t);
  const P10 = plucksInBar(10);
  const montage = t >= TB[6];
  if (montage) active = Math.min(6, Math.max(0, lastIndex(t, P10)));
  const starts = [PULL1, ...TB.slice(0, 6)];
  const ends = [...TB.slice(0, 6), TB[6]];
  const c = S.E.canvas("vhud:segments", 960, 40);
  const ctx = c.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 960, 40);
  const n = 7, gap = 10, segW = (960 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const f = montage ? (i <= active ? 1 : 0) : i < active ? 1 : i === active ? clamp((t - starts[i]) / (ends[i] - starts[i])) : 0;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.roundRect(i * (segW + gap), 18, segW, 4, 2);
    ctx.fill();
    ctx.fillStyle = i === active ? "rgba(220,188,255,1)" : "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.roundRect(i * (segW + gap), 18, segW * f, 4, 2);
    ctx.fill();
  }
  S.E.upload(c);
  L.push({ tex: c, x: 540, y: 150, w: 960, h: 40, opacity: a, screen: true });

  const sec = SECTIONS[active];
  const tb = montage ? (P10[active]?.t ?? TB[6]) : active > 0 ? TB[active - 1] : PULL1;
  const since = t - tb;
  const labelA = a * (1 - life(t, TB[4] - 0.1, END + 1, 0.2, 0.01));
  const idx = textTex("vhud:idx", sec.index, { size: 64, chrome: true, w: 200, h: 100, align: "left" });
  L.push({ tex: idx, x: 60 + 100, y: 236, w: 200, h: 100, opacity: labelA, screen: true, rgb: 6 * Math.exp(-Math.max(0, since) / 0.08) });
  const ey = decodeLabel("vhud:eyebrow", sec.eyebrow.length > 30 ? "BOOKING / CONSULENZA" : sec.eyebrow, clamp(since / 0.55), t, { size: 15, w: 760, h: 36, align: "left", tracking: 0.42, seed: active });
  L.push({ tex: ey, x: 150 + 380, y: 222, w: 760, h: 36, opacity: labelA, screen: true });
  const ti = textTex("vhud:title", sec.title.length > 22 ? sec.word : sec.title, { size: 26, w: 760, h: 44, align: "left", tracking: 0.08, color: "#cfcfd5" });
  L.push({ tex: ti, x: 150 + 380, y: 252, w: 760, h: 44, opacity: labelA * clamp(since / 0.4), screen: true });
}

/* -------------------------------------------------------------------------- */

export function tour(t, L, cam, post) {
  if (t < PULL0 - 0.01 || t > END + 0.1) return;

  const sec = sectionAt(t);
  const bgA = sec > 0 ? life(t, PULL0 + 0.2, TB[6] + 0.3, 0.6, 0.4) : 0;
  if (bgA > 0) {
    const word = SECTIONS[sec].word;
    const tb = TB[sec - 1];
    const since = t - tb;
    const k = FORGE(clamp((since + 0.15) / 0.7));
    const x = 540 + 420 - 900 * k - 26 * since;
    L.push({ tex: bigWord(word), x, y: 980, z: -1100, w: 3400, h: 560, s: 1.42, opacity: 0.35 * bgA * clamp((since + 0.15) / 0.25), blur: [80 * (1 - k), 0] });
    if (sec > 1 && since < 0.6) {
      const prev = SECTIONS[sec - 1].word;
      L.push({ tex: bigWord(prev), x: 540 - 480 - 2400 * expoIn(clamp((since + 0.2) / 0.5)), y: 980, z: -1100, w: 3400, h: 560, s: 1.42, opacity: 0.35 * bgA * (1 - clamp((since + 0.2) / 0.5)) });
    }
  }
  const dustA = life(t, PULL0, END, 0.8, 0.3);
  if (dustA > 0) L.push({ tex: dust(t, dustA, cam), x: F.cx, y: F.cy, w: F.W, h: F.H, screen: true, blend: "add" });

  /* ---- the phone ------------------------------------------------------------ */
  const pose = poseAt(t);
  const pm = node(pose);
  if (t < PHONE_GONE) {
    const content = phoneContent(t);
    const pIn = clamp((t - PULL0) / 0.12);
    const plB = impulse(t, PLUCKS_ALL, 0.35);
    const dim = sec === 3 ? 0.62 : sec === 2 ? 0.6 : 1;
    L.push({ tex: S.dotViolet, matrix: pm, w: PHONE.w * 1.9, h: PHONE.h * 1.4, opacity: (0.1 + 0.12 * plB) * pIn, blend: "add" });
    for (const l of phoneLayers(pm, content, { opacity: pIn, uv: [0, 0, 1, 1], contentOpts: { bright: dim } })) L.push(l);
    const lastP = PLUCKS_ALL[lastIndex(t, PLUCKS_ALL)];
    const sa = lastP ? t - lastP.t : 9;
    if (lastP && sa < 1.5) L.push({ tex: S.phone, matrix: pm, w: PHONE.w, h: PHONE.h, opacity: 0.9 * pIn, blend: "add", bright: 0, shine: { pos: lerp(-0.9, 0.9, expoOut(sa / 0.7)), width: 0.05, angle: 0.62, amt: 0.3 * Math.exp(-sa / 0.5) } });
  }

  /* ---- bar gestures ---------------------------------------------------------- */
  if (t >= TB[0] - 0.05 && t < TB[1] + 0.4) instagramPops(t, L, pm, pose);
  if (t >= TB[1] - 0.15 && t < TB[2] + 0.2) creazioniStory(t, L);
  if (t >= TB[2] - 0.05 && t < TB[3] + 0.45) flashDeal(t, L);
  if (t >= TB[3] - 0.15 && t < TB[4] + 0.2) merchRail(t, L);
  if (t >= TB[4] - 0.15 && t < TB[5] + 0.2) booking(t, L);
  if (t >= TB[5] - 0.15 && t < TB[6] + 0.2) about(t, L);
  if (t >= TB[6] - 0.15) desktopMontage(t, L, post);

  hud(t, L);

  if (t >= PULL1 - 0.05) {
    const pl = impulse(t, PLUCKS_ALL, 0.12);
    const db = impulse(t, TB, 0.18);
    const [sx, sy] = shake(t, 5 * db + 1.6 * pl, 12, 33);
    cam.x = F.cx + 12 * noise1(t * 0.25, 2) + sx;
    cam.y = F.cy + 14 * noise1(t * 0.22, 5) + sy;
    cam.zoom = 1 + 0.01 * pl + 0.02 * db;
    cam.roll = 0.004 * noise1(t * 0.3, 8);
    const sub = clamp(env("sub", t));
    post.ca = 0.0015 + 0.006 * pl + 0.012 * db;
    post.bloom = 0.55 + 0.2 * pl + 0.18 * sub;
    post.exposure = 1 + 0.035 * sub;
    post.flash = (post.flash ?? 0) + 0.12 * db;
    post.glitch = (post.glitch ?? 0) + impulse(t, TB, 0.055, 0, TB.map((_, i) => (i === 3 ? 1.0 : 0.38)));
    post.glitchSeed = Math.floor(t * 30);
  }
}
