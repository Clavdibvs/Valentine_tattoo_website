import { LogoMark } from "@/components/ornaments/BrandMark";
import { SigilDiamond } from "@/components/ornaments/SigilStar";
import { InstagramIcon } from "@/components/ui/Icons";
import { bookingContent, heroContent, siteChromeContent } from "@/content/site-content";
import { artist, instagramProfile } from "@/config/site-config";

import styles from "./SiteFooter.module.css";

/**
 * The foot of the page: the mark, the name, where she works, and the legal
 * line.
 *
 * It used to be the legal line alone, which let a page this dark and this
 * long simply stop. It is still not a navigation footer — the FAQ above it
 * already ends on the two ways to get in touch — just a signature: the brand
 * set once more, quietly, the way a print ends on its maker's mark. The mark
 * is struck into place and the name closes up from wide tracking as it
 * arrives.
 *
 * A `<footer>` landmark rather than a section: it carries no heading and is
 * not part of the navigable content.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.rule} aria-hidden="true" />

        <div className={styles.signature} data-reveal="">
          <span className={styles.markWrap} data-reveal-child="forge">
            <LogoMark size={64} className={styles.mark} />
          </span>
          <p className={styles.brand}>
            <span className={styles.brandName} data-reveal-child="track">
              {artist.brand.split(" ")[0]}
            </span>
            <span className={styles.brandTagline} data-reveal-child="">
              {artist.brand.split(" ")[1]}
            </span>
          </p>
          {/* Same break as the hero's eyebrow: never a separator left hanging
              at the end of a line. */}
          <p className={styles.tagline} data-reveal-child="">
            <span className={styles.taglinePair}>
              <span data-decode="">{heroContent.eyebrowItems[0]}</span>
              <SigilDiamond size={5} />
              <span data-decode="">{heroContent.eyebrowItems[1]}</span>
            </span>
            <SigilDiamond size={5} className={styles.taglineJoin} />
            <span data-decode="">{heroContent.eyebrowItems[2]}</span>
          </p>
          <p className={styles.place} data-reveal-child="words">
            {siteChromeContent.footerPlace}
          </p>
        </div>

        <ul className={styles.links} data-reveal="">
          <li>
            <a
              href={instagramProfile.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <InstagramIcon size={16} />
              <span>{instagramProfile.handleWithAt}</span>
            </a>
          </li>
          <li aria-hidden="true" className={styles.linkMark}>
            <SigilDiamond size={6} />
          </li>
          <li>
            <a href="#home" className={styles.link}>
              <span>{siteChromeContent.backToTop}</span>
              <span className={styles.up} aria-hidden="true">
                ↑
              </span>
            </a>
          </li>
        </ul>

        <p className={styles.legal} data-reveal="">
          <span>{bookingContent.legal.copyright}</span>
          <span aria-hidden="true" className={styles.legalDot} />
          <span>{bookingContent.legal.privacy}</span>
        </p>
      </div>
    </footer>
  );
}
