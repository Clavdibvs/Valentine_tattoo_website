"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import styles from "./CursorFollower.module.css";

/** What the follower says over the zones that name themselves. */
const LABELS: Record<string, string> = {
  open: "Apri",
  drag: "Trascina",
};

const INTERACTIVE = "a, button, summary, label, select, [role='button']";
const TEXT_ENTRY = "input:not([type='checkbox']):not([type='radio']), textarea";

/**
 * A chrome ring that trails the mouse and tells it what a surface does.
 *
 * - over the page, a small ring a beat behind the pointer, with a dot on it;
 * - over anything clickable, the ring opens and takes the ember tint;
 * - over a gallery tile, it becomes a disc that says "Apri", and over a rail,
 *   "Trascina" — the zones carry `data-cursor` to say which;
 * - over a text field it steps aside entirely, so the caret is unobstructed.
 *
 * The system pointer is never hidden: the ring keeps it company rather than
 * replacing it. It used to stand in for the pointer over the galleries, half
 * a second behind the hand — and a pointer that lags is the first thing
 * anyone reads as a slow site. It now follows within a fifth of a second.
 * Mouse only (`hover: hover` and `pointer: fine`), never under reduced
 * motion, and invisible to assistive technology.
 *
 * Positions are written by GSAP straight to the elements as transforms —
 * nothing here re-renders, or lays anything out, on a mouse move.
 */
export function CursorFollower() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!root || !ring || !dot || !label || !fine.matches || reduced.matches) return;

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.2, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.2, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power2" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power2" });

    let mode = "";
    const setMode = (next: string) => {
      if (next === mode) return;
      mode = next;
      root.dataset.mode = next;
      label.textContent = LABELS[next] ?? "";
    };

    /** What the surface under the pointer does. */
    const read = (target: Element | null) => {
      if (!target?.closest) return setMode("");
      if (target.closest(TEXT_ENTRY)) return setMode("text");
      const zone = target.closest<HTMLElement>("[data-cursor]");
      if (zone?.dataset.cursor && zone.dataset.cursor in LABELS) return setMode(zone.dataset.cursor);
      if (target.closest(INTERACTIVE) || zone) return setMode("link");
      setMode("");
    };

    let shown = false;
    let lastX = 0;
    let lastY = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!shown) {
        shown = true;
        // First sighting: arrive in place rather than gliding from a corner.
        gsap.set([ring, dot], { x: lastX, y: lastY });
        root.dataset.visible = "";
      }
      ringX(lastX);
      ringY(lastY);
      dotX(lastX);
      dotY(lastY);
      read(event.target as Element | null);
    };

    // The page moves under a still mouse when it scrolls: re-read what is under
    // the pointer once the scroll settles, or the disc would keep saying
    // "Apri" over a paragraph. Not on every frame — hit-testing mid-scroll
    // forces a layout each time.
    let settle = 0;
    const onScroll = () => {
      if (!shown) return;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => read(document.elementFromPoint(lastX, lastY)), 110);
    };

    // Leaving the window: a mouseout with nowhere to go.
    const onOut = (event: MouseEvent) => {
      if (event.relatedTarget) return;
      shown = false;
      delete root.dataset.visible;
    };
    const onDown = () => root.setAttribute("data-pressed", "");
    const onUp = () => {
      root.removeAttribute("data-pressed");
      // A click often changes what is under a still pointer — a lightbox opens
      // over the tile — so read the surface again once the page has updated.
      window.setTimeout(() => read(document.elementFromPoint(lastX, lastY)), 120);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.cursor} aria-hidden="true" data-decor="">
      <div ref={ringRef} className={styles.ring}>
        <span ref={labelRef} className={styles.label} />
      </div>
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
