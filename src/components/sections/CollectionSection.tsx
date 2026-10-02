import { Suspense } from "react";

import { DemoDataNotice, IntegrationErrorState, LoadingSkeleton } from "@/components/instagram/FeedStates";
import { InstagramFeed } from "@/components/instagram/InstagramFeed";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ExternalIcon, InstagramIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { collectionContent, instagramContent } from "@/content/site-content";
import { collections, type CollectionId } from "@/config/site-config";
import { hasLocalGallery, localCollection } from "@/lib/gallery";
import { fetchCollection } from "@/lib/instagram/collections";

import styles from "./InstagramSection.module.css";

/**
 * Creazioni, Flash and Merch.
 *
 * All three share the Instagram section's stylesheet, card and states, so the
 * page keeps one gallery language. What sets them apart from the feed is the
 * format — stories, shown as a rail rather than a wall — and a lighter
 * heading: they are one series of three, and repeating the feed's full arc
 * and ornament stack over each of them is what made the page read as a
 * template.
 *
 * The media come from the real feed filtered by caption markers: Instagram's
 * official API exposes no story-highlights edge. See `lib/instagram/collections`.
 */
export function CollectionSection({
  id,
  railIndex,
  railWords,
}: {
  id: CollectionId;
  /** Two-digit chapter index, shown in the eyebrow and on the side rail. */
  railIndex: string;
  railWords: readonly string[];
}) {
  const copy = collectionContent[id];
  const headingId = `${id}-title`;

  return (
    <section
      id={id}
      className={`section ${styles.instagram} ${styles.collection}`}
      aria-labelledby={headingId}
    >
      <SideGlyphRail side="left" index={railIndex} />
      <SideGlyphRail side="right" words={railWords} />

      <div className={`container ${styles.inner}`}>
        <SectionHeading
          id={headingId}
          index={railIndex}
          eyebrow={copy.eyebrow}
          lines={[copy.title]}
          align="center"
          size="md"
          divider={false}
          className={styles.heading}
        />

        <p className={styles.supporting} data-reveal="words">
          {copy.supporting}
        </p>

        <Suspense fallback={<Shell><LoadingSkeleton variant="rail" /></Shell>}>
          <CollectionContent id={id} />
        </Suspense>

        <div className={styles.footer} data-reveal="">
          {/* Opens the real Story Highlight this section mirrors. */}
          <ChromeButton
            href={collections[id].highlightUrl}
            external
            size="md"
            tracked
            icon={<InstagramIcon size={19} />}
            trailing={<ExternalIcon size={14} />}
            className={styles.cta}
            magnetic
          >
            {copy.cta}
          </ChromeButton>
        </div>
      </div>
    </section>
  );
}

function Shell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
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

async function CollectionContent({ id }: { id: CollectionId }) {
  const copy = collectionContent[id];
  const result = await fetchCollection(id);

  // Highlights are never available from the API, so the exported media is the
  // normal source here rather than a fallback.
  if ((result.status !== "ok" || result.source === "demo") && hasLocalGallery(id)) {
    return (
      <div className={styles.feedArea}>
        <InstagramFeed media={localCollection(id)} label={copy.carouselLabel} shape="story" variant="rail" />
      </div>
    );
  }

  if (result.status === "ok") {
    return (
      <>
        {result.source === "demo" ? <DemoDataNotice /> : null}
        <div className={styles.feedArea}>
          <InstagramFeed media={result.media} label={copy.carouselLabel} shape="story" variant="rail" />
        </div>
      </>
    );
  }

  if (result.status === "not-configured") {
    return (
      <Shell compact>
        <IntegrationErrorState
          title={instagramContent.unavailableTitle}
          body={instagramContent.unavailableBody}
          reason="not-configured"
          detail="INSTAGRAM_USER_ID / INSTAGRAM_ACCESS_TOKEN are not set."
          href={collections[id].highlightUrl}
          label="APRI LA RACCOLTA"
        />
      </Shell>
    );
  }

  if (result.status === "error") {
    return (
      <Shell compact>
        <IntegrationErrorState
          title={instagramContent.unavailableTitle}
          body={instagramContent.unavailableBody}
          detail={result.message}
          href={collections[id].highlightUrl}
          label="APRI LA RACCOLTA"
        />
      </Shell>
    );
  }

  return (
    <Shell compact>
      <IntegrationErrorState
        title={copy.emptyTitle}
        body={copy.emptyBody}
        href={collections[id].highlightUrl}
        label="APRI LA RACCOLTA"
      />
    </Shell>
  );
}
