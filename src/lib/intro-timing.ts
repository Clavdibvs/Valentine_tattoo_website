/**
 * Timing and playback shape for the opening clip.
 *
 * Deliberately separate from `intro.ts`: that module reads the filesystem to
 * decide whether a clip exists, which makes it server-only, while these values
 * are needed by the client component that plays it. Keeping them apart stops
 * `node:fs` being dragged into the browser bundle.
 */

export type IntroCrop = { top: number; height: number };

export type IntroConfig = {
  desktop: string | null;
  mobile: string | null;
  cropDesktop: IntroCrop;
  cropMobile: IntroCrop;
};

/**
 * Playback shape.
 *
 * The clips run 7 seconds but should be over in 4. A cut would be obvious, so
 * the first stretch is played fast and slows down into real time:
 *
 *   video 0 → 5s   in 2 real seconds, rate falling smoothly from 4× to 1×
 *   video 5 → end  at 1×, so the last stretch plays exactly as filmed
 *
 * The rate falls *linearly in time*, which is what reads as a ramp rather than
 * a gear change. For a linear fall from r₀ to 1 over 2 seconds, the video time
 * covered is (r₀ + 1) — so r₀ = 4 gives precisely the 5 seconds wanted.
 *
 * Rather than tracking elapsed real time and hoping the browser keeps up, the
 * rate is derived from where the video actually is:
 *
 *   rate(v) = √(16 − 3v)      for v ≤ 5      (4× at v=0, 1× at v=5)
 *
 * which is the same curve solved for video position, and self-correcting: any
 * drift in playback feeds straight back into the next frame's rate.
 */
export const INTRO_TIMING = {
  /** Video position, in seconds, where the ramp ends and real time begins. */
  rampUntil: 5,
  /** Rate at the very start. See the derivation above. */
  startRate: 4,
  /**
   * The hero starts appearing when the ramp ends — the moment the clip settles
   * into real time is the natural beat for it, and it leaves the whole
   * real-time tail for the content to arrive over.
   */
  cueAtVideoTime: 5,
  /** Crossfade length, in seconds. Timed to *end* as the clip does. */
  fade: 1.2,
  /** Nominal clip length. Only a safety net: playback drives the real timing. */
  duration: 7.05,
} as const;

/** The playback rate for a given position in the clip. */
export function introRateAt(videoTime: number): number {
  if (videoTime >= INTRO_TIMING.rampUntil) return 1;
  // Derived from a linear rate fall; see INTRO_TIMING.
  return Math.max(1, Math.sqrt(INTRO_TIMING.startRate ** 2 - 3 * videoTime));
}
