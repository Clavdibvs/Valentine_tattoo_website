"use client";

import { useEffect, useRef } from "react";

import styles from "./ScrollMeter.module.css";

/**
 * A charge running down the page's frame.
 *
 * The right-hand edge of the fixed hairline frame fills with light as the
 * page is read, a bead of light riding its leading edge. It is drawn on the
 * frame rather than on the artwork, so the backdrop is untouched — it reads
 * as the metal border itself taking a charge.
 *
 * Both are moved by transform alone, against a height measured once per
 * resize: the first version positioned the bead with `top` and toggled
 * chapter ticks on every scroll frame, which cost a layout per frame. The
 * ticks are gone too — along the frame they read as stray marks, not as a
 * scale.
 *
 * Desktop only, decorative only. Under reduced motion it still tracks the
 * scroll (it is position, not animation) but nothing eases.
 */
export function ScrollMeter() {
  const meterRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const beadRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const meter = meterRef.current;
    const fill = fillRef.current;
    const bead = beadRef.current;
    if (!meter || !fill || !bead) return;

    let height = 0;
    let range = 1;
    let y = window.scrollY;
    let raf = 0;

    // Written in the frame, from the position the scroll event read: reading
    // it in the frame, after the page's animations have written theirs, forced
    // a style and layout pass every frame.
    const update = () => {
      raf = 0;
      const progress = Math.min(1, Math.max(0, y / range));
      fill.style.transform = `scaleY(${progress.toFixed(4)})`;
      bead.style.transform = `translate3d(0, ${(progress * height).toFixed(1)}px, 0)`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = (event: Event) => {
      // A capturing listener hears the galleries' rails scroll too.
      if (event.target !== document) return;
      y = window.scrollY;
      request();
    };
    const measure = () => {
      height = meter.clientHeight;
      range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      y = window.scrollY;
      request();
    };

    measure();
    // Captured, so it reads before the animation layer's listener writes.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    // The galleries stream in and change the page's length after mount.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={meterRef} className={styles.meter} aria-hidden="true" data-decor="">
      <span className={styles.track} />
      <span ref={fillRef} className={styles.fill} />
      <span ref={beadRef} className={styles.bead} />
    </div>
  );
}
