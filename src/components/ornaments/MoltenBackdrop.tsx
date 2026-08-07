"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import MoltenMetal from "@/components/animation/molten/MoltenMetal";
import { onIntroDone } from "@/lib/intro-timing";

import styles from "./MoltenBackdrop.module.css";

/**
 * Purple molten light flowing through the metal of the backdrop.
 *
 * ## How it is composited
 *
 * The requirement is colour-dodge through a luminance matte, and the matte has
 * to come from the artwork rather than from anything on top of it. Three layers
 * inside one isolated group do that:
 *
 *   1. the WebGL field — viewport-sized, drawing the molten pattern
 *   2. a second copy of the backdrop strip, blended `multiply` over it
 *   3. the group itself, blended `color-dodge` onto the painted backdrop
 *
 * Multiplying by the artwork *is* the matte, and its response is exactly the
 * soft one asked for rather than a threshold: black areas multiply the field to
 * nothing and dodge by nothing, dim greys let a trace through, and the bright
 * chrome carries it at full strength. There is no cutoff anywhere in that
 * chain.
 *
 * The matte is opaque black behind the plates, so the feathered joins between
 * them cannot leak an unmatted band — a transparent matte would composite as
 * *no* multiply rather than as a multiply by zero.
 *
 * ## Why a second copy of the strip rather than a mask
 *
 * The backdrop is not one image. It is fourteen plates stacked into a column,
 * each stretched to its own share of the document, overlapping its neighbours
 * by a feather that changes with the viewport, and the whole column drifts on a
 * parallax. A CSS mask reproducing that would be a second set of magic numbers
 * to keep in step with the first, and it would drift the day either changed.
 *
 * Rendering the same component again cannot drift: the matte is laid out by the
 * same CSS, from the same assets, at the same breakpoints — and because it
 * carries the same `data-backdrop-strip` hook, the *same* parallax tween moves
 * both. Alignment is not maintained, it is structural. The duplicate costs no
 * network: every URL is already in cache from the painted strip.
 *
 * That shared tween is why the matte is in the document from the first render
 * rather than appearing with the canvas. `ScrollAnimations` collects the strips
 * once, on mount; a matte that arrived later was simply not in the tween, and
 * sat still while the artwork beneath it drifted half a screen away. Giving the
 * matte its own second tween would have re-introduced the same risk by another
 * route — two scrubbed timelines converging separately are not guaranteed to
 * agree frame by frame, and this pair has to agree exactly.
 *
 * Nothing is visible before the intro ends regardless: the group is at zero
 * opacity, and the WebGL field is what actually waits.
 *
 * ## Cost
 *
 * The canvas is viewport-sized and stays that way — a page this long would
 * otherwise mean a render target several times the height of the screen, which
 * is exactly what a phone cannot afford. It is positioned to the viewport each
 * frame instead, one composited transform, while the matte scrolls with the
 * document underneath it.
 *
 * ## When it appears
 *
 * Never during the opening clip. It mounts on `vt:intro-done` — the moment the
 * overlay leaves, which every ending shares, including the skip button — and
 * then fades up over two seconds. Mounting rather than merely revealing means
 * the motion starts when the visitor first sees it, and that nothing is running
 * behind the video.
 *
 * Under `prefers-reduced-motion` it never mounts at all: a perpetually moving
 * background is precisely what that preference asks not to be shown.
 */
/* ==========================================================================
   EVERY DIAL FOR THIS EFFECT IS IN THIS FILE, IN THESE TWO BLOCKS.
   Nothing else needs editing to change how it looks.
   ========================================================================== */

/**
 * The field itself — what the shader draws, before any compositing.
 *
 * The supplied preset, with one deliberate departure: `speed`. At the preset's
 * 0.35 the field was measurably almost still, so it was raised until the motion
 * reads as flowing. The palette is untouched.
 *
 * Worth knowing if you tune these:
 *
 *   speed       how fast the field flows. 0.35 was invisible, 0.8 reads well.
 *   brightness  how hot the field is before the matte. Raising this brightens
 *               the whole effect but pushes the hot cores to white sooner,
 *               because colour-dodge clips — that is where the purple is lost.
 *   glow        gain on the filaments. Similar effect to brightness, but
 *               concentrated in the threads rather than spread over the field.
 *   scale       zoom. Higher means finer, busier filaments.
 *   coreSize    thickness of the bright cores.
 */
const MOLTEN = {
  color1: "#1d0092",
  color2: "#ffb1fd",
  color3: "#fff0ff",
  speed: 1.5,
  scale: 8,
  detail: 3,
  glow: 2,
  coreSize: 0.13,
  swirl: 1,
  fold: -0.2,
  blackPoint: 0.02,
  brightness: 2,
  colorMode: "molten",
  grain: false,
  grainIntensity: 0,
  // No pointer tracking: the animation is meant to live on its own.
  mouseInteraction: false,
  mouseStrength: 0,
  opacity: 1,
} as const;

/**
 * The compositing — how much of that field survives contact with the artwork.
 *
 * This is the block to reach for when the effect feels too weak or too strong
 * overall, rather than the shader above.
 *
 *   --molten-opacity        strength of the whole layer over the page.
 *
 *   --molten-matte-gain     how much of the artwork's luminance the matte lets
 *                           through. THE MAIN DIAL. It is a plain multiply, so
 *                           raising it makes the effect more present everywhere
 *                           it already appears without ever lifting it off the
 *                           black — pure black times anything is still black.
 *
 *   --molten-matte-contrast shape of the matte's response. Was 1.18, which is
 *                           what made the blend feel heavy: this artwork sits
 *                           almost entirely below mid-grey, and contrast above
 *                           1 pushes everything below mid-grey *down*, so the
 *                           matte was choking the effect exactly where it had
 *                           room to breathe. Keep this at 1 or above — going
 *                           below lifts black off zero and the purple starts
 *                           hazing the empty areas, which is the one thing the
 *                           matte exists to prevent.
 */
const COMPOSITE = {
  "--molten-opacity": 1,
  "--molten-matte-gain": 1.7,
  "--molten-matte-contrast": 1,
} as React.CSSProperties;

export function MoltenBackdrop({
  waitForIntro,
  children,
}: {
  waitForIntro: boolean;
  /** The matte: a second copy of the plate strip, supplied by `PageBackdrop`. */
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lit, setLit] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Scheduled rather than set inline, here and below: `onIntroDone` calls back
  // synchronously when the intro is already over, and a `setState` reached from
  // inside an effect on the same tick cascades renders.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setAllowed(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!allowed || mounted) return;

    let scheduled = 0;
    const arrive = () => {
      scheduled = window.setTimeout(() => setMounted(true), 0);
    };

    if (!waitForIntro) {
      arrive();
      return () => window.clearTimeout(scheduled);
    }

    // As everywhere else on this page, a fallback timer guarantees it arrives
    // even if the signal never does.
    const timer = window.setTimeout(arrive, 12000);
    const off = onIntroDone(() => {
      window.clearTimeout(timer);
      arrive();
    });
    return () => {
      off();
      window.clearTimeout(timer);
      window.clearTimeout(scheduled);
    };
  }, [allowed, mounted, waitForIntro]);

  // The two-second fade has to start from a rendered zero, so the opacity is
  // raised a frame after the layer is in the document rather than in the same
  // commit — a transition between values the browser never painted does not run.
  useEffect(() => {
    if (!mounted || lit) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setLit(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [mounted, lit]);

  /*
   * Hold the canvas over the viewport.
   *
   * The layer spans the document so its matte can scroll with the artwork, but
   * the canvas inside it must stay the size of the screen. Its offset is read
   * from the layer's own box rather than from `scrollY`, so it stays right
   * whatever the page does above it, and it is written as a transform so the
   * correction never costs a layout.
   *
   * The layer itself is not parallaxed — only the strips inside it are — so a
   * scroll listener is exact here; there is no scrubbed value to chase.
   */
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      const layer = layerRef.current;
      const viewport = viewportRef.current;
      if (!layer || !viewport) return;
      viewport.style.transform = `translate3d(0, ${-layer.getBoundingClientRect().top}px, 0)`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("orientationchange", request);
    // The visual viewport moves independently of the layout viewport while the
    // browser's own chrome slides in and out on a phone.
    window.visualViewport?.addEventListener("resize", request);
    window.visualViewport?.addEventListener("scroll", request);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("orientationchange", request);
      window.visualViewport?.removeEventListener("resize", request);
      window.visualViewport?.removeEventListener("scroll", request);
    };
  }, [mounted]);

  return (
    <div
      ref={layerRef}
      className={styles.layer}
      style={COMPOSITE}
      data-lit={lit ? "" : undefined}
      aria-hidden="true"
      data-decor=""
    >
      {mounted ? (
        <div ref={viewportRef} className={styles.viewport}>
          <MoltenMetal {...MOLTEN} />
        </div>
      ) : null}

      {/* The matte. Present from the start so it shares the backdrop's tween;
          invisible until the field above arrives. */}
      <div className={styles.matte}>{children}</div>
    </div>
  );
}
