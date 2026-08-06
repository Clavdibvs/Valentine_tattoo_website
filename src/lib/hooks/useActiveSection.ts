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
