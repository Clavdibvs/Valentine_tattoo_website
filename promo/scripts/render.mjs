/**
 * Renders the promo composition frame by frame and encodes it.
 *
 *   node promo/scripts/render.mjs [options]
 *
 *   --audio=<mp3>        source track (needed for the final mux)
 *   --out=<mp4>          output file (default promo/out/valentine-tattoo-promo.mp4)
 *   --from=0 --to=31     time range in seconds
 *   --fps=60             frame rate
 *   --format=16x9        16x9 (1920×1080) or 9x16 (1080×1920)
 *   --scale=1            0.5 renders a half-size preview of the same framing
 *   --samples=auto       motion-blur subframes per frame (180° shutter); "auto"
 *                        uses scenes/index.js samplesAt(): 4 on fast moves, 2–3 elsewhere
 *   --stills=5.6,8.3     render only these times to PNG (in --outdir)
 *   --outdir=<dir>       where stills go
 *   --workers=1          parallel browsers, each rendering a slice
 *   --crf=14             quality of the rendered file (the master)
 *   --deliver=<mp4>      also encode a delivery copy of --out, sized for sharing
 *   --encode-only        skip rendering: only make the --deliver copy of --out
 *
 * The page renders each frame as a pure function of its time, reads the pixels
 * back and POSTs them here as raw RGBA; they are piped straight into ffmpeg.
 * Nothing is captured from the screen and nothing depends on wall-clock time.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Playwright from the project if it is installed there, else the global install. */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return import(pathToFileURL(path.join(root, "playwright", "index.mjs")).href);
  }
}
const { chromium } = await loadPlaywright();
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "1"];
  }),
);
const FPS = Number(args.fps ?? 60);
const SCALE = Number(args.scale ?? 1);
const SAMPLES = args.samples === "auto" ? "auto" : Number(args.samples ?? 1);
const FROM = Number(args.from ?? 0);
const TO = Number(args.to ?? 31);
const WORKERS = Number(args.workers ?? 1);
const FORMAT = args.format === "9x16" ? "9x16" : "16x9";
const [FW, FH] = FORMAT === "9x16" ? [1080, 1920] : [1920, 1080];
const W = Math.round(FW * SCALE), H = Math.round(FH * SCALE);
const OUT = path.resolve(ROOT, args.out ?? `promo/out/valentine-tattoo-promo-${FORMAT}.mp4`);
const AUDIO = args.audio ? path.resolve(args.audio) : null;
/**
 * Audio fade, constant power, 28.9 → 30.9 s. The picture fades 29.15 → 30.9
 * (scenes/final.js FADE): sound and image reach silence and black together,
 * with the bar-12 kick (30.26 s) still heard as a last, dim pulse.
 */
const AUDIO_FADE = { start: 28.9, duration: 2.0 };

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp",
  ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".mp4": "video/mp4", ".svg": "image/svg+xml",
};

/* ---- the opening clip, as frames the page can load one by one --------------- */
function extractIntroFrames() {
  for (const [clip, dir, last] of [["intro-desktop.mp4", "intro", "f243.jpg"], ["intro-mobile.mp4", "intro-mobile", "f197.jpg"]]) {
    const out = path.join(ROOT, "promo", ".cache", dir);
    if (fs.existsSync(path.join(out, last))) continue;
    fs.mkdirSync(out, { recursive: true });
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(ROOT, "public/intro", clip), "-q:v", "2", path.join(out, "f%03d.jpg")]);
    if (r.status !== 0) throw new Error("intro frame extraction failed: " + r.stderr);
  }
}

/* ---- static server + frame sink ---------------------------------------------- */
function startServer(onFrame) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/frame") {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        await onFrame(Number(url.searchParams.get("i")), Buffer.concat(chunks), url.searchParams.get("w"));
        res.writeHead(200);
        res.end("ok");
      });
      return;
    }
    const file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => console.error("[page]", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("[console]", m.text()); });
  await page.goto(`http://127.0.0.1:${port}/promo/composition/index.html?scale=${SCALE}&format=${FORMAT}`);
  await page.evaluate(() => window.ready);
  return page;
}

function launch() {
  return chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox"] });
}

/** One PNG per requested time. */
async function renderStills(times, outdir) {
  fs.mkdirSync(outdir, { recursive: true });
  const pending = new Map();
  const server = await startServer(async (i, buf) => {
    const t = times[i];
    const file = path.join(outdir, `t${t.toFixed(3).padStart(7, "0")}.png`);
    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", "-", "-vf", "vflip", file]);
      ff.on("close", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg still failed"))));
      ff.stdin.end(buf);
    });
    pending.set(i, file);
  });
  const browser = await launch();
  const page = await openPage(browser, server.address().port);
  for (let i = 0; i < times.length; i++) {
    const t0 = Date.now();
    await page.evaluate(async ({ t, i, samples }) => {
      await window.renderFrame(t, { samples });
      await window.sendFrame(`/frame?i=${i}`);
    }, { t: times[i], i, samples: SAMPLES });
    console.log(`still t=${times[i]}  ${Date.now() - t0} ms`);
  }
  await browser.close();
  server.close();
}

/**
 * A key for everything that changes the pixels: the composition source, the
 * audio map, the captures, and the size, rate, motion blur and quality. Chunks
 * live under it, so a code change can never splice stale chunks into a render.
 */
function cacheKey() {
  const h = createHash("sha1");
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const f = path.join(dir, name);
      const st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else if (dir.includes("captures")) h.update(`${f}:${st.size}:${st.mtimeMs}`);
      else h.update(fs.readFileSync(f));
    }
  };
  walk(path.join(ROOT, "promo", "composition"));
  walk(path.join(ROOT, "promo", "captures"));
  h.update(JSON.stringify({ FORMAT, W, H, FPS, SAMPLES, crf: args.crf ?? 14 }));
  return h.digest("hex").slice(0, 12);
}

/**
 * Encodes [FROM, TO) to OUT. The film is rendered as two-second chunks kept on
 * disk; chunks already rendered are skipped, so a render cut short (a restart,
 * a crash) resumes where it stopped instead of starting over. `WORKERS`
 * browsers take chunks from one queue.
 */
async function renderVideo() {
  const first = Math.round(FROM * FPS), last = Math.round(TO * FPS);
  const dir = path.join(ROOT, "promo", ".cache", "chunks", cacheKey());
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const CHUNK = Math.round(2 * FPS);
  const chunks = [];
  for (let a = first; a < last; a += CHUNK) {
    chunks.push({ a, b: Math.min(last, a + CHUNK), file: path.join(dir, `c${String(a).padStart(5, "0")}.mp4`) });
  }
  const queue = chunks.filter((c) => !fs.existsSync(c.file));
  const total = queue.reduce((n, c) => n + c.b - c.a, 0);
  console.log(`${chunks.length - queue.length}/${chunks.length} chunks already rendered in ${path.relative(ROOT, dir)}`);

  const encoders = new Map();
  const startEncoder = (w, file) => {
    const ff = spawn("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
      "-vf", "vflip,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(args.crf ?? 14), "-tune", "film",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      "-g", String(FPS), "-bf", "2",
      file,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    encoders.set(w, ff);
    return ff;
  };

  let done = 0;
  const t0 = Date.now();
  const server = await startServer(async (i, buf, w) => {
    const ff = encoders.get(Number(w));
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    done++;
    if (done % 30 === 0 || done === total) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${done}/${total} frames  ${((el / done) * 1000).toFixed(0)} ms/frame  eta ${(((total - done) * el) / done / 60).toFixed(1)} min   `);
    }
  });
  const port = server.address().port;

  await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, async (_, w) => {
    const browser = await launch();
    const page = await openPage(browser, port);
    for (let c = queue.shift(); c; c = queue.shift()) {
      const part = c.file.replace(/\.mp4$/, ".part.mp4");
      const ff = startEncoder(w, part);
      for (let f = c.a; f < c.b; f++) {
        await page.evaluate(async ({ t, f, samples, w }) => {
          await window.renderFrame(t, { samples });
          await window.sendFrame(`/frame?i=${f}&w=${w}`);
        }, { t: f / FPS, f, samples: SAMPLES, w });
      }
      await new Promise((r) => { ff.on("close", r); ff.stdin.end(); });
      fs.renameSync(part, c.file);
    }
    await browser.close();
  }));
  server.close();
  if (total) console.log(`\nrendered ${total} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min`);

  // Join the chunks, then lay the track under them with the fade-out.
  const list = path.join(dir, "list.txt");
  fs.writeFileSync(list, chunks.map((c) => `file '${c.file}'`).join("\n"));
  const silent = path.join(dir, "video.mp4");
  run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);
  if (!AUDIO) {
    fs.copyFileSync(silent, OUT);
    console.log("wrote (no audio)", OUT);
    return;
  }
  const dur = (last - first) / FPS;
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", silent, "-ss", String(FROM), "-t", String(dur), "-i", AUDIO,
    "-map", "0:v", "-map", "1:a", "-c:v", "copy",
    "-af", `afade=t=out:st=${AUDIO_FADE.start - FROM}:d=${AUDIO_FADE.duration}:curve=qsin`,
    "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", "-shortest", OUT,
  ]);
  console.log("wrote", OUT);
}

/**
 * The delivery copy: the master re-encoded under a 12 Mbit/s cap, which keeps
 * the 31 s film under ~45 MB while the grain survives (grain is what eats the
 * bits; -tune grain stops x264 from smoothing it into blotches).
 */
function deliver(master, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", master,
    "-c:v", "libx264", "-preset", "slower", "-crf", "17", "-maxrate", "12M", "-bufsize", "24M", "-tune", "grain",
    "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:a", "copy", "-movflags", "+faststart", target,
  ]);
  console.log("wrote", target, (fs.statSync(target).size / 1e6).toFixed(1), "MB");
}

function run(cmd, a) {
  const r = spawnSync(cmd, a, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} failed`);
}

(async () => {
  if (args["encode-only"]) {
    deliver(OUT, path.resolve(ROOT, args.deliver));
    return;
  }
  extractIntroFrames();
  if (args.stills) {
    const times = args.stills.split(",").map(Number);
    await renderStills(times, path.resolve(args.outdir ?? path.join(ROOT, "promo", ".cache", "stills")));
  } else {
    await renderVideo();
    if (args.deliver) deliver(OUT, path.resolve(ROOT, args.deliver));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
