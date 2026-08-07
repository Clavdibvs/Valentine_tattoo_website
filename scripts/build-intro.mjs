#!/usr/bin/env node
/**
 * Prepares the opening clips.
 *
 *   node scripts/build-intro.mjs
 *
 * Takes the masters from `VIDEO INIZIALI/` and writes `public/intro/`, together
 * with `intro-manifest.json` describing what came out.
 *
 * ## The speed ramp is baked in here
 *
 * It used to be applied at runtime with `video.playbackRate`, and on a phone it
 * stuttered. The masters run at 24 fps, so at the ramp's peak of ~2.9x the
 * browser is asked to present about 70 frames a second on a 60 Hz display. It
 * cannot, so it drops roughly one frame in seven — on an irregular cadence, and
 * that irregularity is what the eye reads as stutter. The file was never the
 * problem; 3.87 Mbps for 1080x1920 is perfectly healthy.
 *
 * So the ramp is applied at build time instead, by `bake-intro-ramp.swift`,
 * which resamples onto a constant 60 fps grid. The page then plays the clip at
 * 1x — no rate changes at all — and every frame lands on a refresh.
 *
 * Three things fell out of it: the clips got smaller (24 fps at 4K scaled down
 * carried a lot of redundancy the resample removes), the audio track went (the
 * clip is muted on the page, and on iOS a rate change drags the audio clock
 * into a resync of its own), and the mobile clip no longer ships the two blank
 * seconds its master opens with.
 *
 * ## What must not change
 *
 * The clip's last frame has to register exactly with the hero image, so the
 * framing is preserved: scale only, never crop or pad. The crop that makes them
 * line up is applied by the site, from `backdrop-crop.json`. The scale is exact
 * — 1080x1920 and 1920x1080, the plate sizes — because the page stretches the
 * video to fit and an off-by-one width would be a permanent slight squeeze.
 *
 * `swift` ships with the Xcode command line tools, so there is no ffmpeg
 * dependency. Elsewhere the equivalent is a `setpts` ramp plus `-r 60`.
 */

import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

const BAKER = "scripts/bake-intro-ramp.swift";
const MANIFEST = "public/intro/intro-manifest.json";
const FPS = 60;

const JOBS = [
  {
    key: "desktop",
    from: "VIDEO INIZIALI/Desktop_video.mp4",
    to: "public/intro/intro-desktop.mp4",
    startAt: 0,
  },
  {
    key: "mobile",
    from: "VIDEO INIZIALI/Mobile_video.mp4",
    to: "public/intro/intro-mobile.mp4",
    // The portrait master opens on two blank seconds. Trimming them here rather
    // than seeking past them in the browser means they are never downloaded.
    startAt: 2.6,
  },
];

await mkdir("public/intro", { recursive: true });

const manifest = {};

for (const job of JOBS) {
  if (!existsSync(job.from)) {
    console.warn(`  ! missing source: ${job.from}`);
    continue;
  }

  const { stdout } = await run("swift", [
    BAKER,
    job.from,
    job.to,
    String(job.startAt),
    String(FPS),
  ]);

  // The baker reports what it actually produced. The site reads these rather
  // than a duration written by hand: the ramp decides how long the clip runs,
  // and only the baker knows the answer to the frame.
  const [duration, frames] = stdout.trim().split(/\s+/).map(Number);
  manifest[job.key] = { duration, frames, fps: FPS };

  const mb = (statSync(job.to).size / 1048576).toFixed(2);
  const was = (statSync(job.from).size / 1048576).toFixed(2);
  console.log(
    `  ${job.to}: ${was} MB → ${mb} MB · ${duration.toFixed(3)}s · ${frames} frames @ ${FPS}fps`,
  );
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nManifest written to ${MANIFEST}.`);
console.log("Done.");
