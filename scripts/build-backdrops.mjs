#!/usr/bin/env node
/**
 * Turns the supplied backdrop artwork into the WebP plates the site ships.
 *
 *   node scripts/build-backdrops.mjs
 *
 * Requires the source PNGs under `new references/` and a one-off
 * `npm i --no-save sharp`. Only the outputs in `public/backdrops/` are
 * versioned; the ~60 MB of sources stay out of the repository.
 *
 * ## Why the plates are cropped
 *
 * Each source image is a self-contained screen: it carries its own inset frame,
 * a hairline rule near the top and another near the bottom, plus a small centred
 * divider above the lower rule. That reads correctly as one screen.
 *
 * The site does not use them as separate screens. `PageBackdrop` stacks them
 * into one continuous strip down the whole document, and stacked frames repeat
 * as horizontal box edges every screen — which is exactly what made the
 * background look like a pile of images rather than one backdrop.
 *
 * So each plate is cropped to the band *between* its own rules. The ornaments
 * hug the left and right edges and run the full height, so the crop costs
 * nothing compositionally. The page's outer border is drawn once in CSS
 * (`.page-frame`) instead of nine times in bitmaps.
 *
 * The crop band is measured per image rather than assumed: the rules sit
 * anywhere between 81% and 99% depending on the plate.
 */

import { readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const DESKTOP_SRC = "new references/Desktop";
const MOBILE_SRC = "new references/Mobile";
const OUT = "public/backdrops";

/**
 * Where the measured crops are published for the app to read.
 *
 * The intro video has to be cropped exactly like the hero plate, so that its
 * final frame lands on the hero image with no visible shift. Rather than
 * copying magic numbers into CSS, the crop each plate actually received is
 * written here and the video reuses the hero entry.
 */
const CROP_MANIFEST = "src/content/backdrop-crop.json";
const crops = {};

const DESKTOP_NAMES = ["hero", "about", "instagram", "booking", "booking-tail"];
const MOBILE_NAMES = ["hero", "about", "instagram", "booking"];

const DESKTOP_WIDTHS = [1440, 2048, 2688];
const MOBILE_WIDTHS = [480, 760, 1080];

/** Rows this much brighter than the image median count as a drawn rule. */
const RULE_THRESHOLD = 1.5;

/**
 * Finds the horizontal rules near the top and bottom, and returns the band to
 * keep. Falls back to a conservative default when nothing is detected.
 */
async function measureCrop(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  const rows = new Array(h);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) sum += data[y * w + x];
    rows[y] = sum / w;
  }

  const median = [...rows].sort((a, b) => a - b)[Math.floor(h / 2)];
  const isRule = (y) => rows[y] > median * RULE_THRESHOLD;

  // Topmost rule inside the first 8% of the image.
  let top = 0;
  for (let y = 0; y < Math.floor(h * 0.08); y++) if (isRule(y)) top = y + 1;

  // Earliest rule in the last 25%: everything below it goes.
  let bottom = h;
  for (let y = Math.floor(h * 0.75); y < h; y++) {
    if (isRule(y)) {
      bottom = y;
      break;
    }
  }

  // A little margin so anti-aliased edges of the rules go too.
  const pad = Math.round(h * 0.012);
  top = Math.min(top + pad, Math.floor(h * 0.06));
  bottom = Math.max(bottom - pad, Math.floor(h * 0.7));

  return { top, height: bottom - top, sourceHeight: h };
}

async function buildSet(srcDir, names, widths, suffix) {
  const files = readdirSync(srcDir)
    .filter((f) => /^\d+\.png$/i.test(f))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

  for (const [index, name] of names.entries()) {
    const file = `${srcDir}/${files[index]}`;
    if (!files[index]) {
      console.warn(`  ! ${name}: no source for slot ${index + 1}`);
      continue;
    }

    const crop = await measureCrop(file);
    const kept = ((crop.height / crop.sourceHeight) * 100).toFixed(1);

    for (const width of widths) {
      await sharp(file)
        .extract({ left: 0, top: crop.top, width: (await sharp(file).metadata()).width, height: crop.height })
        .resize({ width })
        .webp({ quality: 82, effort: 6 })
        .toFile(`${OUT}/${name}-${suffix}-${width}.webp`);
    }

    crops[`${name}-${suffix}`] = {
      // Fractions of the source height, so they survive any resize.
      top: +(crop.top / crop.sourceHeight).toFixed(5),
      height: +(crop.height / crop.sourceHeight).toFixed(5),
    };

    console.log(
      `  ${name}-${suffix}: keeps ${kept}% (rows ${crop.top}–${crop.top + crop.height} of ${crop.sourceHeight})`,
    );
  }
}

await mkdir(OUT, { recursive: true });
console.log("Desktop plates:");
await buildSet(DESKTOP_SRC, DESKTOP_NAMES, DESKTOP_WIDTHS, "desktop");
console.log("Mobile plates:");
await buildSet(MOBILE_SRC, MOBILE_NAMES, MOBILE_WIDTHS, "mobile");

await writeFile(CROP_MANIFEST, JSON.stringify(crops, null, 2) + "\n");
console.log(`\nCrops written to ${CROP_MANIFEST}.`);
console.log("Done.");
