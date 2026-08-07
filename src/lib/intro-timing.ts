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
  /**
   * Where each cut actually starts.
   *
   * The mobile master opens on dead air. Measured frame luminance holds flat at
   * ~1.4 until 2.5s and only reaches half its final value around 3.5s, so the
   * cut starts at 2.6 — past the flat part, before the build. Playing that
   * stretch would be several seconds of black at exactly the moment the visitor
   * is deciding whether anything is loading.
   *
   * The desktop master needs no such trim: it climbs steadily from the first
   * second.
   *
   * Joining the curve later also lowers the opening rate, from 4× to √(16−3·2.6)
   * ≈ 2.9×. The rate law is untouched — we simply start further along it — and
   * that alone took dropped frames on mobile from 12.4% to 2.9%.
   */
  startAt: { desktop: 0, mobile: 2.6 },
  /** Video position, in seconds, where the ramp ends and real time begins. */
  rampUntil: 5,
  /** Rate at the very start. See the derivation above. */
  startRate: 4,
  /**
   * When the hero starts appearing, in *real* seconds from the moment playback
   * begins — not in clip position.
   *
   * Clip position would mean two different moments on the two cuts, because the
   * mobile one joins the ramp later and therefore reaches any given frame
   * sooner. Real time is what the visitor experiences, so that is what this is
   * measured in.
   *
   * Early on purpose: the content now rises slowly over the tail of the clip
   * rather than waiting for it to be over.
   */
  cueAfterSeconds: 1,
  /** Crossfade length, in seconds. Timed to *end* as the clip does. */
  fade: 1.8,
  /** Nominal clip length. Only a safety net: playback drives the real timing. */
  duration: 7.05,
} as const;

/** The playback rate for a given position in the clip. */
export function introRateAt(videoTime: number): number {
  if (videoTime >= INTRO_TIMING.rampUntil) return 1;
  // Derived from a linear rate fall; see INTRO_TIMING.
  return Math.max(1, Math.sqrt(INTRO_TIMING.startRate ** 2 - 3 * videoTime));
}

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
