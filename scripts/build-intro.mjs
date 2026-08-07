#!/usr/bin/env node
/**
 * Prepares the opening clips.
 *
 *   node scripts/build-intro.mjs
 *
 * Takes the masters from `VIDEO INIZIALI/` and writes `public/intro/`.
 *
 * ## Why re-encode
 *
 * The masters are 4K (3836×2160 and 2160×3836) — far beyond any display size
 * the clip is shown at, and the clip is the very first thing the browser has to
 * fetch. Re-encoding to 1080p costs 5.6 MB instead of 7.4 on desktop with no
 * visible loss: measured against the hero image it still lands within 7% on
 * detail, and the crossfade covers that.
 *
 * `avconvert` ships with macOS, so there is no ffmpeg dependency. Elsewhere:
 *
 *   ffmpeg -i in.mp4 -vf scale=-2:1080 -c:v libx264 -crf 22 -movflags +faststart -an out.mp4
 *
 * ## What must not change
 *
 * The clip's last frame has to register exactly with the hero image, so the
 * framing must be preserved: scale only, never crop or pad. The crop that makes
 * them line up is applied by the site, from `backdrop-crop.json`.
 */

import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

const JOBS = [
  { from: "VIDEO INIZIALI/Desktop_video.mp4", to: "public/intro/intro-desktop.mp4" },
  { from: "VIDEO INIZIALI/Mobile_video.mp4", to: "public/intro/intro-mobile.mp4" },
];

await mkdir("public/intro", { recursive: true });

for (const job of JOBS) {
  if (!existsSync(job.from)) {
    console.warn(`  ! missing source: ${job.from}`);
    continue;
  }
  // Preset1920x1080 keeps the aspect ratio, so the portrait master comes out
  // 1080×1920 rather than being letterboxed into a landscape frame.
  await run("avconvert", ["-s", job.from, "-p", "Preset1920x1080", "-o", job.to, "--replace"]);
  const mb = (statSync(job.to).size / 1048576).toFixed(1);
  const was = (statSync(job.from).size / 1048576).toFixed(1);
  console.log(`  ${job.to}: ${was} MB → ${mb} MB`);
}

console.log("\nDone.");
