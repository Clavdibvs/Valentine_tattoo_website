"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { dropTransform, FORGE, frameClose, prime, stage } from "@/components/animation/motion-kit";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { instagramContent } from "@/content/site-content";
import { instagramFeed } from "@/config/site-config";
import type { InstagramMedia } from "@/lib/instagram/types";

import { InstagramCard } from "./InstagramCard";
import { MediaLightbox } from "./MediaLightbox";
import styles from "./InstagramFeed.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const pad = (value: number) => String(value).padStart(2, "0");

/** The shared view-transition name the tile and the enlarged photo trade. */
const MORPH = "vt-media";

/** The photograph inside the gallery's `index`th tile. */
function tileImage(list: HTMLElement | null, index: number): HTMLImageElement | null {
  const tile = list?.querySelectorAll<HTMLElement>("[data-media-card]")[index];
  return tile?.querySelector<HTMLImageElement>("img") ?? null;
}

/** View Transitions available, and motion welcome. */
function canMorph(): boolean {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A gallery of Instagram media, in one of two compositions.
 *
 * ## `grid` — the feed
 *
 * The whole body of recent work on one wall: two rows across a wide screen,
 * the familiar three-by-three on a phone. It used to be a strip of seven
 * thumbnails 160px wide with the rest hidden behind arrows — the work, which
 * is the point of the page, was the smallest thing on it.
 *
 * It arrives as a cascade from its centre outward, each tile lifted off its
 * foot like a stencil while the photograph develops out of black and white;
 * under a pointer each tile turns toward it and a highlight slides across it.
 *
 * ## `rail` — the collections
 *
 * Stories are 9:16, and a phone is where they are native, so there they run as
 * a horizontal swipe with the current card centred and in focus, its
 * neighbours smaller and dimmed on either side. On a wide screen the rail sits
 * in its chrome frame, can be thrown with the mouse, and the cards lean with
 * the speed of the scroll. Either way they arrive dealt in from the right,
 * like a hand of cards.
 *
 * Both compositions are a single list in the DOM, so there are no duplicate
 * image requests and no hydration mismatches between breakpoints. Scrolling
 * stays native — the controls only scroll the list.
 */
export function InstagramFeed({
  media,
  label = instagramContent.carouselLabel,
  shape = "post",
  variant = "rail",
}: {
  media: InstagramMedia[];
  /** Accessible name for this gallery — each one needs its own. */
  label?: string;
  /**
   * Card proportions. Feed posts are 4:5; the highlights are stories at 9:16,
   * and cropping those into a post-shaped card threw away most of the frame.
   */
  shape?: "post" | "story";
  variant?: "grid" | "rail";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isRail = variant === "rail";

  /*
   * Position of the enlarged tile in `media`, or null when nothing is open.
   *
   * An index rather than the item itself, because the lightbox steps through
   * this same list: it needs to know where in the gallery it currently is, not
   * just which picture it is showing.
   */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  /** True while the open lightbox arrived by morph: its own fade stands down. */
  const [morphed, setMorphed] = useState(false);
  const openIndexRef = useRef<number | null>(null);
  useEffect(() => {
    openIndexRef.current = openIndex;
  }, [openIndex]);

  /*
   * Opening and closing morph between the tile and the enlarged photograph.
   *
   * With the View Transitions API the browser snapshots the tile, swaps the
   * state, and flies the one picture into the other — size, position and crop.
   * One element at a time may carry the shared name, so it is handed over
   * inside the swap: off the tile, then onto the lightbox image (and back the
   * other way on close). Without the API, or under reduced motion, the state
   * simply changes and the lightbox's own fade plays.
   */
  const openLightbox = useCallback((index: number) => {
    const tile = tileImage(scrollerRef.current, index);
    if (!tile || !canMorph()) {
      setMorphed(false);
      setOpenIndex(index);
      return;
    }
    tile.style.viewTransitionName = MORPH;
    const transition = document.startViewTransition(() => {
      tile.style.viewTransitionName = "";
      flushSync(() => {
        setMorphed(true);
        setOpenIndex(index);
      });
      const shown = document.querySelector<HTMLElement>("[data-lightbox-image]");
      if (shown) shown.style.viewTransitionName = MORPH;
    });
    void transition.finished.finally(() => {
      document.querySelector<HTMLElement>("[data-lightbox-image]")?.style.removeProperty("view-transition-name");
    });
  }, []);

  const closeLightbox = useCallback(() => {
    const index = openIndexRef.current;
    const shown = document.querySelector<HTMLElement>("[data-lightbox-image]");
    const tile = index === null ? null : tileImage(scrollerRef.current, index);
    // A tile that is not laid out (hidden past the phone grid) has no box to
    // land in; it closes plainly.
    if (!tile || !shown || !tile.getClientRects().length || !canMorph()) {
      setOpenIndex(null);
      return;
    }
    shown.style.viewTransitionName = MORPH;
    const transition = document.startViewTransition(() => {
      shown.style.viewTransitionName = "";
      tile.style.viewTransitionName = MORPH;
      flushSync(() => setOpenIndex(null));
    });
    void transition.finished.finally(() => {
      tile.style.removeProperty("view-transition-name");
    });
  }, []);

  /*
   * Grid columns on a wide screen: two full rows, never a ragged third. Ten
   * posts make five columns of two; twelve make six. An odd count drops the
   * last post rather than leaving a hole in the wall.
   */
  const wideColumns = Math.max(2, Math.min(6, Math.floor(media.length / 2)));
  const wideCount = wideColumns * 2;

  /* ---------------------------------------------------------------------- */
  /* Arrival, tilt, and the rail's live state                                */
  /*                                                                         */
  /* Everything that moves here moves by transform or opacity, on layers the */
  /* compositor can shift without repainting a photograph. The first cut     */
  /* animated clip-paths and colour filters on the images, and read every    */
  /* card's position on every scroll frame: Chrome's trace showed thirty     */
  /* times the image repaints and ten times the layouts of the page before   */
  /* it, which is what read as a stutter while scrolling.                    */
  /* ---------------------------------------------------------------------- */
  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const scroller = scrollerRef.current;
      if (!wrap || !scroller) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-stagger]", scroller);
      const cards = items.map((item) => item.firstElementChild as HTMLElement | null);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const narrow = window.matchMedia("(max-width: 1023px)");
      const part = (item: HTMLElement, selector: string) => item.querySelector<HTMLElement>(selector);

      /* ---- Arrival ------------------------------------------------------- */
      if (reduce) {
        wrap.setAttribute("data-inview", "");
      } else {
        // The frame's brackets close on the gallery as the cards arrive.
        const frame = wrap.querySelector(".chrome-frame");
        const close = frame ? frameClose(frame) : null;

        ScrollTrigger.create({
          trigger: wrap,
          start: "top 86%",
          once: true,
          onEnter: () => {
            close?.play();
            const shown = items.filter((item) => item.offsetParent !== null);
            const own = (selector: string) =>
              shown.map((item) => part(item, selector)).filter((el): el is HTMLElement => el !== null);
            const tiles = own("[data-media-card]");
            const photos = own("img");
            const veils = own("[data-veil]");

            // Read everything that will move before writing anything: started
            // one by one inside the frames, each tween read its card back.
            prime([...shown, ...tiles, ...photos]);
            // From here on, writes only — and each tween is a plain `to` from
            // a state set up front (see `stage`).

            // Marked first: when the inline values are cleared at the end, the
            // staging rule must already be letting the cards show.
            wrap.setAttribute("data-inview", "");

            // The photographs carry a CSS transition on `transform` for their
            // hover zoom. Left on, every frame GSAP wrote restarted it — four
            // thousand restarted transitions in one scroll — and the zoom-out
            // trailed a second behind the animation. Off for the arrival, back
            // on when each photograph lands.
            photos.forEach((photo) => {
              photo.style.transition = "none";
            });
            // Handing a photograph back to its CSS: the inline transform goes
            // now, the transition only a frame later. Restored together, the
            // transition saw the transform change — GSAP's final scale(1) to
            // the stylesheet's scale(1.001) — and ran a second-long, invisible
            // transition on every photograph, re-styled on every frame.
            const land = (photo: HTMLElement) => {
              dropTransform([photo]);
              requestAnimationFrame(() => photo.style.removeProperty("transition"));
            };

            if (isRail) {
              /*
               * Snapping is suspended while the hand is dealt. The cards are the
               * rail's snap points, and the browser keeps a snapped rail on its
               * card: as each card swept in from the right, the rail scrolled
               * after it — up to 200px — and fought the deal frame by frame.
               */
              scroller.style.scrollSnapType = "none";
              const deal = (index: number) => Math.min(index, 6) * 0.08;
              stage(shown, { x: 170, rotationY: -42, transformPerspective: 1100 }, { opacity: 0, origin: "0% 50%" });
              stage(photos, { scale: 1.28 });
              veils.forEach((veil) => {
                veil.style.opacity = "0.8";
                veil.style.willChange = "opacity";
              });
              shown.forEach((item, index) => {
                const photo = part(item, "img");
                const veil = part(item, "[data-veil]");
                const delay = deal(index);
                const last = index === shown.length - 1;
                gsap.to(
                  item,
                  {
                    opacity: 1,
                    x: 0,
                    rotationY: 0,
                    duration: 1.5,
                    // Cards beyond the first few are off to the right; they
                    // need no extra wait of their own.
                    delay,
                    ease: FORGE,
                    onComplete: () => {
                      dropTransform([item]);
                      item.style.removeProperty("opacity");
                      // The last card down lands last: the rail snaps again.
                      if (last) scroller.style.removeProperty("scroll-snap-type");
                    },
                  },
                );
                if (photo) {
                  gsap.to(photo, { scale: 1, duration: 1.9, delay, ease: FORGE, onComplete: () => land(photo) });
                }
                if (veil) {
                  gsap.to(veil, {
                    opacity: 0,
                    duration: 1.5,
                    delay,
                    ease: "power2.out",
                    clearProps: "opacity,willChange",
                  });
                }
              });
              return;
            }

            /*
             * The wall: a curtain from the centre outward. Each slot clips its
             * own card while the card rises into it and the photograph settles
             * the other way, out of a dark veil — a stencil lifting off, done
             * in transforms alone (a clip-path wipe repaints every frame).
             */
            const cascade = { each: 0.065, grid: "auto" as const, from: "center" as const };
            shown.forEach((item) => {
              item.style.overflow = "hidden";
            });
            veils.forEach((veil) => {
              veil.style.opacity = "0.85";
              veil.style.willChange = "opacity";
            });
            stage(tiles, { yPercent: 102 });
            stage(photos, { yPercent: -30, scale: 1.3 });
            gsap.to(
              tiles,
              {
                yPercent: 0,
                duration: 1.3,
                ease: FORGE,
                stagger: {
                  ...cascade,
                  // Each slot stops clipping as soon as its own card has landed.
                  onComplete(this: gsap.core.Tween) {
                    const card = this.targets()[0] as HTMLElement;
                    dropTransform([card]);
                    card.parentElement?.style.removeProperty("overflow");
                  },
                },
              },
            );
            gsap.to(
              photos,
              {
                yPercent: 0,
                scale: 1,
                duration: 1.7,
                ease: FORGE,
                stagger: {
                  ...cascade,
                  onComplete(this: gsap.core.Tween) {
                    land(this.targets()[0] as HTMLElement);
                  },
                },
              },
            );
            gsap.to(veils, {
              opacity: 0,
              duration: 1.6,
              ease: "power2.out",
              stagger: cascade,
              clearProps: "opacity,willChange",
            });
          },
        });
      }

      /* ---- Grid: tiles turn toward the pointer --------------------------- */
      /*                                                                      */
      /* The highlight is a disc of light moved by transform over the photo,  */
      /* not a gradient re-centred by custom property: re-centring repainted  */
      /* the photograph under it on every mouse move.                         */
      /* ---------------------------------------------------------------------- */
      if (!isRail && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        type Tilt = { x: (value: number) => void; y: (value: number) => void };
        const tilts = new Map<HTMLElement, Tilt>();
        let current: HTMLElement | null = null;

        const tiltFor = (card: HTMLElement): Tilt => {
          let tilt = tilts.get(card);
          if (!tilt) {
            gsap.set(card, { transformPerspective: 700 });
            tilt = {
              x: gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" }),
              y: gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" }),
            };
            tilts.set(card, tilt);
          }
          return tilt;
        };
        const settle = (card: HTMLElement) => {
          const tilt = tiltFor(card);
          tilt.x(0);
          tilt.y(0);
        };

        const onMove = (event: PointerEvent) => {
          const card = (event.target as Element).closest<HTMLElement>("[data-media-card]");
          if (card !== current) {
            if (current) settle(current);
            current = card;
          }
          if (!card) return;
          const box = card.getBoundingClientRect();
          const nx = (event.clientX - box.left) / box.width;
          const ny = (event.clientY - box.top) / box.height;
          const tilt = tiltFor(card);
          tilt.y((nx - 0.5) * 16);
          tilt.x(-(ny - 0.5) * 16);
          const sheen = card.querySelector<HTMLElement>("[data-sheen]");
          // The disc is twice the tile; half its travel lands its centre on the pointer.
          if (sheen) sheen.style.transform = `translate3d(${((nx - 0.5) * 50).toFixed(2)}%, ${((ny - 0.5) * 50).toFixed(2)}%, 0)`;
        };
        const onLeave = () => {
          if (current) settle(current);
          current = null;
        };

        scroller.addEventListener("pointermove", onMove, { passive: true });
        scroller.addEventListener("pointerleave", onLeave);
        return () => {
          scroller.removeEventListener("pointermove", onMove);
          scroller.removeEventListener("pointerleave", onLeave);
        };
      }

      if (!isRail) return;

      /* ---- Rail: scrubber, count, focus, lean ---------------------------- */
      /*                                                                      */
      /* Geometry is measured once per resize and the scroll position does    */
      /* the rest — no element is measured during a scroll. Each card's       */
      /* transform is written directly, and only when it changes; while the   */
      /* rail is on screen its cards hold their own layers, so the compositor */
      /* moves them without repainting their photographs.                     */
      /* ---------------------------------------------------------------------- */
      const lean = { deg: 0 };
      let centers: number[] = [];
      let cardWidth = 1;
      let step = 1;
      let gap = 0;
      let trackWidth = 0;
      // The scroll position, as the last scroll event read it, and the rail's
      // extent, as the last measure did: the frame reads nothing from the
      // page. Read there, after the page's other animations had written
      // theirs, each of these cost a full style and layout pass.
      let left = scroller.scrollLeft;
      let view = 1;
      let total = 1;
      const written: string[] = [];
      let raf = 0;

      const measure = () => {
        const box = scroller.getBoundingClientRect();
        left = scroller.scrollLeft;
        view = scroller.clientWidth;
        total = scroller.scrollWidth;
        gap = Number.parseFloat(getComputedStyle(scroller).columnGap) || 0;
        centers = items.map((item) => {
          const r = item.getBoundingClientRect();
          return r.left - box.left + left + r.width / 2;
        });
        cardWidth = items[0]?.offsetWidth || 1;
        step = cardWidth + gap;
        trackWidth = thumbRef.current?.parentElement?.clientWidth ?? 0;
      };

      const frame = () => {
        raf = 0;
        setCanScrollLeft(left > 4);
        setCanScrollRight(left < total - view - 4);

        const thumb = thumbRef.current;
        if (thumb && total > 0) {
          thumb.style.transform = `translate3d(${((left / total) * trackWidth).toFixed(1)}px, 0, 0) scaleX(${Math.min(1, view / total).toFixed(4)})`;
        }

        const middle = left + view / 2;
        let nearest = 0;
        let nearestDistance = Infinity;
        cards.forEach((card, index) => {
          if (!card) return;
          const distance = Math.abs((centers[index] ?? 0) - middle);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
          // The card nearest the middle is in focus; its neighbours fall off.
          const focus = narrow.matches ? Math.max(0, 1 - distance / (cardWidth * 1.05)) : 1;
          const next = `scale(${(0.86 + 0.14 * focus).toFixed(3)}) skewX(${lean.deg.toFixed(2)}deg)|${(0.42 + 0.58 * focus).toFixed(3)}`;
          if (written[index] === next) return;
          written[index] = next;
          const [transform, opacity] = next.split("|");
          card.style.transform = transform;
          card.style.opacity = opacity;
        });

        const counter = counterRef.current;
        if (counter) {
          // Phone: the card in the middle. Wide screen: how many have been
          // brought fully into view so far — N cards fit when N·step − gap is
          // inside the scrolled edge; the extra pixel absorbs fluid widths.
          const value = narrow.matches
            ? nearest + 1
            : Math.min(items.length, Math.max(1, Math.floor((left + view + gap + 1) / step)));
          const text = pad(value);
          if (counter.textContent !== text) counter.textContent = text;
        }
      };
      const request = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const remeasure = () => {
        measure();
        written.length = 0;
        request();
      };

      const leanTo = gsap.quickTo(lean, "deg", { duration: 0.55, ease: "power3", onUpdate: request });
      let lastLeft = scroller.scrollLeft;
      let lastTime = performance.now();
      let release = 0;

      const onScroll = () => {
        left = scroller.scrollLeft;
        request();
        if (reduce) return;
        // Lean with the speed of the scroll, and straighten when it stops.
        const now = performance.now();
        const velocity = (left - lastLeft) / Math.max(16, now - lastTime);
        lastLeft = left;
        lastTime = now;
        leanTo(gsap.utils.clamp(-7, 7, -velocity * 6));
        window.clearTimeout(release);
        release = window.setTimeout(() => leanTo(0), 90);
      };

      // Layers only while the rail is near the screen: a dozen cards each in
      // three rails would otherwise all hold GPU memory for the whole visit.
      const live = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) wrap.setAttribute("data-live", "");
          else wrap.removeAttribute("data-live");
        },
        { rootMargin: "200px 0px" },
      );
      live.observe(wrap);

      remeasure();
      scroller.addEventListener("scroll", onScroll, { passive: true });
      const observer = new ResizeObserver(remeasure);
      observer.observe(scroller);
      narrow.addEventListener("change", remeasure);

      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(release);
        scroller.removeEventListener("scroll", onScroll);
        observer.disconnect();
        live.disconnect();
        narrow.removeEventListener("change", remeasure);
      };
    },
    { scope: wrapRef, dependencies: [isRail, media.length] },
  );

  /* ---------------------------------------------------------------------- */
  /* Rail controls                                                           */
  /* ---------------------------------------------------------------------- */
  const stepOf = (el: HTMLElement) => {
    const card = el.querySelector<HTMLElement>("li");
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    return card ? card.offsetWidth + gap : el.clientWidth * 0.6;
  };

  const scrollByCards = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = stepOf(el);
    // Two cards at a time on a wide screen, where five or six are in view.
    const count = el.clientWidth > step * 3 ? 2 : 1;
    el.scrollBy({ left: step * direction * count, behavior: "smooth" });
  }, []);

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
  /* Pointer drag with a throw — desktop only; touch keeps native scrolling  */
  /*                                                                         */
  /* Snapping is suspended while the rail is held and thrown, and the throw  */
  /* is aimed at a card boundary, so when snapping returns there is nothing  */
  /* left for it to correct.                                                 */
  /* ---------------------------------------------------------------------- */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false, lastX: 0, lastTime: 0, velocity: 0 });

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (!isRail || event.pointerType === "touch" || event.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    gsap.killTweensOf(el, "scrollLeft");
    el.style.scrollSnapType = "none";
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const el = scrollerRef.current;
    const state = drag.current;
    if (!state.active || !el) return;
    const dx = event.clientX - state.startX;
    if (Math.abs(dx) > 4) state.moved = true;
    el.scrollLeft = state.startScroll - dx;
    const now = performance.now();
    state.velocity = (event.clientX - state.lastX) / Math.max(8, now - state.lastTime);
    state.lastX = event.clientX;
    state.lastTime = now;
  };

  const endDrag = () => {
    const el = scrollerRef.current;
    const state = drag.current;
    if (!state.active || !el) return;
    state.active = false;

    const restoreSnap = () => {
      el.style.scrollSnapType = "";
    };
    if (!state.moved) return restoreSnap();

    const step = stepOf(el);
    const max = el.scrollWidth - el.clientWidth;
    const thrown = el.scrollLeft - state.velocity * 380;
    const target = gsap.utils.clamp(0, max, Math.round(thrown / step) * step);
    gsap.to(el, { scrollLeft: target, duration: 1.1, ease: "expo.out", onComplete: restoreSnap });
  };

  // Suppress the click that ends a drag so dragging never opens a post.
  const onClickCapture = (event: React.MouseEvent<HTMLUListElement>) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  };

  const sizes = isRail
    ? "(max-width: 639px) 64vw, (max-width: 1023px) 34vw, 250px"
    : "(max-width: 719px) 31vw, (max-width: 1023px) 19vw, 230px";

  return (
    /* The controls live OUTSIDE the chrome frame: the frame's clip-path would
       otherwise cut them where they meet its edge. */
    <div
      ref={wrapRef}
      className={[
        styles.wrap,
        isRail ? styles.rail : styles.grid,
        shape === "story" ? styles.story : styles.post,
      ].join(" ")}
      style={{ "--cols-wide": wideColumns } as React.CSSProperties}
      data-gallery=""
    >
      <ChromeFrame metal notch={16} className={styles.frame} innerClassName={styles.frameInner} nodes brackets>
        <ul
          ref={scrollerRef}
          className={styles.scroller}
          aria-label={label}
          tabIndex={isRail ? 0 : undefined}
          onKeyDown={isRail ? onKeyDown : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          data-cursor={isRail ? "drag" : undefined}
        >
          {media.map((item, index) => (
            <li
              key={item.id}
              className={styles.item}
              data-stagger=""
              data-beyond-grid={index >= instagramFeed.mobileGridCount ? "" : undefined}
              data-beyond-wide={index >= wideCount ? "" : undefined}
            >
              <InstagramCard
                media={item}
                showCaption
                sizes={sizes}
                priority={index < 3}
                onOpen={() => openLightbox(index)}
              />
            </li>
          ))}
        </ul>
      </ChromeFrame>

      {isRail ? (
        <div className={styles.controls}>
          <span className={styles.track} aria-hidden="true">
            <span ref={thumbRef} className={styles.thumb} />
          </span>

          <span className={styles.count} aria-hidden="true">
            <span ref={counterRef} className="u-index">
              {pad(1)}
            </span>
            <span className={styles.countTotal}>/ {pad(media.length)}</span>
          </span>

          <span className={styles.arrows}>
            <button
              type="button"
              className={styles.control}
              onClick={() => scrollByCards(-1)}
              aria-label={instagramContent.previousLabel}
              disabled={!canScrollLeft}
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => scrollByCards(1)}
              aria-label={instagramContent.nextLabel}
              disabled={!canScrollRight}
            >
              <ChevronRightIcon size={18} />
            </button>
          </span>
        </div>
      ) : null}

      <MediaLightbox
        items={media}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={closeLightbox}
        morphed={morphed}
      />
    </div>
  );
}
