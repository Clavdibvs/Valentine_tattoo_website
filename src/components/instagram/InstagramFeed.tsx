"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { instagramContent } from "@/content/site-content";
import { instagramFeed } from "@/config/site-config";
import type { InstagramMedia } from "@/lib/instagram/types";

import { InstagramCard } from "./InstagramCard";
import { MediaLightbox } from "./MediaLightbox";
import styles from "./InstagramFeed.module.css";

/**
 * One list, two compositions.
 *
 * Mobile renders the reference's three-column Instagram grid; from 1024px the
 * same list becomes a scroll-snapped horizontal carousel with controls. Using a
 * single DOM list avoids duplicate image requests and hydration mismatches.
 *
 * Scrolling stays native — the controls only call `scrollBy`, nothing is
 * hijacked and no smooth-scroll library is involved.
 */
export function InstagramFeed({
  media,
  label = instagramContent.carouselLabel,
  shape = "post",
}: {
  media: InstagramMedia[];
  /** Accessible name for this carousel — each gallery needs its own. */
  label?: string;
  /**
   * Card proportions. Feed posts are 4:5; the highlights are stories at 9:16,
   * and cropping those into a post-shaped card threw away most of the frame.
   */
  shape?: "post" | "story";
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /*
   * Position of the enlarged tile in `media`, or null when nothing is open.
   *
   * An index rather than the item itself, because the lightbox steps through
   * this same list: it needs to know where in the gallery it currently is, not
   * just which picture it is showing. Kept per carousel rather than in one
   * shared provider — each gallery already owns its media, only one lightbox
   * can be open at a time, and a null state renders nothing.
   */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  /* ---------------------------------------------------------------------- */
  /* Control availability                                                    */
  /* ---------------------------------------------------------------------- */
  const syncControls = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncControls();
    el.addEventListener("scroll", syncControls, { passive: true });

    const observer = new ResizeObserver(syncControls);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", syncControls);
      observer.disconnect();
    };
  }, [syncControls, media.length]);

  const scrollByCards = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const step = card ? card.offsetWidth + 14 : el.clientWidth * 0.6;
    el.scrollBy({ left: step * direction * 2, behavior: "smooth" });
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Keyboard support on the scroller itself                                 */
  /* ---------------------------------------------------------------------- */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByCards(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByCards(-1);
      }
    },
    [scrollByCards],
  );

  /* ---------------------------------------------------------------------- */
  /* Pointer drag — desktop affordance, never blocks native touch scrolling   */
  /* ---------------------------------------------------------------------- */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { active: true, startX: event.clientX, startScroll: el.scrollLeft, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const el = scrollerRef.current;
    if (!drag.current.active || !el) return;
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  // Suppress the click that ends a drag so dragging never opens a post.
  const onClickCapture = (event: React.MouseEvent<HTMLUListElement>) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    /* The controls live OUTSIDE the chrome frame: the frame's clip-path would
       otherwise cut them in half where they overhang its edge. */
    <div className={[styles.wrap, shape === "story" ? styles.story : ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className={`${styles.control} ${styles.prev}`}
        onClick={() => scrollByCards(-1)}
        aria-label={instagramContent.previousLabel}
        disabled={!canScrollLeft}
      >
        <ChevronLeftIcon size={20} />
      </button>

      <ChromeFrame metal notch={16} className={styles.frame} innerClassName={styles.frameInner} nodes brackets>
        <ul
          ref={scrollerRef}
          className={styles.scroller}
          aria-label={label}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {media.map((item, index) => (
            <li
              key={item.id}
              className={styles.item}
              data-beyond-grid={index >= instagramFeed.mobileGridCount ? "" : undefined}
            >
              <InstagramCard
                media={item}
                showCaption
                sizes={shape === "story" ? "(max-width: 1023px) 46vw, 200px" : "(max-width: 1023px) 33vw, 170px"}
                priority={index < 3}
                onOpen={() => setOpenIndex(index)}
              />
            </li>
          ))}
        </ul>
      </ChromeFrame>

      <button
        type="button"
        className={`${styles.control} ${styles.next}`}
        onClick={() => scrollByCards(1)}
        aria-label={instagramContent.nextLabel}
        disabled={!canScrollRight}
      >
        <ChevronRightIcon size={20} />
      </button>

      <MediaLightbox
        items={media}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={closeLightbox}
      />
    </div>
  );
}
