import { Fragment } from "react";

import { CornerSigil, SigilOrnament } from "@/components/ornaments/SigilOrnament";
import { OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChevronDownIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { heroContent } from "@/content/site-content";
import { instagramProfile, navItems, whatsapp } from "@/config/site-config";

import styles from "./HeroSection.module.css";

export function HeroSection() {
  const { eyebrow, titleAccessible, introSegments, primaryCta, secondaryCta } = heroContent;

  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      {/* ---------------------------------------------------------------- */}
      {/* Decorative layers — never interactive                            */}
      {/* ---------------------------------------------------------------- */}

      <div className={styles.decorLayer} aria-hidden="true" data-decor="">
        <span data-drift="" className={styles.driftA}>
          <CornerSigil corner="top-left" className={styles.cornerTopLeft} opacity={0.55} />
        </span>
        <span data-drift="" className={styles.driftB}>
          <CornerSigil corner="bottom-left" className={styles.cornerBottomLeft} opacity={0.6} />
        </span>
        <span data-drift="" className={styles.driftC}>
          <CornerSigil corner="top-right" className={styles.cornerTopRight} opacity={0.5} />
        </span>
        <span data-drift="" className={styles.driftD}>
          <CornerSigil corner="bottom-right" className={styles.cornerBottomRight} opacity={0.5} />
        </span>
      </div>

      <SideGlyphRail side="left" index="01" />
      <SideGlyphRail side="right" words={heroContent.railWords} />

      <div className={`container ${styles.inner}`}>
        {/* -------------------------------------------------------------- */}
        {/* Copy column                                                     */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.copy} data-reveal="">
          <p className={`u-eyebrow ${styles.eyebrow}`} data-reveal-child="">
            <SigilStar size={11} />
            <span>{eyebrow}</span>
          </p>

          {/*
            The wordmark is the artist's own chrome lettering, supplied as a
            transparent PNG. It ships as an image because the letterforms are
            custom art with no font equivalent — but the heading stays a real
            semantic <h1> whose accessible name is plain text.
          */}
          <h1 id="hero-title" className={styles.title} data-reveal-child="">
            <span className="sr-only">{titleAccessible}</span>
            <picture>
              <source
                type="image/webp"
                srcSet="/brand/wordmark-valentine-640.webp 640w, /brand/wordmark-valentine-960.webp 960w, /brand/wordmark-valentine-1400.webp 1400w"
                sizes="(max-width: 1023px) 88vw, min(46vw, 620px)"
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
          </h1>

          <p className={styles.intro} data-reveal-child="">
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

          <div className={styles.ctas} data-reveal-child="">
            {whatsapp.url ? (
              <ChromeButton
                href={whatsapp.url}
                external
                icon={<WhatsAppIcon size={20} />}
                className={styles.cta}
              >
                {primaryCta}
              </ChromeButton>
            ) : null}

            <ChromeButton
              href={instagramProfile.url}
              external
              icon={<InstagramIcon size={20} />}
              className={styles.cta}
            >
              {secondaryCta}
            </ChromeButton>
          </div>

          <p className={styles.supporting} data-reveal-child="">
            {heroContent.supportingLine}
          </p>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Ornament column                                                 */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.artwork} aria-hidden="true" data-decor="" data-parallax="1.4">
          <SigilOrnament className={styles.mainSigil} pointerTarget />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Scroll indicator                                                  */}
      {/* ---------------------------------------------------------------- */}
      {/* Points at whatever follows the hero — Instagram since the reorder. */}
      <a href={`#${navItems[1].id}`} className={styles.scroll} data-reveal="">
        <OrnamentDivider className={styles.scrollDivider} starSize={14} width="320px" />
        <span className="u-micro">{heroContent.scrollLabel}</span>
        <ChevronDownIcon size={20} className={styles.scrollChevron} />
      </a>
    </section>
  );
}
