/**
 * Entry point driven by promo/scripts/render.mjs:
 *
 *   await window.ready
 *   await window.renderFrame(t, { samples })   // draws the frame for time t
 *   await window.sendFrame(url)                 // POSTs the raw RGBA pixels
 */
import { Engine } from "./lib/engine.js";
import { loadAssets } from "./assets.js";
import { init, build, prepare, samplesAt } from "./scenes/index.js";

const params = new URLSearchParams(location.search);
const scale = Number(params.get("scale") || 1);
const W = Math.round(1920 * scale);
const H = Math.round(1080 * scale);

const engine = new Engine(document.getElementById("stage"), W, H);
window.engine = engine;

window.ready = (async () => {
  await Promise.all([
    document.fonts.load('400 64px "Bodoni Moda VT"'),
    document.fonts.load('600 64px "Bodoni Moda VT"'),
    document.fonts.load('italic 400 64px "Bodoni Moda VT"'),
    document.fonts.load('300 24px "Jost VT"'),
    document.fonts.load('400 24px "Jost VT"'),
    document.fonts.load('500 24px "Jost VT"'),
  ]);
  const assets = await loadAssets(engine);
  init(engine, assets);
  return { W, H };
})();

window.renderFrame = async (t, opts = {}) => {
  const samples = opts.samples === "auto" ? samplesAt(t) : Number(opts.samples ?? 1);
  await prepare(t, samples > 1 ? 0.5 / 60 : 0);
  engine.frame(build, t, { samples, shutter: opts.shutter ?? 0.5 / 60 });
  return samples;
};

window.sendFrame = async (url) => {
  const px = engine.readPixels();
  const res = await fetch(url, { method: "POST", body: px });
  if (!res.ok) throw new Error("frame upload failed " + res.status);
};
