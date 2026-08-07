/**
 * How the ornamental strip drifts against the page.
 *
 * Stated once because two elements move on it: the strip you can see, and the
 * copy of it that the molten layer uses as its luminance matte. If those two
 * ever disagreed by a pixel the effect would slide off the artwork it is
 * supposed to be flowing through, so neither is allowed its own numbers.
 *
 * The strip is 112% of the document tall (see `PageBackdrop.module.css`), so it
 * has 12% of spare height to travel through and still cover the page at every
 * scroll position. Moving it by 12/112 of its own height spends exactly that
 * slack: the backdrop ends up drifting 12% slower than the content.
 */
export const BACKDROP_STRIP_HEIGHT_PERCENT = 112;
export const BACKDROP_SLACK_PERCENT = 12;

export const BACKDROP_PARALLAX = {
  yPercent: -(BACKDROP_SLACK_PERCENT / BACKDROP_STRIP_HEIGHT_PERCENT) * 100,
  /** Long enough to feel like weight, short enough not to trail the page. */
  scrub: 1.2,
} as const;

/** Every strip that must move together — the painted one and the matte. */
export const BACKDROP_STRIP_SELECTOR = "[data-backdrop-strip]";
