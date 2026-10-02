import { Suspense } from "react";

import { DemoDataNotice, IntegrationErrorState, LoadingSkeleton } from "@/components/instagram/FeedStates";
import { InstagramFeed } from "@/components/instagram/InstagramFeed";
import { OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ExternalIcon, InstagramIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { heroContent, instagramContent } from "@/content/site-content";
import { instagramProfile } from "@/config/site-config";
import { hasLocalGallery, localFeed } from "@/lib/gallery";
import { fetchInstagramFeed } from "@/lib/instagram/client";

import styles from "./InstagramSection.module.css";

/**
 * The feed: the first thing after the hero, and the page's main body of work.
 *
 * It opens the second movement of the page, so it keeps the full heading — the
 * arc over the eyebrow — and shows the posts as a wall rather than a strip.
 * The plates carry the corner ornaments; the hand-built SVG copies that used
 * to sit here hidden are no longer rendered.
 */
export function InstagramSection() {
  return (
    <section id="instagram" className={`section ${styles.instagram}`} aria-labelledby="instagram-title">
      <SideGlyphRail side="left" index="02" />
      <SideGlyphRail side="right" words={heroContent.railWords} />

      <div className={`container ${styles.inner}`}>
        <SectionHeading
          id="instagram-title"
          index="02"
          eyebrow={instagramContent.eyebrow}
          lines={[instagramContent.title]}
          align="center"
          arc
          divider={false}
          className={styles.heading}
        />

        <p className={styles.supporting} data-reveal="words">
          {instagramContent.supporting}
        </p>

        <OrnamentDivider className={styles.headDivider} width="280px" />

        {/* Streamed in so the rest of the page is never blocked by the API. */}
        <Suspense fallback={<FeedShell><LoadingSkeleton variant="grid" /></FeedShell>}>
          <FeedContent />
        </Suspense>

        <div className={styles.footer} data-reveal="">
          <p className={`u-label ${styles.footerEyebrow}`}>
            <SigilStar size={10} />
            <span data-decode="">{instagramContent.footerEyebrow}</span>
            <SigilStar size={10} />
          </p>

          <ChromeButton
            href={instagramProfile.url}
            external
            size="md"
            tracked
            icon={<InstagramIcon size={19} />}
            trailing={<ExternalIcon size={14} />}
            className={styles.cta}
            magnetic
          >
            {instagramContent.cta}
          </ChromeButton>
        </div>
      </div>
    </section>
  );
}

/**
 * The chrome panel that frames the gallery in every state.
 *
 * Deliberately NOT a `data-reveal` block: this subtree streams in from a
 * Suspense boundary, and letting GSAP style it before React hydrates it causes
 * a hydration mismatch. The gallery stages its own arrival instead.
 */
function FeedShell({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  /** Narrows the panel: a short message should not span the gallery's width. */
  compact?: boolean;
}) {
  return (
    <div className={[styles.feedArea, compact ? styles.feedAreaCompact : ""].filter(Boolean).join(" ")}>
      <ChromeFrame
        metal
        notch={16}
        className={styles.feedFrame}
        innerClassName={styles.feedInner}
        nodes
        brackets
      >
        {children}
      </ChromeFrame>
    </div>
  );
}

async function FeedContent() {
  const feed = await fetchInstagramFeed();

  /*
   * The live API wins when it is configured and answering. Otherwise the
   * exported media takes over: real posts, just a snapshot rather than a feed.
   * The demo placeholders are only ever used when neither exists.
   */
  if (feed.status !== "ok" || feed.source === "demo") {
    if (hasLocalGallery("feed")) {
      return (
        <div className={styles.feedArea}>
          <InstagramFeed media={localFeed()} variant="grid" />
        </div>
      );
    }
  }

  if (feed.status === "ok") {
    return (
      <>
        {feed.source === "demo" ? <DemoDataNotice /> : null}
        <div className={styles.feedArea}>
          <InstagramFeed media={feed.media} variant="grid" />
        </div>
      </>
    );
  }

  if (feed.status === "empty") {
    return (
      <FeedShell compact>
        <IntegrationErrorState
          title={instagramContent.emptyTitle}
          body={instagramContent.emptyBody}
        />
      </FeedShell>
    );
  }

  if (feed.status === "not-configured") {
    return (
      <FeedShell compact>
        <IntegrationErrorState
          title={instagramContent.unavailableTitle}
          body={instagramContent.unavailableBody}
          reason="not-configured"
          detail="INSTAGRAM_USER_ID / INSTAGRAM_ACCESS_TOKEN are not set."
        />
      </FeedShell>
    );
  }

  return (
    <FeedShell compact>
      <IntegrationErrorState
        title={instagramContent.unavailableTitle}
        body={instagramContent.unavailableBody}
        reason={feed.reason}
        detail={feed.message}
      />
    </FeedShell>
  );
}
