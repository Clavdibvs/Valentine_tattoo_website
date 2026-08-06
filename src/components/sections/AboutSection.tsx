import { CornerSigil, SigilBadge } from "@/components/ornaments/SigilOrnament";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { PortraitFrame } from "@/components/ui/PortraitFrame";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { aboutContent } from "@/content/site-content";
import { artist } from "@/config/site-config";
import { resolvePortrait } from "@/lib/portrait";

import styles from "./AboutSection.module.css";

export function AboutSection() {
  const portrait = resolvePortrait("main");

  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-title">

      <div className={styles.decorLayer} aria-hidden="true" data-decor="">
        <CornerSigil corner="top-left" className={styles.cornerTop} opacity={0.42} />
        <CornerSigil corner="bottom-left" className={styles.cornerBottomLeft} opacity={0.55} />
        <CornerSigil corner="bottom-right" className={styles.cornerBottomRight} opacity={0.45} />
      </div>

      <SideGlyphRail side="left" index="07" />
      <SideGlyphRail side="right" words={["CUSTOM", "PLACEMENT", "TRIGGIANO"]} />

      <div className={`container ${styles.grid}`}>
        {/* -------------------------------------------------------------- */}
        {/* Heading                                                         */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.headArea}>
          <SectionHeading
            id="about-title"
            eyebrow={aboutContent.eyebrow}
            lines={aboutContent.titleLines}
            accessibleTitle={aboutContent.titleAccessible}
            align="start"
            className={styles.heading}
          />
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Portrait card                                                   */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.mediaArea} data-reveal="">
          <ChromeFrame
            metal
            notch={18}
            className={styles.portraitFrame}
            innerClassName={styles.portraitInner}
            brackets
          >
            <div className={styles.portraitMask} data-portrait-mask="">
              <PortraitFrame
                src={portrait}
                alt={aboutContent.portraitAlt}
                sizes="(max-width: 699px) 88vw, (max-width: 1023px) 42vw, 40vw"
                ratio="4 / 5"
              />
            </div>

            {/* The name is set as real text. A drawn signature would be an
                invented artefact, so the caption stays typographic. */}
            <div className={styles.signature}>
              <span className={styles.signatureName}>{artist.name}</span>
              <span className={`u-micro ${styles.signatureRole}`}>
                {aboutContent.signatureRole}
              </span>
            </div>
          </ChromeFrame>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Copy                                                            */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.copyArea} data-reveal="">
          <p className={`u-eyebrow ${styles.columnEyebrow}`} data-reveal-child="">
            <span>{aboutContent.columnEyebrow}</span>
            <SigilStar size={11} />
          </p>

          {aboutContent.paragraphs.map((paragraph, index) => (
            <p key={index} className={styles.paragraph} data-reveal-child="">
              {paragraph.map((segment, i) => (
                <span key={i} className={segment.emphasis ? "u-strong" : undefined}>
                  {segment.text}
                </span>
              ))}
            </p>
          ))}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Qualitative strip — replaces the fabricated numeric claims       */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.stripArea} data-reveal="">
          <ChromeFrame notch={14} className={styles.strip} innerClassName={styles.stripInner} nodes>
            <ul className={styles.stripList}>
              {aboutContent.qualities.map((quality) => (
                <li key={quality.id} className={styles.stripItem} data-reveal-child="">
                  <SigilBadge size={24} className={styles.stripIcon} />
                  <span className={styles.stripText}>
                    <span className={styles.stripTitle}>{quality.title}</span>
                    <span className={styles.stripDescription}>{quality.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </ChromeFrame>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* CTA                                                             */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.ctaArea} data-reveal="">
          <ChromeButton
            href="#instagram"
            size="md"
            tracked
            className={styles.cta}
            icon={<SigilStar size={14} />}
            trailing={<ArrowRightIcon size={17} />}
          >
            {aboutContent.cta}
          </ChromeButton>
        </div>
      </div>
    </section>
  );
}
