"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { INTRO_TIMING, markIntroCued, type IntroConfig } from "@/lib/intro-timing";
import { lockScroll } from "@/lib/scroll-lock";

import styles from "./IntroOverlay.module.css";

/**
 * The opening clip.
 *
 * It sits over the hero, plays once, cues the hero content a second in, then
 * crossfades into the hero image. The clip's last frame *is* that image, so
 * with the same crop applied the handover has nothing to see.
 *
 * It plays at 1x and nothing here touches `playbackRate`. The speed ramp is
 * baked into the file — see `scripts/build-intro.mjs` for why driving it from
 * this side could not be made smooth on a phone.
 *
 * ## It can never trap the page
 *
 * Every path out is covered, because an intro that fails must not cost the
 * visitor the site:
 *
 * - reduced motion — never mounts at all
 * - autoplay refused by the browser — cue fires immediately, overlay goes
 * - file missing or decode error — same
 * - a watchdog fires the cue anyway if playback stalls past its deadline
 *
 * The cue is a DOM event rather than shared state so the animation layer stays
 * decoupled: it waits for `vt:intro-cue`, and it also starts on its own if the
 * event never arrives.
 *
 * ## The page is held still while it runs
 *
 * Scrolling during the clip pulled the page out from under it — the hero was
 * gone before its opening had finished. The page is locked for the length of
 * the clip and released the instant it ends.
 *
 * The lock is bound to the same escape paths as everything else, so it cannot
 * outlive the clip: it is taken only after every early return has been passed,
 * released when the crossfade completes, released immediately if the visitor
 * skips, and released again by the effect's cleanup. Nothing that ends the
 * intro leaves the page stuck.
 */
function cue() {
  document.documentElement.removeAttribute("data-intro");
  markIntroCued();
}

export function IntroOverlay({ intro }: { intro: IntroConfig }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cued = useRef(false);
  const releaseScroll = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<"playing" | "fading" | "done">("playing");

  /** Hands the page back. Safe to call any number of times. */
  const unlock = useCallback(() => {
    releaseScroll.current?.();
    releaseScroll.current = null;
  }, []);

  /** Fires the cue at most once. */
  const fireCue = useCallback(() => {
    if (cued.current) return;
    cued.current = true;
    cue();
  }, []);

  /**
   * Ends the intro: crossfade, then unmount.
   *
   * The cue goes out immediately — the page must not wait on a render to start
   * appearing — but the phase change is scheduled rather than set inline. This
   * is called from inside an effect on several paths, and a synchronous
   * `setState` there cascades renders.
   */
  const finish = useCallback(() => {
    fireCue();
    window.setTimeout(() => {
      setPhase((current) => (current === "done" ? current : "fading"));
      window.setTimeout(() => {
        setPhase("done");
        // The crossfade is timed to end as the clip does, so this is the moment
        // the intro is genuinely over — and the moment the page comes back.
        unlock();
      }, INTRO_TIMING.fade * 1000);
    }, 0);
  }, [fireCue, unlock]);

  /**
   * The visitor asking to leave — Escape or the skip button.
   *
   * Unlike the clip ending on its own, this releases the page at once rather
   * than at the end of the crossfade: someone who has just asked to get out
   * should not find themselves still unable to scroll.
   */
  const dismiss = useCallback(() => {
    unlock();
    finish();
  }, [unlock, finish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      finish();
      return;
    }

    // Reduced motion: an opening animation is exactly what that preference is
    // asking not to be shown. Nothing is fetched and nothing is played.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    // Restored scroll position: on a reload part-way down the page the overlay
    // sits off-screen at the top of the document, so there would be nothing to
    // watch — and locking the page for it would be inexplicable.
    if (window.scrollY > 4) {
      finish();
      return;
    }

    document.documentElement.setAttribute("data-intro", "playing");

    const portrait = window.matchMedia("(max-width: 1023px)").matches;
    const src = (portrait ? intro.mobile : intro.desktop) ?? intro.desktop ?? intro.mobile;
    if (!src) {
      finish();
      return;
    }
    video.src = src;

    // Past every early return: the clip is really going to play, so hold the
    // page still for it.
    releaseScroll.current = lockScroll();

    const total =
      (portrait ? intro.durationMobile : intro.durationDesktop) || INTRO_TIMING.duration;

    // The cue, and the crossfade, on plain timers.
    //
    // They used to be driven from a per-frame loop, because the ramp needed one
    // anyway and the clip's position was the only honest clock. With the ramp
    // baked in, clip position and real time are the same thing, so a frame loop
    // would be doing nothing but waking the main thread sixty times a second
    // during the one animation that must not be interrupted.
    let cueTimer = 0;
    let fadeTimer = 0;
    const onPlaying = () => {
      video.removeEventListener("playing", onPlaying);
      cueTimer = window.setTimeout(fireCue, INTRO_TIMING.cueAfterSeconds * 1000);
      // Start the crossfade so it *ends* as the clip does, rather than
      // beginning at the last frame and cutting.
      fadeTimer = window.setTimeout(finish, Math.max(0, total - INTRO_TIMING.fade) * 1000);
    };
    video.addEventListener("playing", onPlaying);

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);

    // Autoplay is refused on some setups; there is nothing to fall back to but
    // the site itself, so hand it over immediately.
    const started = video.play();
    if (started && typeof started.catch === "function") started.catch(finish);

    // Watchdog: if playback never reaches the cue — stalled network, codec the
    // browser will not decode — the hero must not stay hidden.
    // Deadlines in real time: the clip is over in about four seconds, so these
    // only bite if playback never really starts.
    const watchdog = window.setTimeout(fireCue, 4000);
    const hardStop = window.setTimeout(finish, 8000);

    return () => {
      window.clearTimeout(cueTimer);
      window.clearTimeout(fadeTimer);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      window.clearTimeout(watchdog);
      window.clearTimeout(hardStop);
      document.documentElement.removeAttribute("data-intro");
      unlock();
    };
  }, [fireCue, finish, unlock, intro]);

  // Let a visitor dismiss it. Four seconds is not long, but it is not nothing.
  useEffect(() => {
    if (phase === "done") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, dismiss]);

  if (phase === "done") return null;

  const style = {
    "--intro-fade": `${INTRO_TIMING.fade}s`,
    "--crop-desktop-scale": `${100 / intro.cropDesktop.height}%`,
    "--crop-desktop-offset": `${(-intro.cropDesktop.top / intro.cropDesktop.height) * 100}%`,
    "--crop-mobile-scale": `${100 / intro.cropMobile.height}%`,
    "--crop-mobile-offset": `${(-intro.cropMobile.top / intro.cropMobile.height) * 100}%`,
  } as React.CSSProperties;

  return (
    <div
      className={styles.overlay}
      data-phase={phase}
      style={style}
      aria-hidden="true"
      data-decor=""
    >
      {/*
        No `src` and no `<source>` in the markup on purpose.
        A source in the served HTML starts the download during parse — for
        everyone, including visitors who asked for reduced motion and will never
        see a frame of it. That was 5.6 MB spent on nothing. The source is
        attached on hydration instead, once the motion preference is known, and
        a preload hint (see `page.tsx`) starts the fetch just as early for
        everyone who will actually watch it.
      */}
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        preload="auto"
        // No controls, no loop: it is scenery, not media the visitor operates.
        disablePictureInPicture
      />

      <button type="button" className={styles.skip} onClick={dismiss}>
        Salta
      </button>
    </div>
  );
}
