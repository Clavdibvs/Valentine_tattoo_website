import { Fragment } from "react";

import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilDiamond, SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ArrowRightIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { heroContent } from "@/content/site-content";
import { instagramProfile, navItems, whatsapp } from "@/config/site-config";

import styles from "./HeroSection.module.css";

/**
 * The opening screen.
 *
 * ## Locked to the plate on a wide screen
 *
 * The hero plate is stretched to the viewport, and the composition the client
 * drew lives on it: a star hanging at 28.9% across, the large sigil filling
 * the right half. The copy used to sit in the centred content grid, so the
 * wordmark slid out from under its star as the window widened — 130px adrift
 * at 1920. It is now placed in the plate's own coordinates: the wordmark is
 * sized in viewport units, centred on the star's axis and set just below it,
 * so the lettering and the art stay one composition at every desktop size.
 *
 * The hand-built SVG sigil and corner ornaments that used to be rendered here,
 * hidden, are gone from the markup — the plate carries all of it. The
 * components remain in `ornaments/` should a plate ever need replacing.
 */
export function HeroSection() {
  const { titleAccessible, introSegments, eyebrowItems, supportingItems } = heroContent;

  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <SideGlyphRail side="left" index="01" />
      <SideGlyphRail side="right" words={heroContent.railWords} />

      {/* `data-hero-copy` lifts away faster than the plate as the hero scrolls
          out; the plate itself never moves out of its own parallax. */}
      <div className={styles.inner} data-hero-copy="">
        <div className={styles.copy} data-reveal="">
          {/* Mobile and tablet only: on a wide screen the plate's star owns the
              space above the wordmark. */}
          <p className={`u-eyebrow ${styles.eyebrow}`} data-reveal-child="">
            <span className={styles.eyebrowPair}>
              <span data-decode="">{eyebrowItems[0]}</span>
              <SigilStar size={9} className={styles.eyebrowStar} />
              <span data-decode="">{eyebrowItems[1]}</span>
            </span>
            <SigilStar size={9} className={`${styles.eyebrowStar} ${styles.eyebrowJoin}`} />
            <span data-decode="">{eyebrowItems[2]}</span>
          </p>

          {/*
            The wordmark is the artist's own chrome lettering, supplied as a
            transparent PNG. It ships as an image because the letterforms are
            custom art with no font equivalent — but the heading stays a real
            semantic <h1> whose accessible name is plain text.
          */}
          <h1
            id="hero-title"
            className={styles.title}
            data-reveal-child="mask"
            data-hero-title=""
          >
            <span className="sr-only">{titleAccessible}</span>
            <picture>
              <source
                type="image/webp"
                srcSet="/brand/wordmark-valentine-640.webp 640w, /brand/wordmark-valentine-960.webp 960w, /brand/wordmark-valentine-1400.webp 1400w"
                sizes="(max-width: 1023px) 90vw, min(40vw, 66vh)"
              />
              <img
                src="/brand/wordmark-valentine-960.webp"
                alt=""
                aria-hidden="true"
                className={styles.wordmark}
                width={1343}
                height={614}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            {/* A bar of light masked to the lettering itself: it crosses the
                chrome as the hero lands and follows the pointer after. */}
            <span className={styles.glint} aria-hidden="true" data-glint="">
              <span className={styles.glintBar} data-glint-bar="" />
            </span>
          </h1>

          {/*
            Two paragraphs, one per breakpoint. Each is `display: none` at the
            other size, which also removes it from the accessibility tree — so
            the copy is never announced twice.
          */}
          <p className={styles.intro} data-reveal-child="words">
            {introSegments.map((segment, i) => (
              <span key={i} className={segment.emphasis ? "u-strong" : undefined}>
                {segment.text.split("\n").map((part, j) => (
                  <Fragment key={j}>
                    {j > 0 ? <br /> : null}
                    {part}
                  </Fragment>
                ))}
              </span>
            ))}
          </p>

          <p className={styles.introShort} data-reveal-child="words">
            {heroContent.introShort}
          </p>

          <div className={styles.ctas} data-reveal-child="">
            <ChromeButton
              href="#booking"
              variant="solid"
              icon={<SigilStar size={14} />}
              trailing={<ArrowRightIcon size={17} />}
              className={styles.cta}
              magnetic
            >
              {heroContent.bookingCta}
            </ChromeButton>

            {whatsapp.url ? (
              <ChromeButton
                href={whatsapp.url}
                external
                icon={<WhatsAppIcon size={19} />}
                className={styles.cta}
                magnetic
              >
                {heroContent.primaryCta}
              </ChromeButton>
            ) : (
              <ChromeButton
                href={instagramProfile.directMessageUrl}
                external
                icon={<InstagramIcon size={19} />}
                className={styles.cta}
                magnetic
              >
                {heroContent.secondaryCta}
              </ChromeButton>
            )}
          </div>

          <p className={styles.supporting} data-reveal-child="">
            {supportingItems.map((item, i) => (
              <Fragment key={item}>
                {i > 0 ? <SigilDiamond size={6} className={styles.supportingMark} /> : null}
                <span data-decode="">{item}</span>
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* Points at whatever follows the hero — Instagram since the reorder. */}
      <a
        href={`#${navItems[1].id}`}
        className={styles.scroll}
        data-reveal=""
        /* Arrives last, once the copy has had time to be read. */
        data-reveal-delay="2"
      >
        <span className={`u-micro ${styles.scrollLabel}`} data-scroll-fade="">
          {heroContent.scrollLabel}
        </span>
        <span className={styles.scrollLine} aria-hidden="true" data-scroll-fade="">
          <span className={styles.scrollPulse} data-scroll-pulse="" />
        </span>
      </a>
    </section>
  );
}
