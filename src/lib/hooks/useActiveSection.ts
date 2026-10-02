"use client";

import { useEffect, useState } from "react";

import type { SectionId } from "@/config/site-config";

/**
 * Tracks which section currently occupies the viewport, for the header's
 * active-item indicator.
 *
 * Uses IntersectionObserver against a band just under the header so the
 * indicator flips at the point the user perceives the section change. Falls
 * back silently when the API is unavailable.
 */
export function useActiveSection(ids: readonly SectionId[], initial: SectionId): SectionId {
  const [active, setActive] = useState<SectionId>(initial);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const visible = new Map<SectionId, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;
          visible.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let best: SectionId | null = null;
        let bestRatio = 0;
        for (const id of ids) {
          const ratio = visible.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best) setActive(best);
      },
      {
        // Discount the area hidden behind the fixed header.
        rootMargin: "-88px 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.6, 0.85],
      },
    );

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/** True once the page has scrolled past a small threshold. */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

type HeaderScrollState = {
  /** Still resting on the very top of the hero. */
  atTop: boolean;
  /** Tucked out of the way while the visitor reads downwards. */
  hidden: boolean;
};

/**
 * The header's two scroll-driven states.
 *
 * `atTop` lets it dissolve into the hero, where the backdrop plate draws its
 * own header band. `hidden` gives a phone its screen back: below `hideBelow`
 * the bar slides away on the way down and returns the moment the visitor
 * scrolls up, which is when they are looking for it. It never hides over the
 * hero, and it never hides on a wide screen, where 68px is not worth the
 * navigation and the active-section marker it carries.
 *
 * The direction needs a few pixels of agreement before it flips, so momentum
 * scrolling and the jitter of a resting finger do not make it flicker.
 */
export function useHeaderScrollState(
  { topThreshold = 24, hideBelow = 1024 }: { topThreshold?: number; hideBelow?: number } = {},
): HeaderScrollState {
  const [state, setState] = useState<HeaderScrollState>({ atTop: true, hidden: false });

  useEffect(() => {
    const narrow = window.matchMedia(`(max-width: ${hideBelow - 1}px)`);
    let lastY = window.scrollY;
    let viewport = window.innerHeight;
    let raf = 0;
    // Forces the next reading through the jitter filter: the first one, and
    // the one after the breakpoint changes, must always land.
    let force = true;

    /*
     * The position is read in the scroll event itself, never in an animation
     * frame. By the time a frame callback of ours runs, the page's animations
     * have already written theirs for that frame, and reading `scrollY` then
     * forces the browser to recompute style and layout on the spot — once per
     * frame, for the whole of every scroll. In the event, nothing has been
     * written yet. The listener captures, so it reads before the animation
     * layer's own scroll listener can write anything either.
     */
    const update = (y: number) => {
      const delta = y - lastY;
      // Ignore sub-threshold movement without consuming it, so a slow drag
      // still adds up to a decision.
      if (!force && Math.abs(delta) < 6 && y > topThreshold) return;
      force = false;
      lastY = y;

      setState((previous) => {
        const atTop = y <= topThreshold;
        let hidden = previous.hidden;
        if (!narrow.matches || y < viewport * 0.6) hidden = false;
        else if (delta > 0) hidden = true;
        else if (delta < 0) hidden = false;
        return atTop === previous.atTop && hidden === previous.hidden
          ? previous
          : { atTop, hidden };
      });
    };

    // Capturing on the window also catches every scrolling element below it
    // (the galleries' rails); only the page's own scroll counts here.
    const onScroll = (event: Event) => {
      if (event.target === document) update(window.scrollY);
    };
    const onResize = () => {
      viewport = window.innerHeight;
    };
    const onBreakpoint = () => {
      force = true;
      update(window.scrollY);
    };

    // First reading on the next frame rather than inline: a restored scroll
    // position has to be picked up, but not with a setState inside the effect.
    raf = requestAnimationFrame(() => update(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    narrow.addEventListener("change", onBreakpoint);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      narrow.removeEventListener("change", onBreakpoint);
    };
  }, [topThreshold, hideBelow]);

  return state;
}
