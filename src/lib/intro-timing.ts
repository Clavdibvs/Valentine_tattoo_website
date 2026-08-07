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
  /** Real length of each cut, in seconds, as built. See `INTRO_TIMING`. */
  durationDesktop: number;
  durationMobile: number;
};

/**
 * Playback shape.
 *
 * The masters run 7 seconds and should be over in about 4. A cut would be
 * obvious, so the opening stretch is played fast and slows into real time:
 *
 *   clip 0 → 5s   in 2 seconds, rate falling smoothly from 4x to 1x
 *   clip 5 → end  at 1x, so the last stretch plays exactly as filmed
 *
 * ## The ramp is not applied here any more
 *
 * It used to be, through `video.playbackRate` on every animation frame. It was
 * correct and it still stuttered on a phone: the masters are 24 fps, so at the
 * peak of the ramp the browser was being asked to present about 70 frames a
 * second on a 60 Hz display. It could only answer by dropping frames, and it
 * dropped them unevenly — which is what the eye reads as stutter.
 *
 * The ramp now lives in the files themselves, resampled onto a constant 60 fps
 * grid by `scripts/bake-intro-ramp.swift`. The clips play at 1x, untouched, and
 * the arithmetic above survives only as the specification that script applies.
 *
 * What is left here is what the page still decides.
 */
export const INTRO_TIMING = {
  /**
   * When the hero starts appearing, in seconds from the moment playback begins.
   *
   * Early on purpose: the content rises slowly over the tail of the clip rather
   * than waiting for it to be over.
   */
  cueAfterSeconds: 1,
  /** Crossfade length, in seconds. Timed to *end* as the clip does. */
  fade: 1.8,
  /**
   * Fallback clip length, for the case where metadata never loads. The real
   * lengths are measured at build time and carried on `IntroConfig`; this is
   * only ever a floor under a failure.
   */
  duration: 4.05,
} as const;

/* -------------------------------------------------------------------------- */
/* The cue                                                                    */
/* -------------------------------------------------------------------------- */

export const INTRO_CUE_EVENT = "vt:intro-cue";

/**
 * Whether the cue has already gone out.
 *
 * An event alone is not enough to coordinate on: whoever subscribes after it
 * fires never hears it, and it fires very early on several paths — reduced
 * motion, a missing file, autoplay refused. That race left the header stuck at
 * zero opacity until its eight-second fallback. So the fact is also recorded,
 * and listeners check the record before subscribing.
 */
declare global {
  interface Window {
    __vtIntroCued?: boolean;
  }
}

export function markIntroCued(): void {
  window.__vtIntroCued = true;
  window.dispatchEvent(new CustomEvent(INTRO_CUE_EVENT));
}

/**
 * Runs `callback` once, as soon as the intro cue has gone out — immediately if
 * it already has. Returns an unsubscribe function.
 */
export function onIntroCue(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (window.__vtIntroCued) {
    callback();
    return () => {};
  }

  let done = false;
  const handler = () => {
    if (done) return;
    done = true;
    window.removeEventListener(INTRO_CUE_EVENT, handler);
    callback();
  };

  window.addEventListener(INTRO_CUE_EVENT, handler);
  return () => window.removeEventListener(INTRO_CUE_EVENT, handler);
}
