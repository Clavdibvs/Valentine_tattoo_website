import { SigilBadge } from "@/components/ornaments/SigilOrnament";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ExternalIcon, InstagramIcon } from "@/components/ui/Icons";
import { instagramContent } from "@/content/site-content";
import { instagramFeed, instagramProfile } from "@/config/site-config";
import type { InstagramErrorReason } from "@/lib/instagram/types";

import styles from "./FeedStates.module.css";

/**
 * Skeleton shown while the server component streams the feed in.
 * Uses the exact card geometry so no layout shift occurs on swap.
 */
export function LoadingSkeleton() {
  return (
    <div className={styles.skeletonWrap} role="status" aria-live="polite">
      <span className="sr-only">{instagramContent.loadingLabel}</span>
      <ul className={styles.skeletonList} aria-hidden="true">
        {Array.from({ length: instagramFeed.limit }).map((_, i) => (
          <li key={i} className={styles.skeletonItem}>
            <span className={styles.shimmer} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Shown when the live feed cannot be reached, is empty, or has not been
 * configured. Always offers the real profile as a direct route — the section
 * never falls back to invented posts in production.
 */
export function IntegrationErrorState({
  title,
  body,
  reason,
  detail,
}: {
  title: string;
  body: string;
  reason?: InstagramErrorReason | "not-configured";
  detail?: string;
}) {
  const showDeveloperDetail = process.env.NODE_ENV !== "production" && detail;

  return (
    <div className={styles.state} role="status">
      <SigilBadge size={38} className={styles.stateMark} />
      <p className={styles.stateTitle}>{title}</p>
      <p className={styles.stateBody}>{body}</p>

      {showDeveloperDetail ? (
        <p className={styles.devDetail}>
          <strong>Dev only</strong> — {reason}: {detail}
        </p>
      ) : null}

      <ChromeButton
        href={instagramProfile.url}
        external
        size="sm"
        tracked
        icon={<InstagramIcon size={17} />}
        trailing={<ExternalIcon size={14} />}
        className={styles.stateCta}
      >
        {instagramProfile.handleWithAt}
      </ChromeButton>
    </div>
  );
}

/** Development-only banner clarifying that the tiles are sample data. */
export function DemoDataNotice() {
  return (
    <p className={styles.demoNotice} role="status">
      <span className={styles.demoDot} aria-hidden="true" />
      Dati dimostrativi (solo sviluppo) — configura <code>INSTAGRAM_USER_ID</code> e{" "}
      <code>INSTAGRAM_ACCESS_TOKEN</code> per il feed reale.
    </p>
  );
}
