import Image from "next/image";

import { CarouselIcon, ReelIcon } from "@/components/ui/Icons";
import { instagramContent } from "@/content/site-content";
import { isDemoUrl } from "@/lib/instagram/demo-data";
import type { InstagramMedia } from "@/lib/instagram/types";

import styles from "./InstagramCard.module.css";

/**
 * A single feed tile. Always an anchor to the real Instagram permalink.
 *
 * No engagement metrics are rendered: the API does not return them for this
 * permission scope and inventing them is not acceptable.
 */
export function InstagramCard({
  media,
  sizes,
  priority = false,
  showCaption = false,
  className,
}: {
  media: InstagramMedia;
  sizes: string;
  priority?: boolean;
  showCaption?: boolean;
  className?: string;
}) {
  const typeLabel = instagramContent.mediaTypeLabels[media.mediaType];
  const alt = media.captionExcerpt
    ? `${typeLabel} su Instagram: ${media.captionExcerpt}`
    : `${typeLabel} pubblicato su Instagram`;

  return (
    <a
      href={media.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={[styles.card, className].filter(Boolean).join(" ")}
      data-media-card=""
    >
      <span className={styles.media}>
        {media.srcSet ? (
          /*
           * Locally exported media: the build script already emitted the three
           * widths, so a plain <picture> serves them directly. Routing them
           * through the optimizer would re-encode assets that are already WebP
           * at exactly the sizes they are displayed at.
           */
          <picture>
            <source type="image/webp" srcSet={media.srcSet} sizes={sizes} />
            <img
              src={media.displayUrl}
              alt={alt}
              className={styles.image}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          </picture>
        ) : (
          <Image
            src={media.displayUrl}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            unoptimized={isDemoUrl(media.displayUrl)}
            className={styles.image}
          />
        )}
        <span className={styles.overlay} aria-hidden="true" />
      </span>

      {media.mediaType !== "IMAGE" ? (
        <span className={styles.badge} aria-hidden="true">
          {media.mediaType === "CAROUSEL_ALBUM" ? <CarouselIcon size={15} /> : <ReelIcon size={15} />}
        </span>
      ) : null}

      {showCaption && media.captionExcerpt ? (
        <span className={styles.caption} aria-hidden="true">
          {media.captionExcerpt}
        </span>
      ) : null}

      <span className={styles.corner} aria-hidden="true" />
    </a>
  );
}
