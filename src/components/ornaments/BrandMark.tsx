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
