/**
 * Bars 4–10 (8.29 → 27.52 s): the site, one section per bar.
 *
 * The browser window floats in depth. On every downbeat its page whip-scrolls
 * to the next section (the motion lands on the "1") while the window swings
 * to a new angle. Inside each bar the bass plucks drive one gesture, always
 * on the line's own pattern:
 *
 *   bar 4  INSTAGRAM  posts are pulled out of the feed grid, one per pluck
 *   bar 5  CREAZIONI  a story frame cuts to the next work on each pluck
 *   bar 6  FLASH      flash sheets are dealt into a fan
 *   bar 7  MERCH      the merch rail snaps one card per pluck
 *   bar 8  BOOKING    the headline is forged word by word; the CTA lands on the last
 *   bar 9  ABOUT      CUSTOM · PLACEMENT · TRIGGIANO on the 0-3-6 "triplet"
 *   bar 10 MOBILE     the phone cuts through all seven sections, one per pluck
 */

import * as D from "../lib/draw2d.js";
import { bar, plucksInBar, impulse, env, prog, clamp, lerp, FORGE, INOUT, expoOut, expoIn, cubicIn, cubicOut, backOut, shake, lastIndex, noise1 } from "../lib/timing.js";
import { node, M4 } from "../lib/engine.js";
import { S, SECTIONS, WINDOW, PHONE, browserLayers, phoneLayers, coverUV, coverTop, shift, bigWord, dust, decodeLabel, textTex, life, storyFrame } from "./common.js";
import { PICKS } from "../assets.js";
import { PULL0, PULL1, HOME_POSE } from "./drop.js";

/** Section downbeats: instagram … about, then the mobile bar. */
const TB = [4, 5, 6, 7, 8, 9, 10].map((n) => bar(n));
const END = bar(11);

const POSES = [
  { x: HOME_POSE.x, y: HOME_POSE.y, z: 0, s: HOME_POSE.s, rx: 0, ry: 0, rz: 0 }, // home
  { x: 960, y: 560, z: -40, s: 0.7, rx: 0.12, ry: -0.2, rz: 0 },             // instagram
  { x: 690, y: 548, z: -120, s: 0.64, rx: 0.04, ry: 0.32, rz: 0 },            // creazioni
  { x: 960, y: 455, z: -380, s: 0.72, rx: 0.42, ry: 0, rz: 0 },               // flash
  { x: 960, y: 420, z: -160, s: 0.66, rx: 0.08, ry: 0.16, rz: -0.015 },        // merch
  { x: 700, y: 650, z: -120, s: 0.58, rx: 0.04, ry: 0.3, rz: 0 },             // booking
  { x: 1240, y: 520, z: -700, s: 0.62, rx: 0.06, ry: -0.34, rz: 0 },          // about
  { x: 960, y: 560, z: -3200, s: 0.62, rx: 0.3, ry: 0.9, rz: 0.12 },          // mobile: the window leaves
];

/** Index of the section on screen: 0 home … 6 about. */
function sectionAt(t) {
  let k = 0;
  for (let i = 0; i < 6; i++) if (t >= TB[i]) k = i + 1;
  return k;
}

/** Browser pose at t, interpolated across each downbeat. */
function poseAt(t) {
  let a = POSES[0], b = POSES[0], k = 0;
  for (let i = 0; i < TB.length; i++) {
    const t0 = TB[i] - 0.14, t1 = TB[i] + (i === 6 ? 0.6 : 0.8);
    if (t >= t0) {
      a = POSES[i];
      b = POSES[i + 1];
      k = i === 6 ? expoIn(prog(t, t0, t1)) : FORGE(prog(t, t0, t1));
    }
  }
  const p = {};
  for (const key of ["x", "y", "z", "s", "rx", "ry", "rz"]) p[key] = lerp(a[key], b[key], k);
  // Breathing: a slow float, and a small push on every pluck. Held still
  // through the pull-back, where the hero must sit exactly under the free mark.
  const pl = impulse(t, PLUCKS_ALL, 0.12);
  const fl = prog(t, PULL1 - 0.4, PULL1 + 0.6);
  p.y += 6 * fl * Math.sin((t / 4.1) * Math.PI * 2);
  p.ry += 0.018 * fl * Math.sin((t / 5.3) * Math.PI * 2);
  p.s *= 1 + 0.008 * pl;
  return p;
}

const PLUCKS_ALL = [4, 5, 6, 7, 8, 9].flatMap((n) => plucksInBar(n));

/* -------------------------------------------------------------------------- */
/* The page inside the window                                                 */
/* -------------------------------------------------------------------------- */

const ORDER = ["home", "instagram", "creazioni", "flash", "merch", "booking", "about"];

function siteContent(t) {
  const A = S.A;
  const layers = [];
  let i = sectionAt(t);
  // The whip into section i lands on its downbeat.
  const tb = i > 0 ? TB[i - 1] : -10;
  const k = INOUT(prog(t, tb - 0.24, tb + 0.015));
  const settle = t > tb + 0.015 ? -38 * Math.exp(-(t - tb - 0.015) / 0.075) * Math.sin(((t - tb - 0.015) / 0.16) * Math.PI) : 0;
  const v = (Math.abs(k - INOUT(prog(t - 1 / 120, tb - 0.24, tb + 0.015))) * 1080) * 120;
  const blur = [0, Math.min(260, v * 0.022)];
  if (i > 0 && k < 1) {
    layers.push({ tex: A["desk_" + ORDER[i - 1]], x: 960, y: 540 - 1080 * k, w: 1920, h: 1080, blur });
    layers.push({ tex: A["desk_" + ORDER[i]], x: 960, y: 540 + 1080 * (1 - k), w: 1920, h: 1080, blur });
  } else {
    // A slow drift while a section rests, so the page never looks frozen.
    const rest = i > 0 ? t - tb : t - PULL0;
    layers.push({ tex: A["desk_" + ORDER[i]], x: 960, y: 540 + settle - 14 * cubicOut(clamp(rest / 2.6)), w: 1920, h: 1080 + 28 });
  }
  return S.E.precomp("site", 1920, 1080, layers, { clear: [0.02, 0.02, 0.02, 1] });
}

/* -------------------------------------------------------------------------- */
/* Bar overlays                                                               */
/* -------------------------------------------------------------------------- */

/** Bar 4 — posts pulled out of the feed grid. */
function instagramPops(t, L, bm, pose) {
  const P = plucksInBar(4).filter((p) => p.slot > 0).slice(0, 5);
  const cells = { 1: [0, 0], 7: [1, 1], 3: [2, 0], 6: [0, 1], 10: [4, 1] };
  const cx = [495, 728, 960, 1193, 1424], cy = [625.5, 912];
  const targets = [
    { x: 380, y: 430, z: 240, ry: 0.42, rz: -0.07 },
    { x: 1540, y: 420, z: 260, ry: -0.42, rz: 0.06 },
    { x: 590, y: 760, z: 300, ry: 0.32, rz: 0.05 },
    { x: 1345, y: 765, z: 280, ry: -0.32, rz: -0.05 },
    { x: 960, y: 300, z: 360, ry: 0, rz: 0.0, rx: -0.15 },
  ];
  const exit = prog(t, TB[1] - 0.2, TB[1] + 0.25);
  P.forEach((p, n) => {
    const idx = PICKS.feedPop[n];
    const [c, r] = cells[idx];
    const age = t - p.t;
    if (age < 0) return;
    const k = FORGE(clamp(age / 0.6));
    const lx = cx[c] - 960, ly = cy[r] - 540 + WINDOW.bar / 2;
    const start = M4.apply(bm, lx, ly, 0);
    const T = targets[n];
    const x = lerp(start[0], T.x, k), y = lerp(start[1], T.y, k), z = lerp(start[2], T.z, k) + exit * 1600;
    const s = lerp(pose.s, 1, k);
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

/** Bar 5 — the "Creazioni" highlight as a story, cut on the plucks. */
function creazioniStory(t, L) {
  const P = plucksInBar(5);
  const enter = FORGE(prog(t, TB[1] - 0.1, TB[1] + 0.7));
  const exit = expoIn(prog(t, TB[2] - 0.22, TB[2] + 0.12));
  if (enter <= 0 || exit >= 1) return;
  const { pc, age, SW, SH } = storyFrame(t, P, TB[2]);

  const x = lerp(2300, 1440, enter) + exit * 900;
  const m = node({ x, y: 540, z: 140, ry: lerp(-0.9, -0.16, enter) - exit * 1.2, rz: lerp(0.12, 0.0, enter), s: 0.88 * (1 + 0.012 * impulse(t, P, 0.1)) });
  L.push({ tex: S.shadow, matrix: shift(m, 0, 40), w: 1100, h: 1400, opacity: 0.9 * (1 - exit) });
  L.push({ tex: pc, matrix: m, w: SW, h: SH, radius: 22, opacity: 1 - exit, shine: { pos: lerp(-0.7, 0.7, expoOut(age / 0.6)), width: 0.08, angle: 0.4, amt: 0.35 * Math.exp(-age / 0.5) } });
  L.push({ tex: S.cardFrame, matrix: m, w: SW + 22, h: SH + 22, opacity: 0.45 * (1 - exit) });
}

/** Bar 6 — flash sheets dealt into a fan. */
function flashDeal(t, L) {
  const P = plucksInBar(6);
  const fan = [
    { x: -480, y: 78, rz: -0.26 },
    { x: -162, y: 10, rz: -0.085 },
    { x: 162, y: 10, rz: 0.085 },
    { x: 480, y: 78, rz: 0.26 },
  ];
  const exit = prog(t, TB[3] - 0.3, TB[3] + 0.08);
  P.slice(0, 4).forEach((p, n) => {
    const age = t - p.t;
    if (age < 0) return;
    const k = FORGE(clamp(age / 0.55));
    const f = fan[n];
    const e = cubicIn(clamp(exit * 1.3 - n * 0.08));
    const x = 960 + lerp(f.x * 0.2, f.x, k) + e * f.x * 0.6;
    const y = lerp(1500, 600 + f.y, k) + e * 1250;
    const m = node({ x, y, z: 120 + n * 30, rx: lerp(0.5, 0.08, k), ry: lerp(0.4 * Math.sign(f.x), 0, k), rz: lerp(f.rz * 3, f.rz, k), s: 1 + 0.025 * impulse(t, P.slice(n + 1), 0.1) });
    const tex = S.A.flash[PICKS.flash[n]];
    L.push({ tex: S.shadow, matrix: shift(m, 0, 30), w: 600, h: 820, opacity: 0.9 * k * (1 - e) });
    L.push({
      tex, matrix: m, w: 330, h: 587, radius: 12, blur: [0, 90 * e],
      shine: { pos: lerp(-0.8, 0.9, expoOut(age / 0.7)), width: 0.1, angle: 0.55, amt: 0.8 * Math.exp(-age / 0.7) },
    });
    L.push({ tex: S.cardFrame, matrix: m, w: 346, h: 603, opacity: 0.5 });
  });
}

/** Bar 7 — the merch rail snapping one card per pluck. */
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
  const gap = 320;
  for (let i = 0; i < items.length; i++) {
    const d = i - pos - 1;
    const x = 960 + d * gap + (1 - enter) * 1400;
    if (x < -300 || x > 2220) continue;
    const focus = Math.exp(-(d * d) / 0.35);
    const m = node({ x, y: 700 - 30 * focus, z: 150 + 140 * focus, ry: -d * 0.12, s: 0.9 + 0.2 * focus });
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

/** Bar 8 — the headline forged word by word, the phone, the call to action. */
function booking(t, L) {
  const P = plucksInBar(8);
  const enter = FORGE(prog(t, TB[4] - 0.1, TB[4] + 0.7));
  const exit = expoIn(prog(t, TB[5] - 0.25, TB[5] + 0.1));
  if (enter <= 0 || exit >= 1) return;
  // Phone with the mobile booking section.
  const pm = node({ x: lerp(2350, 1500, enter) + exit * 900, y: 600, z: 100, ry: lerp(-0.8, -0.3, enter), rz: 0.03, s: 0.52 * (1 + 0.012 * impulse(t, P, 0.1)) });
  const mob = S.A.mob_booking;
  const scroll = 0.0 + 0.24 * FORGE(prog(t, P[2].t, P[2].t + 0.7));
  const sw = PHONE.w - PHONE.screenInset * 2, sh = PHONE.h - PHONE.screenInset * 2;
  const uv = coverTop(mob, sw, sh);
  const span = uv[3] - uv[1];
  for (const l of phoneLayers(pm, mob, { opacity: 1 - exit, uv: [uv[0], uv[1] + scroll * (1 - span), uv[2], uv[1] + scroll * (1 - span) + span] })) L.push(l);

  // Headline: "LA TUA IDEA," on the downbeat pluck, "LA MIA VISIONE." on the next.
  const lines = [["LA TUA IDEA,", P[0].t, 128], ["LA MIA VISIONE.", P[1].t, 232]];
  for (const [text, t0, y] of lines) {
    const age = t - t0;
    if (age < 0) continue;
    const c = S.E.canvas("forge:" + text, 1700, 170);
    const ctx = c.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1700, 170);
    D.drawGlyphs(ctx, text, { family: D.DISPLAY, size: 98, weight: 400, tracking: 0.05 }, 850, 118, {
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
    L.push({ tex: c, x: 900, y, z: 120, w: 1700, h: 170, opacity: 1 - exit, rgb: 8 * Math.exp(-age / 0.08), shine: { pos: lerp(-0.6, 0.6, expoOut(age / 0.7)), width: 0.06, angle: 0.3, amt: 1.2 * g } });
  }
  // The call to action lands on the last pluck of the bar.
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
    L.push({ tex: S.dotViolet, x: 1120, y: 905, z: 300, w: 1100, h: 340, blend: "add", opacity: 0.5 * Math.exp(-ac / 0.6) + 0.15 });
    L.push({ tex, x: 1120, y: 905, z: 320, w: 760, h: 120, s: k, opacity: clamp(ac / 0.06) * (1 - exit), shine: { pos: lerp(-0.7, 0.7, expoOut(ac / 0.6)), width: 0.08, angle: 0.2, amt: 1.3 * Math.exp(-ac / 0.6) } });
  }
}

/** Bar 9 — the artist: portrait, and CUSTOM · PLACEMENT · TRIGGIANO on 0-3-6. */
function about(t, L) {
  const P = plucksInBar(9);
  const enter = FORGE(prog(t, TB[5] - 0.1, TB[5] + 0.75));
  const exit = expoIn(prog(t, TB[6] - 0.22, TB[6] + 0.1));
  if (enter <= 0 || exit >= 1) return;
  const pm = node({ x: lerp(-400, 590, enter) - exit * 900, y: 545, z: 220, ry: lerp(0.9, 0.2, enter), rz: lerp(-0.1, -0.02, enter), s: 1 + 0.015 * impulse(t, P, 0.1) });
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
  // Name plate on the fourth pluck.
  const n4 = P[3];
  if (n4 && t >= n4.t) {
    const a = t - n4.t;
    const nm = textTex("about:name", "Valentina Stucchi", { size: 52, style: "italic", w: 760, h: 90 });
    const role = decodeLabel("about:role", "TATTOO ARTIST · TRIGGIANO", prog(t, n4.t, n4.t + 0.7), t, { size: 15, w: 760, h: 40, tracking: 0.5, seed: 4 });
    L.push({ tex: nm, matrix: shift(pm, 0, 338, 40), w: 760, h: 90, opacity: clamp(a / 0.2) * (1 - exit) });
    L.push({ tex: role, matrix: shift(pm, 0, 392, 40), w: 760, h: 40, opacity: (1 - exit) });
  }
  // The qualities, one per pluck of the 0-3-6 skeleton.
  const Q = [["CUSTOM", "Disegni sviluppati su misura"], ["PLACEMENT", "Composizioni progettate sul corpo"], ["TRIGGIANO", "Presso Crossbone Studio"]];
  Q.forEach(([word, desc], i) => {
    const p = P[i];
    const a = t - p.t;
    if (a < 0) return;
    const k = FORGE(clamp(a / 0.5));
    const y = 330 + i * 190;
    const wt = textTex("q:" + word, word, { size: 104, chrome: true, w: 1100, h: 150, align: "left", tracking: 0.05 });
    const dt = textTex("qd:" + word, desc.toUpperCase(), { family: D.SANS, size: 17, weight: 500, tracking: 0.36, color: "#bdbdc4", w: 1100, h: 40, align: "left" });
    const x = 1060 + 40 * (1 - k);
    L.push({ tex: wt, x: x + 550, y, z: 200, w: 1100, h: 150, opacity: clamp(a / 0.08) * (1 - exit), rgb: 9 * Math.exp(-a / 0.08), shine: { pos: lerp(-0.6, 0.7, expoOut(a / 0.7)), width: 0.06, angle: 0.3, amt: 1.3 * Math.exp(-a / 0.6) }, blur: [60 * (1 - k), 0] });
    L.push({ tex: dt, x: x + 550 + 4, y: y + 70, z: 200, w: 1100, h: 40, opacity: clamp((a - 0.12) / 0.3) * (1 - exit) });
    const line = S.E.canvas("q:line" + i, 600, 6);
    line.ctx.clearRect(0, 0, 600, 6);
    D.hairline(line.ctx, 0, 600, 3, FORGE(clamp(a / 0.8)), { from: "left", alpha: 1.3, width: 1.2 });
    S.E.upload(line);
    L.push({ tex: line, x: x + 300, y: y + 98, z: 200, w: 600, h: 6, opacity: 1 - exit });
  });
}

/** Bar 10 — the phone cuts through every section, one per pluck. */
function mobileMontage(t, L, post) {
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
    x: 960 + 10 * Math.sin(t * 2), y: lerp(1500, 545, enter), z: 80 + 1500 * push,
    ry: lerp(-0.55, 0.45, swing) + 0.12 * Math.sin(k * 2.1), rx: 0.06, rz: lerp(-0.06, 0.04, swing),
    s: 0.76 * (1 + 0.03 * Math.exp(-age / 0.1)),
  });
  const tex = S.A["mob_" + id];
  for (const l of phoneLayers(m, tex, { uv: coverTop(tex, PHONE.w - PHONE.screenInset * 2, PHONE.h - PHONE.screenInset * 2), contentOpts: { rgb: 10 * Math.exp(-age / 0.06), glitch: 0.05 * Math.exp(-age / 0.05), seed: k * 13, bright: 1 + 0.5 * Math.exp(-age / 0.08) } })) L.push(l);
  // Index and name either side of the phone.
  const sec = SECTIONS[Math.min(6, k)];
  const idx = textTex("mob:idx", sec.index, { size: 120, chrome: true, w: 400, h: 170 });
  L.push({ tex: idx, x: 470, y: 520, z: 60, w: 400, h: 170, opacity: enter * (1 - push), rgb: 10 * Math.exp(-age / 0.07), s: 1 + 0.08 * Math.exp(-age / 0.1) });
  const nm = decodeLabel("mob:name", sec.word, clamp(age / 0.22), t, { size: 30, w: 600, h: 60, tracking: 0.42, family: D.SANS, weight: 500, seed: k });
  L.push({ tex: nm, x: 470, y: 618, z: 60, w: 600, h: 60, opacity: enter * (1 - push) });
  const ey = decodeLabel("mob:eyebrow", sec.eyebrow.length > 26 ? "VALENTINETATTOO.IT" : sec.eyebrow, clamp(age / 0.3), t, { size: 15, w: 700, h: 40, tracking: 0.5, color: "#9d9da4", seed: k + 3 });
  L.push({ tex: ey, x: 1450, y: 540, z: 60, w: 700, h: 40, opacity: enter * (1 - push) });
  post.flash += 0.22 * Math.exp(-age / 0.05) * (k > 0 ? 1 : 0);
  post.zoomBlur += 0.18 * push;
  post.glitch = (post.glitch ?? 0) + 0.3 * Math.exp(-age / 0.045) * (k > 0 ? 1 : 0);
}

/* -------------------------------------------------------------------------- */
/* HUD: the site's own navigation as the tour's progress bar                  */
/* -------------------------------------------------------------------------- */

function hud(t, L) {
  const a = life(t, PULL1 - 0.35, END + 0.05, 0.4, 0.2);
  if (a <= 0) return;
  let active = sectionAt(t);
  if (t >= TB[6]) active = Math.min(6, Math.max(0, lastIndex(t, plucksInBar(10))));
  const c = S.E.canvas("hud:nav", 1500, 70);
  const ctx = c.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 1500, 70);
  D.font(ctx, { family: D.SANS, size: 15, weight: 400, tracking: 0.34 });
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const labels = SECTIONS.map((s) => s.nav);
  const widths = labels.map((l) => ctx.measureText(l).width);
  const gap = 58;
  const total = widths.reduce((s, w) => s + w, 0) + gap * (labels.length - 1);
  let x = 750 - total / 2;
  const xs = [];
  labels.forEach((l, i) => {
    xs.push([x, widths[i]]);
    ctx.fillStyle = i === active ? "#ffffff" : "rgba(170,170,178,0.75)";
    ctx.fillText(l, x, 30);
    x += widths[i] + gap;
  });
  // The underline slides to the active item, in the ember the site uses for live states.
  const tb = t >= TB[6] ? (plucksInBar(10)[active]?.t ?? TB[6]) : active > 0 ? TB[active - 1] : PULL1;
  const prevIdx = Math.max(0, active - 1);
  const k = FORGE(prog(t, tb - 0.05, tb + 0.4));
  const ux = lerp(xs[prevIdx][0], xs[active][0], k), uw = lerp(xs[prevIdx][1], xs[active][1], k);
  const g = ctx.createLinearGradient(ux, 0, ux + uw, 0);
  g.addColorStop(0, "rgba(220,188,255,0)");
  g.addColorStop(0.5, "rgba(220,188,255,1)");
  g.addColorStop(1, "rgba(220,188,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(ux - 6, 48, uw + 12, 1.6);
  S.E.upload(c);
  L.push({ tex: c, x: 960, y: 1020, w: 1500, h: 70, opacity: a * 0.95, screen: true });

  // Section label, top left: index, eyebrow decoding on each downbeat.
  const sec = SECTIONS[active];
  const since = t - tb;
  // Booking and About carry their own headline; the mobile bar has its labels.
  const labelA = a * (1 - life(t, TB[4] - 0.1, END + 1, 0.2, 0.01));
  const idx = textTex("hud:idx", sec.index, { size: 64, chrome: true, w: 200, h: 100, align: "left" });
  L.push({ tex: idx, x: 108 + 100, y: 108, w: 200, h: 100, opacity: labelA, screen: true, rgb: 6 * Math.exp(-Math.max(0, since) / 0.08) });
  const ey = decodeLabel("hud:eyebrow", sec.eyebrow.length > 30 ? "BOOKING / CONSULENZA" : sec.eyebrow, clamp(since / 0.55), t, { size: 15, w: 760, h: 36, align: "left", tracking: 0.42, seed: active });
  L.push({ tex: ey, x: 196 + 380, y: 96, w: 760, h: 36, opacity: labelA, screen: true });
  const ti = textTex("hud:title", sec.title.length > 22 ? sec.word : sec.title, { size: 26, w: 760, h: 44, align: "left", tracking: 0.08, color: "#cfcfd5" });
  L.push({ tex: ti, x: 196 + 380, y: 126, w: 760, h: 44, opacity: labelA * clamp(since / 0.4), screen: true });
}

/* -------------------------------------------------------------------------- */

export function tour(t, L, cam, post) {
  if (t < PULL0 - 0.01 || t > END + 0.1) return;

  /* ---- background: the section word, far back, and dust ------------------- */
  const sec = sectionAt(t);
  const bgA = sec > 0 ? life(t, PULL0 + 0.2, TB[6] + 0.3, 0.6, 0.4) : 0;
  if (bgA > 0) {
    const word = SECTIONS[sec].word;
    const tb = sec > 0 ? TB[sec - 1] : PULL0;
    const since = t - tb;
    const k = FORGE(clamp((since + 0.15) / 0.7));
    const x = 960 + 420 - 900 * k - 26 * since;
    L.push({ tex: bigWord(word), x, y: 560, z: -1100, w: 3400, h: 560, s: 1.42, opacity: 0.35 * bgA * clamp((since + 0.15) / 0.25), blur: [80 * (1 - k), 0] });
    if (sec > 1 && since < 0.6) {
      const prev = SECTIONS[sec - 1].word;
      L.push({ tex: bigWord(prev), x: 960 - 480 - 2400 * expoIn(clamp((since + 0.2) / 0.5)), y: 560, z: -1100, w: 3400, h: 560, s: 1.42, opacity: 0.35 * bgA * (1 - clamp((since + 0.2) / 0.5)) });
    }
  }
  const dustA = life(t, PULL0, END, 0.8, 0.3);
  if (dustA > 0) L.push({ tex: dust(t, dustA, cam), x: 960, y: 540, w: 1920, h: 1080, screen: true, blend: "add" });

  /* ---- the browser ------------------------------------------------------------- */
  const pose = poseAt(t);
  const bm = node(pose);
  const content = siteContent(t);
  const bIn = clamp((t - PULL0) / 0.12);
  const leave = prog(t, TB[6] - 0.1, TB[6] + 0.55);
  if (leave < 1) {
    const plB = impulse(t, PLUCKS_ALL, 0.35);
    const lastP = PLUCKS_ALL[lastIndex(t, PLUCKS_ALL)];
    const sa = lastP ? t - lastP.t : 9;
    const shine = lastP ? { pos: lerp(-0.9, 0.9, expoOut(sa / 0.7)), width: 0.05, angle: 0.62, amt: 0.22 * Math.exp(-sa / 0.5) } : null;
    const dim = sec === 3 ? 0.62 : sec === 6 ? 0.45 : 1;
    for (const l of browserLayers(bm, content, { opacity: bIn * (1 - leave), glow: 0.1 + 0.12 * plB, shine, contentOpts: { bright: dim } })) L.push(l);
  }

  /* ---- bar gestures --------------------------------------------------------- */
  if (t >= TB[0] - 0.05 && t < TB[1] + 0.4) instagramPops(t, L, bm, pose);
  if (t >= TB[1] - 0.15 && t < TB[2] + 0.2) creazioniStory(t, L);
  if (t >= TB[2] - 0.05 && t < TB[3] + 0.45) flashDeal(t, L);
  if (t >= TB[3] - 0.15 && t < TB[4] + 0.2) merchRail(t, L);
  if (t >= TB[4] - 0.15 && t < TB[5] + 0.2) booking(t, L);
  if (t >= TB[5] - 0.15 && t < TB[6] + 0.2) about(t, L);
  if (t >= TB[6] - 0.15) mobileMontage(t, L, post);

  hud(t, L);

  /* ---- camera and post: the downbeat lands, the plucks breathe ----------------- */
  if (t >= PULL1 - 0.05) {
    const pl = impulse(t, PLUCKS_ALL, 0.12);
    const db = impulse(t, TB, 0.18);
    const [sx, sy] = shake(t, 5 * db + 1.6 * pl, 12, 33);
    cam.x = 960 + 14 * noise1(t * 0.25, 2) + sx;
    cam.y = 540 + 10 * noise1(t * 0.22, 5) + sy;
    cam.zoom = 1 + 0.01 * pl + 0.02 * db;
    cam.roll = 0.004 * noise1(t * 0.3, 8);
    // The 808 underneath breathes through the light.
    const sub = clamp(env("sub", t));
    post.ca = 0.0015 + 0.006 * pl + 0.012 * db;
    post.bloom = 0.55 + 0.2 * pl + 0.18 * sub;
    post.exposure = 1 + 0.035 * sub;
    post.flash = (post.flash ?? 0) + 0.12 * db;
    // A slice glitch on each downbeat; the loop restart (bar 7) gets the big one.
    post.glitch = (post.glitch ?? 0) + impulse(t, TB, 0.055, 0, TB.map((_, i) => (i === 3 ? 1.0 : 0.38)));
    post.glitchSeed = Math.floor(t * 30);
  }
}
