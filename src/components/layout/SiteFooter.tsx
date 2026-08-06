import { bookingContent } from "@/content/site-content";

import styles from "./SiteFooter.module.css";

/**
 * Copyright and privacy line, at the very bottom of the page.
 *
 * A `<footer>` landmark rather than a section: it carries no heading and is not
 * part of the navigable content.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.legal}>
          <span>{bookingContent.legal.copyright}</span>
          <span aria-hidden="true" className={styles.legalDot} />
          <span>{bookingContent.legal.privacy}</span>
        </p>
      </div>
    </footer>
  );
}
