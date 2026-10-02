"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * The page's motion vocabulary.
 *
 * One concept runs through all of it — molten chrome:
 *
 *   forge    things arrive the way metal is struck: fast, then a long settle,
 *            and a glint runs across the surface as they land
 *   stencil  type and images are revealed as if a stencil were lifted off
 *            them — lines rise out of a cut, cards open from their foot
 *   decode   labels resolve out of noise, the way a sigil is read
 *
 * Every reveal is staged in CSS behind `.js-motion` (see globals.css), so the
 * page is complete without JavaScript, and everything here stands down under
 * `prefers-reduced-motion` — the caller never runs it.
 */

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);

/** The house curve: a strike, then a long, quiet settle. */
export const FORGE = CustomEase.create("vt-forge", "0.16,1,0.3,1");

/** Glyphs a label passes through on its way to being read. Plain ASCII: the
 *  text face is a latin subset, and a fallback glyph would jolt the width. */
export const NOISE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/\\<>";
const DIGITS = "0123456789";

export function queryAll<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/**
 * Readies elements for GSAP so that starting their tweens reads nothing back
 * from the page.
 *
 * The first time GSAP animates an element it reads the element's transform,
 * and wherever opacity is not set inline it reads the computed value. Done
 * one element at a time inside an animation frame, after other tweens have
 * written theirs, every one of those reads makes the browser recompute style,
 * and often layout, on the spot: Chrome's trace counted hundreds of them over
 * a scroll of the page. Here all the reads happen together, before anything
 * is written, so they cost one pass; then the opacity the tweens start from
 * is written inline, where GSAP finds it without asking the browser.
 */
export function prime(elements: readonly Element[], opacity?: number) {
  elements.forEach((element) => gsap.getProperty(element, "x"));
  if (opacity === undefined) return;
  const value = String(opacity);
  elements.forEach((element) => {
    (element as HTMLElement).style.opacity = value;
  });
}

/**
 * Removes inline transforms GSAP left behind, without GSAP.
 *
 * `clearProps: "transform"` makes GSAP read the element's transform back at
 * once, to refresh its cache — a forced style and layout pass in the middle
 * of a frame, per element. Every caller here has just animated to identity,
 * which is what GSAP's cache already holds.
 */
export function dropTransform(elements: readonly Element[]) {
  elements.forEach((element) => {
    (element as HTMLElement).style.removeProperty("transform");
  });
}

/**
 * Puts elements in the state their reveal starts from; the reveal is then a
 * plain `to`.
 *
 * This is `fromTo` without the read-back. A fromTo applies its from-values
 * when it is created, and when it actually starts it takes them off and puts
 * them back, to record them afresh — a write and a read in the same instant,
 * which makes the browser recompute style, often layout too, on the spot: for
 * every element of every stagger, in the middle of a frame. Here the
 * from-state is read and written once, in two passes (see `prime`), and the
 * tween that follows only reads values GSAP already holds.
 */
export function stage(
  elements: readonly Element[],
  from: gsap.TweenVars,
  { opacity, origin }: { opacity?: number; origin?: string } = {},
) {
  if (!elements.length) return;
  prime(elements, opacity);
  if (origin) {
    elements.forEach((element) => {
      (element as HTMLElement).style.transformOrigin = origin;
    });
  }
  gsap.set(elements, from);
}

/* -------------------------------------------------------------------------- */
/* Split helpers                                                              */
/*                                                                            */
/* Splits are made at the moment a reveal plays — fonts are loaded and widths */
/* are final by then — and undone when it finishes, so the DOM React rendered */
/* is the DOM that stays.                                                     */
/* -------------------------------------------------------------------------- */

function markMasks(split: SplitText) {
  split.masks.forEach((mask) => mask.classList.add("vt-line-mask"));
}

/**
 * Title, letter by letter: each line rises out of its own cut and every letter
 * turns up off its foot. The chrome gradient is re-laid per letter so the metal
 * stays continuous across the word while the letters move independently.
 */
function playChromeTitle(heading: HTMLElement, visual: HTMLElement) {
  const split = SplitText.create(visual, {
    type: "lines,words,chars",
    mask: "lines",
    charsClass: "vt-char",
    aria: "none",
  });
  markMasks(split);
  const chars = split.chars as HTMLElement[];

  // Every measurement first, then every write: alternating them forced a
  // fresh layout for each letter.
  const box = heading.getBoundingClientRect();
  const offsets = chars.map((char) => {
    const r = char.getBoundingClientRect();
    return [box.left - r.left, box.top - r.top];
  });
  stage(chars, { yPercent: 115, rotationX: -88, transformPerspective: 600 }, { opacity: 0, origin: "50% 100%" });
  heading.style.setProperty("--title-w", `${box.width}px`);
  heading.style.setProperty("--title-h", `${box.height}px`);
  chars.forEach((char, index) => {
    char.style.setProperty("--char-x", `${offsets[index][0]}px`);
    char.style.setProperty("--char-y", `${offsets[index][1]}px`);
  });
  heading.classList.add("is-split");

  const finish = () => {
    split.revert();
    heading.classList.remove("is-split");
  };

  const tl = gsap.timeline({ onComplete: finish });
  tl.to(
    chars,
    {
      yPercent: 0,
      rotationX: 0,
      opacity: 1,
      duration: 1.25,
      ease: FORGE,
      stagger: { each: 0.028, from: "start" },
    },
    0,
  );
  // No highlight sweep during the flip: every letter carries its own copy of
  // the gradient, and moving it repainted each one on every frame. The letters
  // are layers of their own while they turn, so as they are they cost nothing.
  return tl;
}

/**
 * Words surface one after another, each turning up off its baseline.
 *
 * No blur: a filter on every word made each one its own blurred layer for the
 * length of the reveal, and on a phone that was the most expensive thing on
 * the screen. Opacity and a small turn read just as soft.
 */
function playWords(target: HTMLElement) {
  const split = SplitText.create(target, { type: "words", aria: "none" });
  // A percentage of each word's own height, not ems: GSAP converts ems to
  // pixels by measuring a probe element, a forced layout per word.
  stage(split.words, { yPercent: 42, rotationX: -55, transformPerspective: 500 }, { opacity: 0, origin: "50% 100%" });
  return gsap.to(
    split.words,
    {
      opacity: 1,
      yPercent: 0,
      rotationX: 0,
      duration: 1.1,
      ease: FORGE,
      stagger: 0.03,
      onComplete: () => split.revert(),
    },
  );
}

/** Lines rise out of their own cut, one after another. */
function playLines(target: HTMLElement) {
  const split = SplitText.create(target, { type: "lines", mask: "lines", aria: "none" });
  markMasks(split);
  stage(split.lines, { yPercent: 108 });
  return gsap.to(
    split.lines,
    {
      yPercent: 0,
      duration: 1.25,
      ease: FORGE,
      stagger: 0.085,
      onComplete: () => split.revert(),
    },
  );
}

/** The decodes in flight, so a replay can cancel the one it replaces. */
const decoding = new WeakMap<HTMLElement, number>();

/**
 * A label resolving out of noise. The text it resolves to is the text it
 * already holds — captured before the first scramble, so a replay can never
 * resolve to a half-scrambled string.
 *
 * The label is held at its set size while it scrambles: the noise glyphs are
 * not the width of the letters they stand in for, and without the hold every
 * hairline and neighbour beside a label would twitch with it.
 */
export function playDecode(target: HTMLElement, duration?: number) {
  const text = target.dataset.decodeText ?? target.textContent ?? "";
  target.dataset.decodeText = text;
  const pool = target.dataset.decode === "digits" ? DIGITS : NOISE;
  const total = (duration ?? (pool === DIGITS ? 0.9 : Math.min(1.6, 0.5 + text.length * 0.035))) * 1000;

  const running = decoding.get(target);
  if (running) cancelAnimationFrame(running);

  // Held at its set size, and its layout and paint kept to itself, so the
  // noise inside it never moves or repaints anything around it — the
  // hairlines and neighbours beside a label stay perfectly still.
  const box = target.getBoundingClientRect();
  const inline = getComputedStyle(target).display === "inline";
  if (inline) target.style.display = "inline-block";
  target.style.width = `${box.width}px`;
  target.style.height = `${box.height}px`;
  target.style.contain = "layout paint";

  const release = () => {
    target.textContent = text;
    target.style.removeProperty("width");
    target.style.removeProperty("height");
    target.style.removeProperty("contain");
    if (inline) target.style.removeProperty("display");
    decoding.delete(target);
  };

  // The letters settle left to right over the last two-thirds; the noise is
  // redrawn about twenty times a second, which reads as flicker at a third of
  // the cost of redrawing it every frame.
  const start = performance.now();
  let drawn = -Infinity;
  const frame = (now: number) => {
    const t = (now - start) / total;
    if (t >= 1) return release();
    if (now - drawn >= 50) {
      drawn = now;
      const settled = Math.floor(Math.max(0, (t - 0.3) / 0.7) * text.length);
      let shown = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        shown += text[i] === " " ? " " : pool[(Math.random() * pool.length) | 0];
      }
      target.textContent = shown;
    }
    decoding.set(target, requestAnimationFrame(frame));
  };
  decoding.set(target, requestAnimationFrame(frame));
}

/* -------------------------------------------------------------------------- */
/* The reveal builder                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Adds one `data-reveal-child` to a block's timeline at `at` seconds.
 *
 *   (none)  rises and fades in
 *   mask    a chrome title is set letter by letter; anything else (the hero's
 *           lettering, an image) is drawn up out of a clip
 *   words   words surface one after another, turning up off the baseline
 *   lines   lines rise out of their own cut
 *   forge   struck into place: scale, blur and a flash of light
 *   track   letter-spacing closes from wide to set
 *
 * Inside any child, `[data-draw]` hairlines are drawn and `[data-decode]`
 * labels resolve, all starting with the child.
 */
export function addChildReveal(
  tl: gsap.core.Timeline,
  child: HTMLElement,
  at: number,
  /** A block with no children names its own variant: `data-reveal="words"`. */
  variant: string = child.dataset.revealChild ?? "",
) {

  queryAll<HTMLElement>("[data-draw]", child).forEach((line) => {
    stage([line], { scaleX: 0 }, { origin: `${line.dataset.draw || "center"} 50%` });
    tl.to(line, { scaleX: 1, duration: 1.3, ease: FORGE }, at + 0.05);
  });

  queryAll<HTMLElement>("[data-decode]", child).forEach((label) => {
    // Captured now, before anything has scrambled it.
    label.dataset.decodeText = label.dataset.decodeText ?? label.textContent ?? "";
    tl.add(() => {
      playDecode(label);
    }, at + 0.1);
  });

  switch (variant) {
    case "mask": {
      const heading = child.matches(".u-chrome-text")
        ? child
        : child.querySelector<HTMLElement>(".u-chrome-text");
      const visual = heading?.querySelector<HTMLElement>('[aria-hidden="true"]');

      if (heading && visual) {
        tl.set(child, { opacity: 1, y: 0 }, at);
        tl.add(() => {
          // Written directly: through GSAP an unset clip-path is a computed
          // read, mid-frame.
          child.style.clipPath = "none";
          playChromeTitle(heading, visual);
        }, at);
        return;
      }

      // Lettering or image: drawn up out of a clip whose end state is wider
      // than the box, so the bloom around chrome type is never cut.
      // Pixels, not the staging rule's ems: GSAP converts ems by measuring.
      stage([child], { clipPath: "inset(0% 0% 100% 0%)", y: 8 }, { opacity: 0 });
      tl.to(
        child,
        {
          clipPath: "inset(-30% -8% -30% -8%)",
          y: 0,
          opacity: 1,
          duration: 1.6,
          ease: FORGE,
          onComplete: () => {
            // Inline `none`, never a cleared value: clearing would hand the
            // element back to the hidden staging rule in globals.css.
            child.style.clipPath = "none";
          },
        },
        at,
      );
      return;
    }

    case "words":
    case "lines": {
      tl.set(child, { opacity: 1, y: 0 }, at);
      tl.add(() => {
        if (variant === "words") playWords(child);
        else playLines(child);
      }, at);
      return;
    }

    case "forge": {
      stage([child], { scale: 0.72, y: 0, filter: "blur(12px) brightness(2.2)" }, { opacity: 0 });
      tl.to(
        child,
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 1.8,
          ease: FORGE,
          clearProps: "filter",
        },
        at,
      );
      return;
    }

    case "track": {
      stage([child], { y: 0, letterSpacing: "0.9em" }, { opacity: 0 });
      tl.to(child, { opacity: 1, letterSpacing: "0.28em", duration: 2, ease: FORGE, clearProps: "letterSpacing" }, at);
      return;
    }

    default: {
      tl.to(child, { opacity: 1, y: 0, duration: 1.6, ease: "expo.out" }, at);
    }
  }
}

/**
 * A chrome frame closing on its panel: the corner brackets converge from just
 * outside it and the nodes on its cuts flash alight.
 *
 * Returned paused, with its from-values already applied: build it while the
 * frame is still off screen, and play it when the frame arrives.
 */
export function frameClose(frame: Element) {
  const brackets = frame.querySelector<HTMLElement>(':scope > [data-frame-ornament="brackets"]');
  const nodes = frame.querySelector<HTMLElement>(':scope > [data-frame-ornament="nodes"]');
  const tl = gsap.timeline({ paused: true });
  // Both wrappers are the size of the whole panel, so no filters here: a blur
  // over a box that large was a full-panel raster on every frame of it.
  if (brackets) {
    stage([brackets], { scale: 1.08 }, { opacity: 0 });
    tl.to(
      brackets,
      { opacity: 1, scale: 1, duration: 1.4, ease: FORGE, onComplete: () => dropTransform([brackets]) },
      0,
    );
  }
  if (nodes) {
    nodes.style.opacity = "0";
    // A short electric flicker as the points take the current.
    tl.to(
      nodes,
      {
        keyframes: [
          { opacity: 1, duration: 0.07 },
          { opacity: 0.25, duration: 0.09 },
          { opacity: 1, duration: 0.6, ease: "power2.out" },
        ],
      },
      0.45,
    );
  }
  return tl;
}

/**
 * The arc over a chapter heading, drawn outward from its keystone: the hairline
 * curves run out from the centre, the star turns into place, the beads light.
 */
export function addArcReveal(tl: gsap.core.Timeline, arc: SVGSVGElement, at: number) {
  const lines = queryAll<SVGPathElement>("[data-arc-line]", arc);
  const star = arc.querySelector<SVGGElement>("[data-arc-star]");
  const dots = queryAll<SVGCircleElement>("[data-arc-dot]", arc);

  gsap.set(lines, { drawSVG: "50% 50%" });
  tl.to(lines, { drawSVG: "0% 100%", duration: 1.8, ease: "expo.inOut", stagger: 0.12 }, at);
  if (star) {
    gsap.set(star, { scale: 0, rotation: -120, opacity: 0, svgOrigin: "310 15" });
    tl.to(star, { scale: 1, rotation: 0, opacity: 1, duration: 1.4, ease: FORGE }, at + 0.35);
  }
  dots.forEach((dot) => {
    dot.style.opacity = "0";
  });
  tl.to(
    dots,
    { opacity: (i, el) => Number(el.getAttribute("data-arc-dot")) || 0.6, duration: 0.6, stagger: 0.08 },
    at + 0.7,
  );
}
