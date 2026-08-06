/**
 * Four-point sigil star — the site's most repeated ornamental mark.
 * Purely decorative: always aria-hidden and never interactive.
 */
export function SigilStar({
  size = 16,
  className,
  tone = "chrome",
}: {
  size?: number;
  className?: string;
  tone?: "chrome" | "line" | "solid";
}) {
  const fill =
    tone === "chrome" ? "url(#vt-chrome)" : tone === "solid" ? "currentColor" : "none";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ pointerEvents: "none", flex: "0 0 auto" }}
    >
      {/* Vertical/horizontal concave spikes forming a sharp four-point star. */}
      <path
        d="M12 0c.35 5.6 1.9 9.1 5.2 10.6L24 12l-6.8 1.4C13.9 14.9 12.35 18.4 12 24c-.35-5.6-1.9-9.1-5.2-10.6L0 12l6.8-1.4C10.1 9.1 11.65 5.6 12 0Z"
        fill={fill}
        stroke={tone === "line" ? "currentColor" : "none"}
        strokeWidth={tone === "line" ? 0.9 : 0}
      />
      {/* Diagonal micro-spikes. */}
      <path
        d="M12 6.6c.16 2.2.83 3.6 2.3 4.2L17 12l-2.7 1.2c-1.47.6-2.14 2-2.3 4.2-.16-2.2-.83-3.6-2.3-4.2L7 12l2.7-1.2c1.47-.6 2.14-2 2.3-4.2Z"
        fill={tone === "line" ? "none" : "#ffffff"}
        opacity={tone === "line" ? 0 : 0.55}
      />
    </svg>
  );
}

/**
 * Small diamond used as a secondary separator glyph.
 */
export function SigilDiamond({ size = 7, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ pointerEvents: "none", flex: "0 0 auto" }}
    >
      <path d="M5 0 6.6 3.4 10 5 6.6 6.6 5 10 3.4 6.6 0 5l3.4-1.6Z" fill="url(#vt-chrome)" />
    </svg>
  );
}
