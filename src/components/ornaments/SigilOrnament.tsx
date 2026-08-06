import { CORNER_SIGIL, HERO_SIGIL, thornHighlight, thornPath } from "./sigil-geometry";

/**
 * The large cyber-tribal chrome sigil.
 *
 * Decorative only — `aria-hidden`, `pointer-events: none`, and it never sits
 * above interactive content. Built entirely from SVG paths so it scales
 * losslessly and costs a few kilobytes instead of a multi-megabyte render.
 */
export function SigilOrnament({
  className,
  variant = "hero",
  /** Marks this instance as the target of the hero's pointer parallax. */
  pointerTarget = false,
}: {
  className?: string;
  variant?: "hero" | "card";
  pointerTarget?: boolean;
}) {
  const { viewBox, origin, voids, primary, secondary, whips, webs, nodes } = HERO_SIGIL;
  const soft = variant === "card";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={viewBox}
      style={{ pointerEvents: "none", overflow: "visible" }}
      data-decor=""
      {...(pointerTarget ? { "data-hero-sigil": "" } : {})}
    >
      {/* Faint construction ring behind the form. */}
      <circle
        cx={origin.x}
        cy={origin.y}
        r={246}
        fill="none"
        stroke="url(#vt-hairline)"
        strokeWidth={1}
        opacity={soft ? 0.35 : 0.55}
      />
      <circle
        cx={origin.x}
        cy={origin.y}
        r={186}
        fill="none"
        stroke="url(#vt-hairline)"
        strokeWidth={0.75}
        opacity={soft ? 0.22 : 0.35}
      />

      <g opacity={soft ? 0.55 : 1}>
        {/* Membranes sit furthest back and read as shadowed surfaces. */}
        <g fill="url(#vt-chrome-soft)" opacity={0.5}>
          {webs.map((d, i) => (
            <path key={`w${i}`} d={d} />
          ))}
        </g>

        {/* Thin whips behind the main mass. */}
        <g fill="url(#vt-chrome-alt)" opacity={0.85}>
          {whips.map((t, i) => (
            <path key={`wh${i}`} d={thornPath(origin.x, origin.y, t)} />
          ))}
        </g>

        {/* Long structural blades. */}
        <g fill="url(#vt-chrome)">
          {primary.map((t, i) => (
            <path key={`p${i}`} d={thornPath(origin.x, origin.y, t)} />
          ))}
        </g>

        {/* Shorter counter-blades in the alternate metal so surfaces separate. */}
        <g fill="url(#vt-chrome-alt)" opacity={0.92}>
          {secondary.map((t, i) => (
            <path key={`s${i}`} d={thornPath(origin.x, origin.y, t)} />
          ))}
        </g>

        {/* Specular pass — thin crescents riding only some of the blades, so
            the metal keeps dark valleys instead of flattening to white. */}
        <g fill="#ffffff" opacity={0.3}>
          {primary
            .filter((_, i) => i % 2 === 0)
            .map((t, i) => (
              <path key={`ph${i}`} d={thornHighlight(origin.x, origin.y, t)} />
            ))}
        </g>

        {/* Dark rim pass — separates overlapping blades. */}
        <g fill="none" stroke="#050506" strokeWidth={1.4} opacity={0.55}>
          {primary.map((t, i) => (
            <path key={`pr${i}`} d={thornPath(origin.x, origin.y, t)} />
          ))}
        </g>

        {/* Biomechanical voids. */}
        <g>
          {voids.map((v, i) => (
            <g key={`v${i}`} transform={`rotate(${v.rotate} ${v.cx} ${v.cy})`}>
              <ellipse cx={v.cx} cy={v.cy} rx={v.rx} ry={v.ry} fill="#050505" />
              <ellipse
                cx={v.cx}
                cy={v.cy}
                rx={v.rx}
                ry={v.ry}
                fill="none"
                stroke="url(#vt-chrome)"
                strokeWidth={2.6}
              />
              <ellipse
                cx={v.cx - v.rx * 0.18}
                cy={v.cy - v.ry * 0.3}
                rx={v.rx * 0.7}
                ry={v.ry * 0.55}
                fill="none"
                stroke="#ffffff"
                strokeWidth={0.9}
                opacity={0.4}
              />
            </g>
          ))}
        </g>

        {/* Luminous tips. */}
        <g>
          {nodes.map((n, i) => (
            <g key={`n${i}`}>
              <circle cx={n.x} cy={n.y} r={n.r * 7} fill="url(#vt-bloom)" />
              <circle cx={n.x} cy={n.y} r={n.r} fill="#ffffff" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

/**
 * Corner ornament wrapping the outer edges of a section.
 * `corner` selects which corner it anchors to; the geometry is mirrored via
 * transform rather than duplicated.
 */
export function CornerSigil({
  corner = "top-left",
  className,
  opacity = 0.72,
}: {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  opacity?: number;
}) {
  const { viewBox, origin, spikes, arcs } = CORNER_SIGIL;

  const flip = {
    "top-left": "",
    "top-right": "scale(-1,1) translate(-340,0)",
    "bottom-left": "scale(1,-1) translate(0,-340)",
    "bottom-right": "scale(-1,-1) translate(-340,-340)",
  }[corner];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={viewBox}
      style={{ pointerEvents: "none", overflow: "visible" }}
      data-decor=""
      opacity={opacity}
    >
      <g transform={flip}>
        <g fill="url(#vt-chrome)">
          {spikes.map((t, i) => (
            <path key={`c${i}`} d={thornPath(origin.x, origin.y, t)} />
          ))}
        </g>
        <g fill="#ffffff" opacity={0.34}>
          {spikes.slice(0, 3).map((t, i) => (
            <path key={`ch${i}`} d={thornHighlight(origin.x, origin.y, t)} />
          ))}
        </g>
        <g fill="none" stroke="url(#vt-hairline)" strokeWidth={1}>
          {arcs.map((d, i) => (
            <path key={`a${i}`} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/**
 * Compact sigil badge — the mark used inside buttons, the quote card and the
 * reassurance strip.
 */
export function SigilBadge({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ pointerEvents: "none", flex: "0 0 auto" }}
    >
      <g fill="url(#vt-chrome)">
        <path d="M32 2c1.2 12 4.3 19.4 10.6 22.6L58 32l-15.4 7.4C36.3 42.6 33.2 50 32 62c-1.2-12-4.3-19.4-10.6-22.6L6 32l15.4-7.4C27.7 21.4 30.8 14 32 2Z" />
        <path d="M13 12c5.4 2.3 8.6 6 9.8 11.3-4.6-2.6-8-6.3-9.8-11.3ZM51 12c-1.8 5-5.2 8.7-9.8 11.3C42.4 18 45.6 14.3 51 12ZM13 52c1.8-5 5.2-8.7 9.8-11.3C21.6 46 18.4 49.7 13 52ZM51 52c-5.4-2.3-8.6-6-9.8-11.3 4.6 2.6 8 6.3 9.8 11.3Z" />
      </g>
      <circle cx="32" cy="32" r="4.4" fill="#050505" />
      <circle cx="32" cy="32" r="4.4" fill="none" stroke="url(#vt-chrome)" strokeWidth="1.4" />
    </svg>
  );
}
