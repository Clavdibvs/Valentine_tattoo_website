import Image from "next/image";

import { SigilBadge } from "@/components/ornaments/SigilOrnament";
import { aboutContent } from "@/content/site-content";

import styles from "./PortraitFrame.module.css";

/**
 * Portrait slot.
 *
 * When the approved photograph exists it is rendered normally. When it does
 * not, a visibly neutral placeholder takes its place — it is never presented as
 * a picture of Valentina, and it preserves the frame's dimensions so the layout
 * does not shift once the real asset lands.
 */
export function PortraitFrame({
  src,
  alt,
  priority = false,
  sizes,
  className,
  ratio = "3 / 4",
  rounded = false,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  ratio?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={[styles.slot, rounded ? styles.rounded : "", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={styles.image}
        />
      ) : (
        <PortraitPlaceholder />
      )}
      <span className={styles.vignette} aria-hidden="true" data-decor="" />
    </div>
  );
}

function PortraitPlaceholder() {
  return (
    <div className={styles.placeholder} role="img" aria-label={aboutContent.portraitPlaceholderNotice}>
      <span className={styles.placeholderGlow} aria-hidden="true" />
      <SigilBadge size={56} className={styles.placeholderMark} />
      <span className={`u-micro ${styles.placeholderText}`}>
        {aboutContent.portraitPlaceholderNotice}
      </span>
    </div>
  );
}
