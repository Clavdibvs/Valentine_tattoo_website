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
   * When the hero starts appearing, in seconds before the clip *ends*.
   *
   * Early on purpose: the content rises over the tail of the clip rather than
   * waiting for it to be over. But measured backwards from the end, not
   * forwards from the start — that was the bug.
   *
   * Anchored to the start, a single number meant two different experiences,
   * because the two cuts are not the same length. Both revealed the hero one
   * second in; on mobile that landed just as the crossfade began, but the
   * desktop cut runs 0.8s longer, so there the copy sat over three more seconds
   * of still-playing film. Measured from the end, the same number means the
   * same moment in both.
   *
   * THIS IS THE DIAL. Larger reveals the page earlier over the clip; smaller
   * holds the clip longer before anything appears. 2.3 is the value that keeps
   * the mobile cut exactly where it already was.
   */
  cueBeforeEnd: 2.3,
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

/**
 * The intro announces two moments, and they are not the same one:
 *
 *   cue   — `cueBeforeEnd` seconds from the end. The header and the hero copy
 *           start rising over the tail of the clip rather than waiting for it
 *           to be over.
 *   done  — the overlay is gone. Whatever must not be seen *during* the clip
 *           waits for this.
 *
 * ## Why each is a flag as well as an event
 *
 * An event alone is not enough to coordinate on: whoever subscribes after it
 * fires never hears it, and both fire very early on several paths — reduced
 * motion, a missing file, autoplay refused, a reload part-way down the page.
 * That race once left the header stuck at zero opacity until its eight-second
 * fallback. So the fact is recorded too, and listeners check the record before
 * subscribing.
 */
export const INTRO_CUE_EVENT = "vt:intro-cue";
export const INTRO_DONE_EVENT = "vt:intro-done";

declare global {
  interface Window {
    __vtIntroCued?: boolean;
    __vtIntroDone?: boolean;
  }
}

type Milestone = { event: string; flag: "__vtIntroCued" | "__vtIntroDone" };

const CUE: Milestone = { event: INTRO_CUE_EVENT, flag: "__vtIntroCued" };
const DONE: Milestone = { event: INTRO_DONE_EVENT, flag: "__vtIntroDone" };

function mark({ event, flag }: Milestone): void {
  if (window[flag]) return;
  window[flag] = true;
  window.dispatchEvent(new CustomEvent(event));
}

function on({ event, flag }: Milestone, callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (window[flag]) {
    callback();
    return () => {};
  }

  let spent = false;
  const handler = () => {
    if (spent) return;
    spent = true;
    window.removeEventListener(event, handler);
    callback();
  };

  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
}

export const markIntroCued = () => mark(CUE);
export const markIntroDone = () => mark(DONE);

/**
 * Runs `callback` once, as soon as the intro has reached that milestone —
 * immediately if it already has. Returns an unsubscribe function.
 */
export const onIntroCue = (callback: () => void) => on(CUE, callback);
export const onIntroDone = (callback: () => void) => on(DONE, callback);
