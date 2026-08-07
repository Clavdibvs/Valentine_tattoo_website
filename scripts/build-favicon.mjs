#!/usr/bin/env node
/**
 * Builds the app icon set from the supplied logo artwork.
 *
 *   node scripts/build-favicon.mjs
 *
 * Requires `new references/Logo valentine no background.png` and a one-off
 * `npm i --no-save sharp`. Outputs land in `src/app/` where Next's file
 * conventions pick them up automatically (`favicon`, `icon`, `apple-icon`) —
 * no <link> tags are written by hand.
 *
 * ## Why the mark sits on a black tile
 *
 * The source logo is chrome — a near-white sigil with a soft white glow and a
 * transparent background. That is the right artwork for the site, whose page
 * is black, but it is the wrong artwork for a favicon: Google renders favicons
 * on the white search-results background and Chrome renders them on a light
 * tab strip, where a silver-on-transparent mark all but disappears at 16px.
 *
 * So every icon is composited onto an opaque tile in the site's own black
 * (--theme-color). The mark keeps its glow, which reads as a halo against the
 * tile and holds the silhouette together at small sizes.
 *
 * The tile is a full square, never pre-rounded: iOS applies its own corner
 * mask to `apple-icon`, and rounding twice leaves a visible dark fringe.
 *
 * ## Why these sizes
 *
 * Google requires the favicon to be square and a multiple of 48px, so the ICO
 * carries a 48x48 entry (alongside 16 and 32 for browser chrome) and the PNG
 * icon is 192 = 48x4. `apple-icon` is 180, the size iOS asks for.
 *
 * The ICO entries are written as 32-bit BGRA DIBs rather than embedded PNGs:
 * both are legal, but the DIB form is the one every ICO parser ever shipped
 * can read, and at these sizes it costs a few KB.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "new references/Logo valentine no background.png");
const APP = resolve(ROOT, "src/app");

/** The site's black — kept in sync with `viewport.themeColor` in layout.tsx. */
const TILE = { r: 5, g: 5, b: 5, alpha: 1 };

/**
 * Share of the tile height the mark occupies.
 *
 * The mark is tall and narrow (roughly 0.7:1), so it is always height-bound
 * and the side margins come out generously on their own. `apple` leaves more
 * room because iOS crops to a rounded square.
 */
const FILL = { icon: 0.92, apple: 0.8 };

/** ICO entries. 48 is the size Google indexes; 16 and 32 are for browser UI. */
const ICO_SIZES = [16, 32, 48];
const ICON_PNG_SIZE = 192;
const APPLE_PNG_SIZE = 180;

/**
 * Trims the artwork to its own ink.
 *
 * The source is a 1024² canvas with the sigil inset in it. Compositing that
 * canvas directly would bake its padding into every icon on top of ours, so
 * the alpha bounding box is measured once and the mark is cut out of it.
 */
async function loadMark() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // Ignore the faintest glow pixels: they extend the box without adding
      // anything the eye can see once the icon is 16px wide.
      if (data[(y * width + x) * channels + 3] <= 8) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) throw new Error(`${SRC} has no visible pixels`);

  return sharp(SRC)
    .ensureAlpha()
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 });
}

/**
 * Renders one square icon: mark scaled to `fill` of the height, centred on the
 * black tile.
 *
 * Small icons are then lifted and sharpened. The sigil is drawn in hairline
 * strokes, so reducing it to 16px averages most of them with the black tile
 * behind and the whole mark comes out a muddy grey. `linear` stretches that
 * back apart — the tile is dark enough to stay black through it (5 -> 4) while
 * the strokes recover their silver — and the sharpen re-establishes the edges
 * the reduction softened. Above 64px the detail survives on its own and the
 * same treatment would only clip the highlights.
 */
async function renderIcon(mark, size, fill) {
  const markHeight = Math.round(size * fill);
  const scaled = await mark
    .clone()
    .resize({ height: markHeight, fit: "inside", kernel: "lanczos3" })
    .toBuffer();

  const tile = sharp({
    create: { width: size, height: size, channels: 4, background: TILE },
  }).composite([{ input: scaled, gravity: "center" }]);

  if (size > 64) return tile;

  // Re-wrapped so the adjustments run on the composite rather than being
  // folded into the create/composite pipeline.
  return sharp(await tile.png().toBuffer())
    .linear(1.8, -5)
    .sharpen({ sigma: 0.8 });
}

/**
 * Packs raw BGRA frames into an .ico container.
 *
 * Each entry is a BITMAPINFOHEADER whose height is doubled to account for the
 * legacy AND mask, followed by the bottom-up colour rows and then the mask
 * itself. The mask is all zeroes — the 32-bit alpha already carries opacity —
 * but it is not optional: parsers read the declared byte count and a missing
 * mask truncates the entry.
 */
function packIco(frames) {
  const HEADER = 6;
  const ENTRY = 16;
  const DIB_HEADER = 40;

  const images = frames.map(({ size, data }) => {
    const maskStride = (((size + 31) >> 5) << 2); // 1bpp rows padded to 4 bytes
    const xorSize = size * size * 4;
    const andSize = maskStride * size;

    const buf = Buffer.alloc(DIB_HEADER + xorSize + andSize);
    buf.writeUInt32LE(DIB_HEADER, 0); // biSize
    buf.writeInt32LE(size, 4); // biWidth
    buf.writeInt32LE(size * 2, 8); // biHeight — colour rows + mask rows
    buf.writeUInt16LE(1, 12); // biPlanes
    buf.writeUInt16LE(32, 14); // biBitCount
    buf.writeUInt32LE(0, 16); // biCompression = BI_RGB
    buf.writeUInt32LE(xorSize + andSize, 20); // biSizeImage

    for (let y = 0; y < size; y += 1) {
      // DIBs are stored bottom-up.
      const src = (size - 1 - y) * size * 4;
      let dst = DIB_HEADER + y * size * 4;
      for (let x = 0; x < size; x += 1) {
        const p = src + x * 4;
        buf[dst++] = data[p + 2]; // B
        buf[dst++] = data[p + 1]; // G
        buf[dst++] = data[p]; // R
        buf[dst++] = data[p + 3]; // A
      }
    }

    return buf;
  });

  const out = Buffer.alloc(HEADER + ENTRY * images.length);
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type: icon
  out.writeUInt16LE(images.length, 4);

  let offset = out.length;
  images.forEach((image, i) => {
    const { size } = frames[i];
    const at = HEADER + i * ENTRY;
    out.writeUInt8(size === 256 ? 0 : size, at); // 0 means 256
    out.writeUInt8(size === 256 ? 0 : size, at + 1);
    out.writeUInt8(0, at + 2); // palette entries
    out.writeUInt8(0, at + 3); // reserved
    out.writeUInt16LE(1, at + 4); // planes
    out.writeUInt16LE(32, at + 6); // bit count
    out.writeUInt32LE(image.length, at + 8);
    out.writeUInt32LE(offset, at + 12);
    offset += image.length;
  });

  return Buffer.concat([out, ...images]);
}

async function main() {
  const mark = await loadMark();
  await mkdir(APP, { recursive: true });

  const frames = [];
  for (const size of ICO_SIZES) {
    const { data } = await (await renderIcon(mark, size, FILL.icon))
      .raw()
      .toBuffer({ resolveWithObject: true });
    frames.push({ size, data });
  }

  const ico = resolve(APP, "favicon.ico");
  await writeFile(ico, packIco(frames));
  console.log(`favicon.ico       ${ICO_SIZES.join(", ")}`);

  const icon = await (await renderIcon(mark, ICON_PNG_SIZE, FILL.icon))
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(resolve(APP, "icon.png"), icon);
  console.log(`icon.png          ${ICON_PNG_SIZE}x${ICON_PNG_SIZE}`);

  const apple = await (await renderIcon(mark, APPLE_PNG_SIZE, FILL.apple))
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(resolve(APP, "apple-icon.png"), apple);
  console.log(`apple-icon.png    ${APPLE_PNG_SIZE}x${APPLE_PNG_SIZE}`);
}

await main();
