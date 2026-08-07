import { MoltenBackdrop } from "./MoltenBackdrop";

import styles from "./PageBackdrop.module.css";

/**
 * One continuous ornamental backdrop for the whole page.
 *
 * ## Why a single strip instead of one plate per section
 *
 * The supplied plates were drawn to stack: ornaments running off the bottom of
 * one resume at the top of the next. Giving each section its own plate meant
 * each one faded out and back in at its own boundaries, which read as a stack of
 * separate pictures — visible horizontal banding.
 *
 * So the plates are laid out once, as a single column spanning the entire
 * document, and the sections simply sit on top of it. Nothing fades at a section
 * boundary because the artwork does not know where the boundaries are.
 *
 * ## How the joins disappear
 *
 * Two things do the work:
 *
 * 1. **`mix-blend-mode: screen`** — the artwork is bright chrome on pure black,
 *    and under `screen` black contributes nothing. Overlapping plates therefore
 *    composite additively, exactly like stacked exposures, with no edge.
 * 2. **A soft alpha mask** on each plate's top and bottom removes the thin
 *    horizontal frame line every plate carries, which would otherwise survive
 *    the blend as a visible rule.
 *
 * The first plate keeps its top frame and the last keeps its bottom frame, so
 * the page still opens and closes with an intact border.
 *
 * The plates are flex children sharing the document height equally, so the strip
 * adapts to any page length without JavaScript. They stretch vertically rather
 * than crop, which suits artwork whose ornaments hug the left and right edges.
 *
 * Decorative only: `aria-hidden`, `pointer-events: none`, always behind content.
 */

/**
 * The hero plate is used once and never again: it carries the large sigil that
 * belongs to the opening screen, and seeing it a second time halfway down the
 * page reads as a mistake. Everything below the hero cycles the remaining art.
 */
const HERO_PLATE = { desktop: "hero", mobile: "hero" } as const;

/** Plates for everything after the hero, in the order they were drawn. */
const BODY_PLATES = [
  { desktop: "about", mobile: "about" },
  { desktop: "instagram", mobile: "instagram" },
  { desktop: "booking", mobile: "booking" },
  { desktop: "booking-tail", mobile: "about" },
] as const;

/**
 * Plates laid down after the hero.
 *
 * They share whatever height the hero leaves, so more of them means each one is
 * stretched less vertically. Thirteen puts the desktop plates within 1% of their
 * natural aspect ratio and keeps a long crossfade between neighbours; mobile
 * plates are portrait and shorter relative to the viewport, so they stretch
 * more, which abstract edge ornaments absorb without showing.
 *
 * Repeats cost nothing to download: cycling four images over eleven slots is
 * still four network requests, the rest come from cache.
 */
const BODY_PLATE_COUNT = 13;

export function PageBackdrop({ waitForIntro = false }: { waitForIntro?: boolean }) {
  return (
    <div className={styles.backdrop} aria-hidden="true" data-decor="">
      <PlateStrip />

      {/*
        Molten light through the metal. It renders a second PlateStrip as its
        luminance matte — the same component, so the matte cannot drift out of
        step with the artwork it is matting.
      */}
      <MoltenBackdrop waitForIntro={waitForIntro}>
        <PlateStrip matte />
      </MoltenBackdrop>

      {/* Centre band where the copy lives, knocked back so text never competes
          with bright chrome. The edges keep the ornaments at full strength. */}
      <span className={styles.scrim} />
    </div>
  );
}

/**
 * The column of plates.
 *
 * Rendered twice: once as the backdrop itself, once inside the molten layer as
 * its matte. Both carry `data-backdrop-strip`, so a single parallax tween moves
 * them together and no second set of positioning numbers exists to fall out of
 * sync.
 */
function PlateStrip({ matte = false }: { matte?: boolean }) {
  return (
    <div
      className={[styles.strip, matte ? styles.matteStrip : ""].filter(Boolean).join(" ")}
      data-backdrop-strip=""
    >
      <Plate {...HERO_PLATE} first last={false} priority={!matte} />

      {Array.from({ length: BODY_PLATE_COUNT }, (_, index) => (
        <Plate
          key={index}
          {...BODY_PLATES[index % BODY_PLATES.length]}
          first={false}
          last={index === BODY_PLATE_COUNT - 1}
          priority={false}
        />
      ))}
    </div>
  );
}

function Plate({
  desktop,
  mobile,
  first,
  last,
  priority,
}: {
  desktop: string;
  mobile: string;
  first: boolean;
  last: boolean;
  priority: boolean;
}) {
  const d = `/backdrops/${desktop}-desktop`;
  const m = `/backdrops/${mobile}-mobile`;

  return (
    <span
      className={[styles.plate, first ? styles.first : "", last ? styles.last : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <picture>
        {/* Landscape art on desktop, portrait art below 1024px. */}
        <source
          media="(min-width: 1024px)"
          type="image/webp"
          srcSet={`${d}-1440.webp 1440w, ${d}-2048.webp 2048w, ${d}-2688.webp 2688w`}
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet={`${m}-480.webp 480w, ${m}-760.webp 760w, ${m}-1080.webp 1080w`}
          sizes="100vw"
        />
        <img
          src={`${d}-2048.webp`}
          alt=""
          className={styles.image}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding="async"
        />
      </picture>
    </span>
  );
}
