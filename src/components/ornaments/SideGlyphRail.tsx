import styles from "./SideGlyphRail.module.css";

/**
 * Vertical ornamental rail hugging the outer edges of the viewport on wide
 * screens.
 *
 * The reference screenshots put illegible pseudo-letters and a decorative
 * "666" here. Both are replaced: the glyphs are non-semantic ornamental SVG
 * symbols, and the numerals become the section index plus the brand monogram.
 * Everything is `aria-hidden` and hidden entirely below 1200px so it can never
 * become inaccessible microtext.
 */
export function SideGlyphRail({
  side,
  index,
  words,
  className,
}: {
  side: "left" | "right";
  /** Two-digit section index, e.g. "01". */
  index?: string;
  /** Short brand words stacked at the foot of the rail. */
  words?: readonly string[];
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-decor=""
      className={[styles.rail, styles[side], className].filter(Boolean).join(" ")}
    >
      <span className={styles.tick} />

      <svg viewBox="0 0 24 260" className={styles.glyphs} fill="none">
        <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          {/* Ornamental, non-semantic marks — no invented letterforms. */}
          <path d="M8 10v14M16 10v14" />
          <path d="M12 44l5 6-5 6-5-6 5-6Z" />
          <path d="M7 50h10" />
          <path d="M12 76l4 10-4 10-4-10 4-10Z" />
          <path d="M12 118v18M6 127h12" />
          <path d="M8 122l8 10M16 122l-8 10" opacity="0.6" />
          <path d="M12 156c4 4 4 10 0 14-4-4-4-10 0-14Z" />
          <path d="M6 186h12M9 192h6" />
          <path d="M12 214l6 8h-12l6-8Z" />
          <path d="M12 236v14" />
          <path d="M8 242h8" />
        </g>
        <circle cx="12" cy="98" r="1.6" fill="currentColor" />
        <circle cx="12" cy="172" r="1.6" fill="currentColor" />
      </svg>

      {index ? <span className={styles.index}>{index}</span> : null}

      <svg viewBox="0 0 24 120" className={styles.glyphs} fill="none">
        <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M12 6l5 8-5 8-5-8 5-8Z" />
          <path d="M6 38h12" />
          <path d="M12 54c5 5 5 12 0 17-5-5-5-12 0-17Z" />
          <path d="M12 88v16M7 94h10" />
        </g>
      </svg>

      {words?.length ? (
        <span className={styles.words}>
          {words.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </span>
      ) : null}

      <span className={styles.tick} />
    </div>
  );
}
