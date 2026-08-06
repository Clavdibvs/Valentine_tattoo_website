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

/** Desktop plates, in the order they were drawn to follow one another. */
const DESKTOP_PLATES = ["hero", "about", "instagram", "booking", "booking-tail"] as const;

/** Mobile plates. Fewer were supplied, so the set cycles. */
const MOBILE_PLATES = ["hero", "about", "instagram", "booking"] as const;

/**
 * How many plates the strip lays down.
 *
 * The plates share the document height equally, so more of them means each one
 * stretches less. Seven sections make a document roughly nine screens tall, and
 * nine plates keeps every one close to its natural aspect ratio.
 *
 * Repeats cost nothing to download: cycling five source images over nine slots
 * is still five network requests, the rest come from cache.
 */
const PLATE_COUNT = 9;

export function PageBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true" data-decor="">
      <div className={styles.strip} data-backdrop-strip="">
        {Array.from({ length: PLATE_COUNT }, (_, index) => (
          <Plate
            key={index}
            desktop={DESKTOP_PLATES[index % DESKTOP_PLATES.length]}
            mobile={MOBILE_PLATES[index % MOBILE_PLATES.length]}
            first={index === 0}
            last={index === PLATE_COUNT - 1}
            priority={index === 0}
          />
        ))}
      </div>

      {/* Centre band where the copy lives, knocked back so text never competes
          with bright chrome. The edges keep the ornaments at full strength. */}
      <span className={styles.scrim} />
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
