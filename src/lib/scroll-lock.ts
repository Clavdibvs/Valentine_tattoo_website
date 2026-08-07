"use client";

import { useEffect } from "react";

/**
 * Holds the page still.
 *
 * Two things need this — the mobile menu, which is a modal, and the opening
 * clip, which must play through before the visitor starts scrolling past it —
 * so the mechanics live in one place instead of being written twice.
 *
 * ## Reference counted
 *
 * Locks nest. Whoever locks last must not undo the lock a still-open caller is
 * relying on, so the DOM is touched only on the first lock and the last
 * release, and the original inline values are captured once and restored once.
 *
 * ## Why both elements
 *
 * `overflow: hidden` on `<body>` alone leaves `<html>` scrollable in some
 * engines. Both are set, and the width the scrollbar gave up is handed back as
 * padding so the layout does not jump sideways as the lock goes on and off.
 */

let depth = 0;
let restore: (() => void) | null = null;

export function lockScroll(): () => void {
  depth += 1;

  if (depth === 1) {
    const html = document.documentElement;
    const { body } = document;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    restore = () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
    };
  }

  let released = false;
  return () => {
    // Guard against a double release: it would drop the count below the number
    // of callers still holding the lock and free the page under them.
    if (released) return;
    released = true;
    depth -= 1;
    if (depth === 0) {
      restore?.();
      restore = null;
    }
  };
}

/** Locks the page for as long as `active` stays true. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return lockScroll();
  }, [active]);
}
