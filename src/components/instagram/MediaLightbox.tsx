"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExternalIcon,
  InstagramIcon,
} from "@/components/ui/Icons";
import { instagramContent } from "@/content/site-content";
import type { InstagramMedia } from "@/lib/instagram/types";
import { useScrollLock } from "@/lib/scroll-lock";

import styles from "./MediaLightbox.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const LIGHTBOX_SIZES = "(max-width: 900px) 92vw, min(78vh, 900px)";

/** How far a swipe must travel, or how fast it must flick, to turn the page. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 380;

/**
 * The enlarged view of a gallery tile.
 *
 * A tap on a tile used to leave the site immediately. It now opens the image
 * here, and the link to Instagram is a second, explicit step underneath it —
 * so looking at the work no longer costs the visitor the page they were on.
 *
 * The whole gallery comes with it: arrows, arrow keys and a horizontal swipe
 * move through the section's other images without closing and reopening.
 *
 * ## Why the footer can never be pushed away
 *
 * The whole point of this component is the button under the image, and on a
 * phone that is exactly what a naive layout loses: a tall image in a column
 * grows until the button is somewhere below the fold, unreachable because the
 * overlay does not scroll.
 *
 * Two rules prevent it. The panel is sized in `svh` — the *smallest* the
 * viewport ever gets, so nothing is hidden behind Safari's collapsing toolbar
 * at any point in its animation — and the figure is `flex: 1` with
 * `min-height: 0`, which is what actually permits it to shrink. Without the
 * `min-height` override a flex item refuses to go below its content size, and
 * the image wins the argument against the button every time.
 *
 * The image is then bounded by `max-height: 100%` inside that figure, so it
 * scales down to whatever room is left rather than claiming its own.
 *
 * ## Why it is rendered through a portal
 *
 * `position: fixed` is only relative to the viewport while no ancestor has a
 * transform, filter or perspective on it — any of those makes that ancestor the
 * containing block instead. The tiles sit inside sections that GSAP animates
 * and that carry `data-parallax`, so rendered in place the overlay measured
 * 1400x715 starting 164px down the page: the image overflowed the bottom, and
 * the backdrop covered so little that clicking beside the image hit the section
 * behind it rather than closing.
 *
 * Moving the subtree to `document.body` removes every transformed ancestor from
 * the chain, and `inset: 0` means the viewport again.
 */
export function MediaLightbox({
  items,
  index,
  onIndexChange,
  onClose,
  morphed = false,
}: {
  /** The whole gallery this lightbox belongs to. */
  items: InstagramMedia[];
  /** Position of the open item, or `null` when the lightbox is closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /**
   * The photograph flew in from its tile (a view transition): the figure must
   * not fade in on top of that flight, or the picture dims halfway through.
   */
  morphed?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const titleId = useId();
  const open = index !== null;
  const media = index === null ? null : (items[index] ?? null);

  /*
   * The portal target, resolved once at mount so nothing touches `document`
   * while rendering on the server.
   *
   * React never renders portals into the server HTML and never hydrates them
   * against it — they always mount fresh on the client — so returning `null`
   * on the server and `document.body` on the client is not a mismatch: both
   * contribute nothing where the component actually sits in the tree.
   */
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  );

  // The page behind the overlay stays exactly where it was.
  useScrollLock(open);

  /* -------------------------------------------------------------------- */
  /* Moving through the gallery                                            */
  /* -------------------------------------------------------------------- */
  /*
   * Clamped rather than wrapped, and the control at the end is disabled — the
   * same way the carousel on the page behaves at its own edges. Wrapping would
   * mean the visitor can never tell they have seen everything.
   */
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  const goPrev = useCallback(() => {
    if (index !== null && index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index !== null && index < items.length - 1) onIndexChange(index + 1);
  }, [index, items.length, onIndexChange]);

  /**
   * A flick counts as much as a long drag: a short, fast swipe is how people
   * actually page through images on a phone, and requiring the full distance
   * every time makes the gallery feel stuck.
   */
  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const travelled = info.offset.x;
      const flicked = info.velocity.x;
      if (travelled < -SWIPE_DISTANCE || flicked < -SWIPE_VELOCITY) goNext();
      else if (travelled > SWIPE_DISTANCE || flicked > SWIPE_VELOCITY) goPrev();
    },
    [goNext, goPrev],
  );

  /*
   * The neighbours are fetched as soon as an image opens, so a swipe shows the
   * next photo instead of a gap while it downloads.
   */
  useEffect(() => {
    if (index === null) return;
    for (const neighbour of [items[index - 1], items[index + 1]]) {
      if (!neighbour) continue;
      const preload = new Image();
      preload.src = neighbour.displayUrl;
    }
  }, [index, items]);

  /* -------------------------------------------------------------------- */
  /* Escape, arrows, focus trap                                            */
  /* -------------------------------------------------------------------- */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, goNext, goPrev],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  /* -------------------------------------------------------------------- */
  /* Focus in on open, back to the tile on close                           */
  /* -------------------------------------------------------------------- */
  /*
   * The element to return to is captured when the lightbox opens rather than
   * passed in: the tiles live in a carousel, and a ref per tile would mean
   * threading one through every card for the sake of a single interaction.
   */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // A frame, so the panel is mounted and its controls are focusable.
      const raf = requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }

    /*
     * `preventScroll` matters here. Returning focus to the tile is right for
     * keyboard users, but `focus()` also scrolls that element into view — and
     * on a short screen the tile is often no longer where it was, so closing
     * the lightbox jumped the page by several hundred pixels. Focus moves, the
     * page does not.
     */
    returnFocusRef.current?.focus({ preventScroll: true });
    returnFocusRef.current = null;
  }, [open]);

  /* -------------------------------------------------------------------- */
  /* Variants                                                              */
  /* -------------------------------------------------------------------- */
  const overlay = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reduce ? { duration: 0.01 } : { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] as const },
    },
    exit: {
      opacity: 0,
      transition: reduce ? { duration: 0.01 } : { duration: 0.18, ease: "easeIn" as const },
    },
  };

  const frame = reduce || morphed
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.97 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.34, ease: [0.22, 0.61, 0.36, 1] as const },
        },
        exit: { opacity: 0, scale: 0.985, transition: { duration: 0.16 } },
      };

  const copy = instagramContent.lightbox;
  const multiple = items.length > 1;

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {media ? (
        <motion.div
          key="media-lightbox"
          className={styles.overlay}
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />

          <div ref={panelRef} className={styles.panel}>
            <h2 id={titleId} className="sr-only">
              {copy.label}
            </h2>

            <button type="button" className={styles.close} onClick={onClose} aria-label={copy.close}>
              <CloseIcon size={22} />
            </button>

            <motion.figure
              className={styles.figure}
              variants={frame}
              /*
               * Drag only turns the page — the constraints pin it back to
               * centre, so the image never actually travels anywhere. What the
               * gesture buys is the feel: the picture answers the finger, which
               * is what tells someone mid-swipe that swiping is a thing here.
               */
              drag={multiple && !reduce ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              dragMomentum={false}
              onDragEnd={onDragEnd}
            >
              {multiple ? (
                <>
                  <button
                    type="button"
                    className={`${styles.nav} ${styles.prev}`}
                    onClick={goPrev}
                    disabled={!hasPrev}
                    aria-label={copy.previous}
                  >
                    <ChevronLeftIcon size={20} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.nav} ${styles.next}`}
                    onClick={goNext}
                    disabled={!hasNext}
                    aria-label={copy.next}
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </>
              ) : null}

              {/* Keyed on the item so a new photo fades in rather than snapping. */}
              <MediaImage key={media.id} media={media} />

              {media.captionExcerpt ? (
                <figcaption className={styles.caption}>{media.captionExcerpt}</figcaption>
              ) : null}
            </motion.figure>

            <motion.div className={styles.footer} variants={frame}>
              {multiple ? (
                <p className={styles.counter} aria-hidden="true">
                  {(index ?? 0) + 1} / {items.length}
                </p>
              ) : null}

              <p className={`u-label ${styles.footerEyebrow}`}>
                <SigilStar size={10} />
                <span>{copy.ctaEyebrow}</span>
                <SigilStar size={10} />
              </p>

              <ChromeButton
                href={media.permalink}
                external
                size="md"
                tracked
                icon={<InstagramIcon size={19} />}
                trailing={<ExternalIcon size={14} />}
              >
                {copy.cta}
              </ChromeButton>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalTarget,
  );
}

/**
 * A plain `<img>` rather than `next/image`.
 *
 * Locally exported media already ships the three widths the build produced, so
 * there is nothing for the optimizer to do; remote Instagram media comes in a
 * single CDN size, so there is nothing for it to choose between. What is left
 * is `object-fit: contain` inside a box that shrinks, which a bare image does
 * directly and `fill` only does through an extra positioned wrapper.
 */
function MediaImage({ media }: { media: InstagramMedia }) {
  const typeLabel = instagramContent.mediaTypeLabels[media.mediaType];
  const alt = media.captionExcerpt
    ? `${typeLabel} su Instagram: ${media.captionExcerpt}`
    : `${typeLabel} pubblicato su Instagram`;

  return (
    <picture className={styles.picture}>
      {media.srcSet ? (
        <source type="image/webp" srcSet={media.srcSet} sizes={LIGHTBOX_SIZES} />
      ) : null}
      <img
        src={media.displayUrl}
        alt={alt}
        className={styles.image}
        width={media.width}
        height={media.height}
        decoding="async"
        draggable={false}
        // The gallery hands the shared view-transition name to this image, so
        // the tile that was clicked can fly into it (see InstagramFeed).
        data-lightbox-image=""
      />
    </picture>
  );
}
