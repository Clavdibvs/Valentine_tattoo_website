#!/usr/bin/env node
/**
 * Turns the supplied photograph of Valentina into the portrait the About
 * section renders.
 *
 *   node scripts/build-portrait.mjs [percorso/della/foto.png]
 *
 * Requires a one-off `npm i --no-save sharp`. Only the WebP derivative under
 * `public/images/valentina/` is versioned; the multi-megabyte original stays
 * out of the repository, like every other source asset (see ASSETS.md).
 *
 * ## Why one file and not a set of widths
 *
 * The gallery and the backdrops ship hand-built width ladders because they are
 * served by a plain `<picture>`. This one is not: `PortraitFrame` renders it
 * through `next/image` with `fill`, so Next's optimizer derives and caches
 * every width the layout actually asks for. Emitting a ladder here would only
 * give the optimizer more copies of the same picture to ignore.
 *
 * The width below is chosen to be the largest the layout can ever request: the
 * frame caps at 520 CSS px, which is 1040 device pixels on a 2x screen, and the
 * `sizes` attribute can push Next to fetch the 1600 bucket on a wide viewport.
 * Anything beyond the source's own width would be upscaling, so the source
 * width is the ceiling.
 *
 * ## What is deliberately dropped
 *
 * sharp writes no metadata unless told to, so the EXIF the camera or phone
 * attached — timestamps, device, and on many phones GPS coordinates — does not
 * ship with the image. That is the right default for a photograph of a real
 * person taken in the place she works.
 *
 * ## Why quality 88 and not the 80 the other asset scripts use
 *
 * Those scripts write the file the browser downloads. This one writes the
 * master `next/image` re-encodes from, at its own quality of 75, so whatever
 * this pass throws away is thrown away a second time on top. Starting cleaner
 * costs 54 KB in the repository and nothing at all on the wire, because
 * visitors never receive this file — only the derivative Next builds from it.
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where to look when no path is given. `new references/` is the project's
 * gitignored home for source art; the repository root is where a file dropped
 * in by hand tends to land.
 */
const CANDIDATES = [
  "new references/valentine pic.png",
  "valentine pic.png",
];

/** Matches `PORTRAIT_PATHS.main` in `src/lib/portrait.ts`. */
const OUT = resolve(ROOT, "public/images/valentina/portrait.webp");

/** Upper bound on what the layout can ask for; never an upscale. */
const MAX_WIDTH = 1600;

function resolveSource() {
  const given = process.argv[2];
  if (given) {
    const path = resolve(ROOT, given);
    if (!existsSync(path)) throw new Error(`Sorgente non trovata: ${path}`);
    return path;
  }

  for (const candidate of CANDIDATES) {
    const path = resolve(ROOT, candidate);
    if (existsSync(path)) return path;
  }

  throw new Error(
    `Nessuna sorgente trovata. Cercata in:\n  ${CANDIDATES.join("\n  ")}\n` +
      `Oppure passa il percorso: node scripts/build-portrait.mjs <file>`,
  );
}

async function main() {
  const source = resolveSource();
  const input = sharp(source);
  const { width, height } = await input.metadata();

  await mkdir(dirname(OUT), { recursive: true });

  const info = await input
    .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 88, effort: 5 })
    .toFile(OUT);

  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`sorgente   ${source.replace(ROOT + "/", "")}  ${width}x${height}`);
  console.log(`portrait   ${OUT.replace(ROOT + "/", "")}  ${info.width}x${info.height}  ${kb(info.size)}`);
}

await main();
