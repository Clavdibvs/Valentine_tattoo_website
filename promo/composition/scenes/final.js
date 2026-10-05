/**
 * Bar 11 → end (27.52 → 31.0 s): the kick enters four on the floor.
 *
 * The phone's push ends in a white-out timed to land on the first kick; the
 * logo lockup slams in under it. Each kick pulses the mark and sweeps a glint
 * across it while the address decodes — then picture and sound fade together.
 */

import * as D from "../lib/draw2d.js";
import { bar, KICKS, plucksInBar, impulse, prog, clamp, lerp, FORGE, expoOut, expoIn, INOUT, shake } from "../lib/timing.js";
import { S, textTex, decodeLabel, dust } from "./common.js";

export const FINAL = bar(11);
export const END = 31.0;
/** The picture fades over the last two kicks; the audio fade is in render.mjs. */
export const FADE = [29.15, 30.9];

export function final(t, L, cam, post) {
  const P10 = plucksInBar(10);
  const pre = P10[P10.length - 1].t;           // the last pluck before the kick
  if (t < pre - 0.2) return;

  // White-out building into the kick, then released by it.
  if (t < FINAL) {
    post.flash = (post.flash ?? 0) + 1.1 * expoIn(prog(t, pre, FINAL));
    return;
  }
  const since = t - FINAL;
  const kick = impulse(t, KICKS, 0.16);
  const kickSoft = impulse(t, KICKS, 0.45);
  const [sx, sy] = shake(t, 12 * Math.exp(-since / 0.2) + 3 * kick, 13, 41);
  const push = 1 + 0.05 * INOUT(prog(t, FINAL, END)) + 0.012 * kick;
  cam.x = 960 + sx;
  cam.y = 540 + sy;
  cam.zoom = push;
  cam.roll = 0;
  cam.rx = 0;
  cam.ry = 0;

  /* ---- backdrop ------------------------------------------------------------ */
  {
    const bd = S.A.bd_about;
    const w = 1920 * 1.1;
    const s = 1.18 - 0.16 * FORGE(prog(t, FINAL, FINAL + 1.6));
    L.push({ tex: bd, x: 960, y: 540, w, h: (w * bd.h) / bd.w, s, blend: "screen", opacity: 0.85 * clamp(since / 0.1), bright: 0.85 + 0.6 * kick });
    L.push({ tex: S.dotViolet, x: 960, y: 470, w: 1500, h: 1100, blend: "add", opacity: 0.25 + 0.3 * kickSoft });
    L.push({ tex: dust(t, 0.9), x: 960, y: 540, w: 1920, h: 1080, screen: true, blend: "add" });
  }

  /* ---- shock ring on the kick that opens the section -------------------------- */
  {
    const p = prog(t, FINAL, FINAL + 0.8);
    if (p < 1) L.push({ tex: S.ring, x: 960, y: 430, w: 150 + 2600 * expoOut(p), h: 150 + 2600 * expoOut(p), blend: "add", opacity: 0.8 * (1 - p) ** 2 });
  }

  /* ---- the mark ------------------------------------------------------------- */
  const lastK = KICKS.filter((k) => k <= t + 1e-4).length - 1;
  const ka = lastK >= 0 ? t - KICKS[lastK] : 9;
  const sweep = (dir) => ({ pos: dir * lerp(-0.8, 0.8, expoOut(ka / 0.55)), width: 0.07, angle: 0.42, amt: 1.2 * Math.exp(-ka / 0.55) });
  {
    const k = FORGE(prog(t, FINAL, FINAL + 0.65));
    const s = lerp(1.9, 1, k) * (1 + 0.03 * kick);
    const H = 236 * s, W = (H * 201) / 288;
    L.push({ tex: S.dot, x: 960, y: 312, w: 560 * (1 + kickSoft * 0.3), h: 560 * (1 + kickSoft * 0.3), blend: "add", opacity: 0.12 + 0.22 * kickSoft });
    L.push({ tex: S.A.logo, x: 960, y: 312, w: W, h: H, opacity: clamp(since / 0.04), rgb: 14 * Math.exp(-since / 0.1) + 4 * kick, shine: sweep(lastK % 2 ? -1 : 1), bright: 1.05 + 0.2 * kick });
  }
  {
    const p = prog(t, FINAL + 0.06, FINAL + 0.75);
    const W = 880 * (1 + 0.015 * kick), H = (W * 640) / 1400;
    L.push({
      tex: S.A.wordmark, x: 960, y: 610, w: W, h: H, reveal: { type: "center", p: FORGE(p), soft: 0.25, angle: 0 },
      shine: sweep(lastK % 2 ? 1 : -1), rgb: 6 * Math.exp(-since / 0.1), blur: [40 * (1 - FORGE(p)), 0],
    });
  }

  /* ---- address and handle ------------------------------------------------------- */
  {
    const line = S.E.canvas("final:line", 1100, 20);
    line.ctx.clearRect(0, 0, 1100, 20);
    D.hairline(line.ctx, 0, 1100, 10, FORGE(prog(t, FINAL + 0.2, FINAL + 1.3)), { alpha: 1.2, width: 1.2 });
    D.sigilStar(line.ctx, 550, 10, 16, { alpha: clamp((t - FINAL - 0.6) / 0.3) });
    S.E.upload(line);
    L.push({ tex: line, x: 960, y: 838, w: 1100, h: 20 });
    const url = decodeLabel("final:url", "VALENTINETATTOO.IT", prog(t, KICKS[1] - 0.05, KICKS[1] + 0.75), t, { size: 36, w: 1400, h: 70, tracking: 0.36, weight: 500, color: "#f2f2f5", seed: 21 });
    L.push({ tex: url, x: 960, y: 900, w: 1400, h: 70, shine: { pos: lerp(-0.8, 0.8, expoOut((t - KICKS[2]) / 0.8)), width: 0.06, angle: 0.2, amt: t > KICKS[2] ? 0.8 * Math.exp(-(t - KICKS[2]) / 0.7) : 0 } });
    const handle = textTex("final:handle", "@valentine.ttt  ·  Triggiano (BA)  ·  Crossbone Studio", { family: D.SANS, size: 21, weight: 300, tracking: 0.16, color: "#b4b4bb", w: 1400, h: 50 });
    L.push({ tex: handle, x: 960, y: 958, w: 1400, h: 50, opacity: clamp((t - KICKS[2]) / 0.4) });
  }

  post.flash = (post.flash ?? 0) + 1.0 * Math.exp(-since / 0.12) + 0.12 * kick;
  post.zoomBlur = 0.2 * Math.exp(-since / 0.14);
  post.ca = 0.0015 + 0.02 * Math.exp(-since / 0.2) + 0.005 * kick;
  post.bloom = 0.62 + 0.3 * kick;
  post.distort = -0.06 * Math.exp(-since / 0.2);
  post.glitch = 0.7 * Math.exp(-since / 0.08);
  post.glitchSeed = Math.floor(t * 30);
}
