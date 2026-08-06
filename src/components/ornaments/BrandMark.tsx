import { artist } from "@/config/site-config";

/**
 * The Valentine Tattoo logo mark — the artist's own chrome sigil.
 *
 * Supplied as a transparent PNG and shipped trimmed to its bounding box at
 * three display sizes (96/192/288px tall, ~5–24 KB each). Sized by height
 * because the mark is taller than it is wide (ratio 0.697).
 */
const LOGO_RATIO = 704 / 1010;

export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    /* <picture> keeps this out of the image optimizer: the asset is already a
       trimmed WebP exported at the three sizes it is displayed at. */
    <picture>
      <source
        type="image/webp"
        srcSet="/brand/logo-valentine-96.webp 96w, /brand/logo-valentine-192.webp 192w, /brand/logo-valentine-288.webp 288w"
        sizes={`${Math.round(size * LOGO_RATIO)}px`}
      />
      <img
        src="/brand/logo-valentine-192.webp"
        alt=""
        aria-hidden="true"
        className={className}
        width={Math.round(size * LOGO_RATIO)}
        height={size}
        decoding="async"
        style={{ pointerEvents: "none", flex: "0 0 auto", display: "block" }}
      />
    </picture>
  );
}

/**
 * Logo lockup: mark + wordmark. Rendered as real text so it stays editable and
 * selectable; only the mark is vector art.
 */
export function BrandLockup({
  markSize = 34,
  className,
  wordmarkClassName,
  nameClassName,
  taglineClassName,
}: {
  markSize?: number;
  className?: string;
  wordmarkClassName?: string;
  nameClassName?: string;
  taglineClassName?: string;
}) {
  return (
    <span className={className}>
      <LogoMark size={markSize} />
      <span className={wordmarkClassName}>
        <span className={nameClassName}>{artist.brand.split(" ")[0].toUpperCase()}</span>
        <span className={taglineClassName}>{artist.brand.split(" ")[1].toUpperCase()}</span>
      </span>
    </span>
  );
}

/**
 * Hand-drawn style signature. A signature is a brand asset, not body copy, so it
 * ships as a vector path rather than pulling in a third font family. The
 * accessible name is provided by the caller.
 */
export function SignatureMark({
  className,
  width = 230,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={width}
      viewBox="0 0 520 150"
      fill="none"
      style={{ pointerEvents: "none" }}
    >
      <g
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        {/* Valentina */}
        <path d="M10 38c10 34 24 58 38 68 6-22 10-46 12-72" />
        <path d="M74 96c9-20 18-26 22-18 3 8-2 18-9 22-6 3-10 0-9-6" />
        <path d="M87 100c8 8 16 6 24-6" />
        <path d="M114 94c11-20 17-38 18-52-6 19-12 38-14 54 0 10 5 13 13 5" />
        <path d="M137 96c8-14 14-17 17-9 2 6-3 11-11 12 3 7 11 7 18-3" />
        <path d="M164 96c6-14 11-19 15-17 5 3 2 11-1 20 6-13 12-19 17-17 5 3 2 12-3 23" />
        <path d="M200 88c5-2 9-5 12-9" />
        <path d="M209 99c5-13 8-21 10-25" />
        <path d="M221 63c2-3 5-3 5 0s-4 5-5 0Z" />
        <path d="M228 99c6-14 11-19 16-17 5 3 2 12-3 23" />
        <path d="M252 96c8-14 14-17 17-9 2 6-3 12-9 14 3 6 9 6 15-2" />
        {/* Stucchi — offset right so the two words read as separate. */}
        <g transform="translate(26 0)">
        <path d="M300 62c-9-9-22-6-23 5-2 12 22 15 22 29 0 11-14 14-23 5" />
        <path d="M310 74h25" />
        <path d="M326 62c-6 19-9 31-9 37 0 8 6 9 14 2" />
        <path d="M348 88c-3 9-5 17 2 19 8 2 14-9 18-22-3 12-4 20 2 22 6 1 11-6 14-14" />
        <path d="M398 86c-6-6-15-2-17 8-1 9 8 14 15 6" />
        <path d="M426 86c-6-6-15-2-17 8-1 9 8 14 15 6" />
        <path d="M436 99c8-21 13-38 15-50-5 17-9 33-10 50 6-14 12-20 17-17 5 3 2 11-2 18" />
        <path d="M472 99c5-13 8-21 10-25" />
        <path d="M484 63c2-3 5-3 5 0s-4 5-5 0Z" />
        </g>
        {/* Underline flourish */}
        <path d="M322 124c46 16 106 10 172-22" opacity="0.5" strokeWidth="2.4" />
      </g>
    </svg>
  );
}
