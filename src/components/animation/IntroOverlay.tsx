"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { INTRO_TIMING, introRateAt, markIntroCued, type IntroConfig } from "@/lib/intro-timing";
import { lockScroll } from "@/lib/scroll-lock";

import styles from "./IntroOverlay.module.css";

/**
 * The opening clip.
 *
 * It sits over the hero, plays once on a speed ramp — see `INTRO_TIMING` for the
 * arithmetic — cues the hero content as the ramp ends, then crossfades into the
 * hero image. The clip's last frame *is* that image, so with the same crop
 * applied the handover has nothing to see.
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

    // Skip any run-in the master carries before its first real frame.
    const startAt = portrait ? INTRO_TIMING.startAt.mobile : INTRO_TIMING.startAt.desktop;
    if (startAt > 0) {
      const seek = () => {
        video.currentTime = startAt;
        video.removeEventListener("loadedmetadata", seek);
      };
      if (video.readyState >= 1) seek();
      else video.addEventListener("loadedmetadata", seek);
    }

    /*
     * The speed ramp, driven per frame.
     *
     * `timeupdate` fires only a few times a second — far too coarse for a rate
     * that changes continuously — so the rate is set on every animation frame
     * instead, from the clip's own position. Deriving it from position rather
     * than from a stopwatch means a dropped frame or a slow decode corrects
     * itself on the next one.
     */
    let raf = 0;
    let lastRate = 0;
    let playbackStarted = 0;
    const tick = () => {
      if (video.paused || video.ended) return;

      // Only write the rate when it has moved enough to matter. Assigning
      // `playbackRate` every frame makes the decoder resync constantly, which
      // is felt as stutter — and the curve is smooth enough that 0.05 steps are
      // indistinguishable from continuous.
      const rate = introRateAt(video.currentTime);
      if (Math.abs(rate - lastRate) > 0.05) {
        video.playbackRate = rate;
        lastRate = rate;
      }

      // Real elapsed time, not clip position — see INTRO_TIMING.cueAfterSeconds.
      if (!playbackStarted && video.currentTime > 0) playbackStarted = performance.now();
      if (playbackStarted && performance.now() - playbackStarted >= INTRO_TIMING.cueAfterSeconds * 1000) {
        fireCue();
      }

      // Past the ramp the clip runs at 1×, so the real time left is simply the
      // clip time left. Start the crossfade so it *ends* as the clip does,
      // rather than beginning at the last frame and cutting.
      const total = Number.isFinite(video.duration) ? video.duration : INTRO_TIMING.duration;
      if (total - video.currentTime <= INTRO_TIMING.fade) {
        finish();
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);

    // Autoplay is refused on some setups; there is nothing to fall back to but
    // the site itself, so hand it over immediately.
    video.playbackRate = introRateAt(
      portrait ? INTRO_TIMING.startAt.mobile : INTRO_TIMING.startAt.desktop,
    );
    lastRate = video.playbackRate;
    const started = video.play();
    if (started && typeof started.catch === "function") started.catch(finish);
    raf = requestAnimationFrame(tick);

    // Watchdog: if playback never reaches the cue — stalled network, codec the
    // browser will not decode — the hero must not stay hidden.
    // Real-time deadlines, not clip time: with the ramp the clip is over in
    // about four seconds, so these only bite if playback never really starts.
    const watchdog = window.setTimeout(fireCue, 4000);
    const hardStop = window.setTimeout(finish, 8000);

    return () => {
      cancelAnimationFrame(raf);
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
