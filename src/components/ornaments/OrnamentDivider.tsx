import { SigilDiamond, SigilStar } from "./SigilStar";

import styles from "./OrnamentDivider.module.css";

/**
 * Thin ornamental rule with a centred sigil — the separator that sits under
 * section headings and above the scroll indicator.
 */
export function OrnamentDivider({
  className,
  starSize = 16,
  width,
}: {
  className?: string;
  starSize?: number;
  width?: string;
}) {
  return (
    <div
      className={[styles.divider, className].filter(Boolean).join(" ")}
      style={width ? { maxWidth: width } : undefined}
      aria-hidden="true"
      data-decor=""
    >
      <span className={styles.rule} />
      <SigilDiamond size={6} className={styles.satellite} />
      <SigilStar size={starSize} className={styles.star} />
      <SigilDiamond size={6} className={styles.satellite} />
      <span className={styles.rule} />
    </div>
  );
}

/**
 * Wide ornamental arc used above centred section eyebrows.
 */
export function OrnamentArc({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox="0 0 620 60"
      fill="none"
      data-decor=""
      style={{ pointerEvents: "none" }}
    >
      <path
        d="M10 52C120 22 220 8 310 8s190 14 300 44"
        stroke="url(#vt-hairline)"
        strokeWidth="1"
      />
      <path d="M150 44c60-16 110-24 160-24s100 8 160 24" stroke="url(#vt-hairline)" strokeWidth="0.75" opacity="0.7" />
      <g fill="url(#vt-chrome)">
        <path d="M310 0c.5 7 1.9 11 4.6 12.4L322 15l-7.4 2.6C311.9 19 310.5 23 310 30c-.5-7-1.9-11-4.6-12.4L298 15l7.4-2.6C308.1 11 309.5 7 310 0Z" />
      </g>
      <circle cx="228" cy="26" r="1.6" fill="#fff" opacity="0.6" />
      <circle cx="392" cy="26" r="1.6" fill="#fff" opacity="0.6" />
      <circle cx="128" cy="38" r="1.2" fill="#fff" opacity="0.4" />
      <circle cx="492" cy="38" r="1.2" fill="#fff" opacity="0.4" />
    </svg>
  );
}
