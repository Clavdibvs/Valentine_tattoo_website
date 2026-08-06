#!/usr/bin/env node
/**
 * Turns the exported Instagram media into the optimized assets the galleries
 * ship, and writes the manifest the site reads.
 *
 *   npm i --no-save sharp
 *   node scripts/build-gallery.mjs
 *
 * ## Input
 *
 * `public/instagram-media/` as exported from Instagram:
 *
 *   posts/post-NN/media_NN.jpg          one file per feed post
 *   highlights/<collection>/story_NN.*  images and videos per highlight
 *
 * ## Output
 *
 *   public/gallery/<set>/<id>-{400,800,1200}.webp   still frames
 *   public/gallery/<set>/<id>.mp4                   the original video, copied
 *   src/content/gallery-manifest.json               what the site reads
 *
 * ## Why videos become poster frames
 *
 * The galleries are grids and carousels of up to twelve items. Autoplaying a
 * dozen videos is exactly what the brief rules out, and on a phone it would be
 * an unreasonable amount of data. Each video therefore contributes a poster
 * frame plus the media-type badge the card already draws for Reels, and the
 * card links out to the real post or highlight, where the video plays.
 *
 * Poster frames come from QuickLook (`qlmanage`), which is present on every
 * macOS install — no ffmpeg dependency. On other platforms install ffmpeg and
 * swap `posterFromVideo` for a single `ffmpeg -ss 0 -frames:v 1` call.
 */

import { execFile } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, copyFile, rm, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);

/** Ship the source videos too. Off by default — see the copy below. */
const WITH_VIDEO = process.argv.includes("--with-video");

const SRC = "public/instagram-media";
const OUT = "public/gallery";
const MANIFEST = "src/content/gallery-manifest.json";
const TMP = ".gallery-tmp";

const WIDTHS = [400, 800, 1200];
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v"]);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);

/** Extracts a still from a video using macOS QuickLook. */
async function posterFromVideo(file) {
  await mkdir(TMP, { recursive: true });
  await run("qlmanage", ["-t", "-s", "1200", "-o", TMP, file]);
  const produced = readdirSync(TMP).find((f) => f.startsWith(basename(file)));
  if (!produced) throw new Error(`no poster produced for ${file}`);
  return join(TMP, produced);
}

/** Emits the three WebP widths and reports the intrinsic aspect ratio. */
async function emitStills(source, outDir, id) {
  const meta = await sharp(source).metadata();
  for (const width of WIDTHS) {
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(join(outDir, `${id}-${width}.webp`));
  }
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .sort();
}

/**
 * A "set" is one gallery: the feed, or one of the three highlights.
 * Returns the manifest entries for it.
 */
async function buildSet({ id, sourceDir, mode }) {
  const outDir = join(OUT, id);
  await mkdir(outDir, { recursive: true });

  /** Each item is either a post folder (feed) or a file (highlight). */
  const units =
    mode === "posts"
      ? listFiles(sourceDir)
          .filter((entry) => statSync(join(sourceDir, entry)).isDirectory())
          .map((folder) => {
            const inner = listFiles(join(sourceDir, folder));
            const pick =
              inner.find((f) => IMAGE_EXT.has(extname(f).toLowerCase())) ?? inner[0];
            return { key: folder, file: pick ? join(sourceDir, folder, pick) : null };
          })
          .filter((u) => u.file)
      : listFiles(sourceDir).map((f) => ({
          key: basename(f, extname(f)),
          file: join(sourceDir, f),
        }));

  const items = [];

  for (const [index, unit] of units.entries()) {
    const ext = extname(unit.file).toLowerCase();
    const isVideo = VIDEO_EXT.has(ext);
    const itemId = String(index + 1).padStart(2, "0");

    let stillSource = unit.file;
    let poster = null;

    if (isVideo) {
      poster = await posterFromVideo(unit.file);
      stillSource = poster;
      // The originals are 24 MB and nothing plays them: the cards show a poster
      // and link out, exactly as they do for API-sourced Reels. Pass
      // `--with-video` to ship them alongside, for when a player is added.
      if (WITH_VIDEO) await copyFile(unit.file, join(outDir, `${itemId}.mp4`));
    }

    const { width, height } = await emitStills(stillSource, outDir, itemId);

    items.push({
      id: `${id}-${itemId}`,
      src: `/gallery/${id}/${itemId}`,
      width,
      height,
      mediaType: isVideo ? "REELS" : "IMAGE",
      ...(isVideo && WITH_VIDEO ? { video: `/gallery/${id}/${itemId}.mp4` } : {}),
    });

    process.stdout.write(`\r  ${id}: ${items.length}/${units.length}   `);
  }

  process.stdout.write(`\r  ${id}: ${items.length} items\n`);
  return items;
}

/* -------------------------------------------------------------------------- */

await rm(OUT, { recursive: true, force: true });
await rm(TMP, { recursive: true, force: true });

const sets = [
  { id: "feed", sourceDir: join(SRC, "posts"), mode: "posts" },
  { id: "creazioni", sourceDir: join(SRC, "highlights/creazioni"), mode: "files" },
  { id: "flash", sourceDir: join(SRC, "highlights/flash"), mode: "files" },
  { id: "merch", sourceDir: join(SRC, "highlights/merch"), mode: "files" },
];

const manifest = {};
for (const set of sets) {
  manifest[set.id] = await buildSet(set);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
await rm(TMP, { recursive: true, force: true });

const total = Object.values(manifest).reduce((n, items) => n + items.length, 0);
console.log(`\nManifest written to ${MANIFEST} — ${total} items across ${sets.length} sets.`);
