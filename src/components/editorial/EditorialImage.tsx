import type { EditorialImage as ImageData } from "@/content/editorial/types";
import styles from "./EditorialArticle.module.css";

/** Existing gallery exports already contain responsive WebP variants. */
export function EditorialImage({ image, className, eager = false, sizes = "(max-width: 699px) 90vw, 45vw" }: {
  image: ImageData; className?: string; eager?: boolean; sizes?: string;
}) {
  const gallery = !image.src.endsWith(".webp");
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(" ")}>
      <div className={styles.photo}>
        <picture>
          {gallery ? <source type="image/webp" srcSet={`${image.src}-400.webp 400w, ${image.src}-800.webp 800w, ${image.src}-1200.webp 1200w`} sizes={sizes} /> : null}
          {/* Responsive, pre-optimized local files bypass a redundant optimizer pass. */}
          <img
            src={gallery ? `${image.src}-800.webp` : image.src} alt={image.alt}
            width={image.width ?? 800} height={image.height ?? 1000}
            style={{ objectPosition: image.position }}
            loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async"
          />
        </picture>
        <span className={styles.photoCorner} aria-hidden="true" />
      </div>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}
