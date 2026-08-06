/**
 * Geometry helpers for the hand-built cyber-tribal ornaments.
 *
 * Shapes are generated from parameters rather than hand-written path data so
 * the ornament family stays internally consistent and stays a small, optimized
 * SVG payload instead of a heavy raster asset.
 */

const RAD = Math.PI / 180;

export type Thorn = {
  /** Direction the spike points, in degrees. 0 = right, 90 = down. */
  angle: number;
  /** Distance from origin to tip. */
  length: number;
  /** Half-width of the spike base. */
  base: number;
  /** Perpendicular bend of the control points — gives the sickle curve. */
  bend: number;
  /** Origin offset along the spike direction (moves the base outward). */
  offset?: number;
};

/**
 * Builds a tapered, curved spike: two quadratic edges meeting at a sharp tip.
 */
export function thornPath(cx: number, cy: number, t: Thorn): string {
  const a = t.angle * RAD;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const px = -dy;
  const py = dx;
  const off = t.offset ?? 0;

  const ox = cx + dx * off;
  const oy = cy + dy * off;

  const tipX = ox + dx * t.length;
  const tipY = oy + dy * t.length;

  const b1x = ox + px * t.base;
  const b1y = oy + py * t.base;
  const b2x = ox - px * t.base;
  const b2y = oy - py * t.base;

  // Control points sit ~55% along the spike, pushed sideways by `bend`.
  const c1x = ox + dx * t.length * 0.55 + px * (t.base * 0.35 + t.bend);
  const c1y = oy + dy * t.length * 0.55 + py * (t.base * 0.35 + t.bend);
  const c2x = ox + dx * t.length * 0.55 - px * (t.base * 0.35 - t.bend);
  const c2y = oy + dy * t.length * 0.55 - py * (t.base * 0.35 - t.bend);

  return `M${r(b1x)},${r(b1y)} Q${r(c1x)},${r(c1y)} ${r(tipX)},${r(tipY)} Q${r(c2x)},${r(c2y)} ${r(b2x)},${r(b2y)} Z`;
}

/** A thin crescent used for the highlight pass sitting on top of a thorn. */
export function thornHighlight(cx: number, cy: number, t: Thorn): string {
  return thornPath(cx, cy, {
    ...t,
    length: t.length * 0.82,
    base: Math.max(t.base * 0.28, 1.2),
    bend: t.bend * 0.72,
  });
}

function r(n: number): string {
  return Math.round(n * 10) / 10 + "";
}

/**
 * The main hero sigil: a biomechanical cluster of voids wrapped in curved,
 * irregularly-spaced blades.
 *
 * Deliberately asymmetric — evenly spaced spikes read as a starburst, which is
 * the opposite of the reference's organic, hand-drawn character. Angles,
 * lengths and bends are all irregular, and the long blades sweep in a shared
 * direction so the form has a flow rather than a centre.
 *
 * Coordinates are expressed in a 620 × 820 viewBox.
 */
export const HERO_SIGIL = {
  viewBox: "0 0 620 820",
  origin: { x: 300, y: 410 },

  /** Biomechanical voids — clustered off-centre, not concentric. */
  voids: [
    { cx: 286, cy: 322, rx: 52, ry: 33, rotate: -28 },
    { cx: 356, cy: 388, rx: 40, ry: 26, rotate: -12 },
    { cx: 252, cy: 402, rx: 44, ry: 28, rotate: 16 },
    { cx: 330, cy: 476, rx: 32, ry: 20, rotate: -6 },
    { cx: 246, cy: 492, rx: 24, ry: 16, rotate: 30 },
    { cx: 386, cy: 316, rx: 21, ry: 14, rotate: -40 },
  ],

  /**
   * Long structural blades. The upper set sweeps clockwise, the lower set
   * counter-clockwise, which gives the whole mass its twist.
   */
  primary: [
    { angle: -118, length: 372, base: 34, bend: -74, offset: 30 },
    { angle: -96, length: 268, base: 22, bend: -44, offset: 44 },
    { angle: -74, length: 330, base: 28, bend: -62, offset: 32 },
    { angle: -48, length: 244, base: 20, bend: -38, offset: 46 },
    { angle: -24, length: 300, base: 26, bend: 58, offset: 34 },
    { angle: 6, length: 262, base: 22, bend: 44, offset: 42 },
    { angle: 32, length: 342, base: 29, bend: 66, offset: 30 },
    { angle: 64, length: 286, base: 24, bend: -52, offset: 38 },
    { angle: 92, length: 384, base: 33, bend: 70, offset: 28 },
    { angle: 124, length: 254, base: 21, bend: -42, offset: 44 },
    { angle: 152, length: 306, base: 26, bend: -60, offset: 32 },
    { angle: -166, length: 232, base: 19, bend: 36, offset: 48 },
    { angle: -142, length: 288, base: 24, bend: -54, offset: 36 },
  ] satisfies Thorn[],

  /** Thin whips — very long, very narrow, strongly curved. */
  whips: [
    { angle: -110, length: 396, base: 7, bend: -96, offset: 78 },
    { angle: -60, length: 356, base: 6, bend: -84, offset: 84 },
    { angle: 18, length: 372, base: 7, bend: 92, offset: 76 },
    { angle: 84, length: 404, base: 7, bend: 88, offset: 72 },
    { angle: 140, length: 330, base: 6, bend: -78, offset: 86 },
    { angle: -152, length: 300, base: 6, bend: 72, offset: 88 },
  ] satisfies Thorn[],

  /** Short counter-blades filling the negative space near the core. */
  secondary: [
    { angle: -132, length: 148, base: 12, bend: 30, offset: 62 },
    { angle: -84, length: 128, base: 10, bend: -24, offset: 70 },
    { angle: -36, length: 158, base: 12, bend: -32, offset: 58 },
    { angle: 14, length: 132, base: 10, bend: 24, offset: 72 },
    { angle: 48, length: 166, base: 13, bend: 34, offset: 56 },
    { angle: 104, length: 142, base: 11, bend: -28, offset: 66 },
    { angle: 168, length: 154, base: 12, bend: 30, offset: 60 },
  ] satisfies Thorn[],

  /**
   * Membrane webs stretched between adjacent blades — the detail that makes the
   * form read as biomechanical rather than as a star.
   */
  webs: [
    "M300,190 C356,236 392,286 404,344 C368,300 332,246 300,190 Z",
    "M470,332 C462,392 434,440 388,474 C428,424 452,380 470,332 Z",
    "M356,624 C310,588 276,540 262,486 C304,536 336,582 356,624 Z",
    "M138,466 C170,420 214,388 268,372 C216,404 172,436 138,466 Z",
    "M186,238 C232,268 266,308 284,356 C246,314 212,276 186,238 Z",
  ],

  /** Bright nodes placed on a few blade tips. */
  nodes: [
    { x: 196, y: 92, r: 3.4 },
    { x: 470, y: 176, r: 2.4 },
    { x: 552, y: 452, r: 2.8 },
    { x: 292, y: 762, r: 3.1 },
    { x: 82, y: 356, r: 2.2 },
    { x: 486, y: 664, r: 2 },
  ],
} as const;

/**
 * Corner ornament: a fan of spikes anchored to a corner, used to wrap the outer
 * edges of the layout.
 */
export const CORNER_SIGIL = {
  viewBox: "0 0 340 340",
  origin: { x: 34, y: 34 },
  spikes: [
    { angle: 18, length: 268, base: 17, bend: 34, offset: 10 },
    { angle: 42, length: 214, base: 14, bend: -26, offset: 14 },
    { angle: 66, length: 254, base: 15, bend: 30, offset: 10 },
    { angle: 34, length: 148, base: 9, bend: -18, offset: 46 },
    { angle: 56, length: 132, base: 8, bend: 16, offset: 52 },
    { angle: 8, length: 158, base: 9, bend: 20, offset: 44 },
    { angle: 80, length: 142, base: 8, bend: -16, offset: 40 },
  ] satisfies Thorn[],
  arcs: [
    "M30,120 C86,132 132,178 146,236",
    "M28,66 C122,84 208,166 232,262",
  ],
} as const;
