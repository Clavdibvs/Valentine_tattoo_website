import { SigilBadge } from "@/components/ornaments/SigilOrnament";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ExternalIcon, InstagramIcon } from "@/components/ui/Icons";
import { PortraitFrame } from "@/components/ui/PortraitFrame";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { aboutContent } from "@/content/site-content";
import { artist, instagramProfile } from "@/config/site-config";
import { resolvePortrait } from "@/lib/portrait";

import styles from "./AboutSection.module.css";

/**
 * About: the artist, her language, her process.
 *
 * The copy is long and it sits on the artwork — on a wide screen its column
 * reaches the plates' right-hand ornaments — so it carries its own pool of
 * shadow (`.text-pool`) instead of the art being dimmed for everyone. The
 * first paragraph is set as a lead in the display serif; the portrait holds
 * still beside the text while it is read.
 */
export function AboutSection() {
  const portrait = resolvePortrait("main");
  const [lead, ...body] = aboutContent.paragraphs;

  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-title">
      <SideGlyphRail side="left" index="07" />
      <SideGlyphRail side="right" words={["CUSTOM", "PLACEMENT", "TRIGGIANO"]} />

      <div className={`container ${styles.grid}`}>
        <div className={styles.headArea}>
          <SectionHeading
            id="about-title"
            index="07"
            eyebrow={aboutContent.eyebrow}
            lines={aboutContent.titleLines}
            accessibleTitle={aboutContent.titleAccessible}
            align="startDesktop"
            size="md"
            divider={false}
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
              {/* The reveal: a dark veil over the photograph, and two leaves
                  that part from a slit down the middle. Open at rest — the
                  animation layer closes them only when it is going to play. */}
              <span className={styles.portraitVeil} aria-hidden="true" data-portrait-veil="" />
              <span className={`${styles.blade} ${styles.bladeLeft}`} aria-hidden="true" data-blade="" />
              <span className={`${styles.blade} ${styles.bladeRight}`} aria-hidden="true" data-blade="" />
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
        <div className={`text-pool ${styles.copyArea}`} data-reveal="">
          <p className={styles.lead} data-reveal-child="" data-scrub-words="">
            {lead.map((segment, i) => (
              <span key={i} className={segment.emphasis ? styles.leadStrong : undefined}>
                {segment.text}
              </span>
            ))}
          </p>

          {body.map((paragraph, index) => (
            <p key={index} className={styles.paragraph} data-reveal-child="lines">
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
                    <span className={styles.stripTitle} data-decode="">
                      {quality.title}
                    </span>
                    <span className={styles.stripDescription}>{quality.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </ChromeFrame>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* CTA — the label promises Instagram, so it goes to Instagram.    */}
        {/* -------------------------------------------------------------- */}
        <div className={styles.ctaArea} data-reveal="">
          <ChromeButton
            href={instagramProfile.url}
            external
            size="md"
            tracked
            className={styles.cta}
            magnetic
            icon={<InstagramIcon size={18} />}
            trailing={<ExternalIcon size={14} />}
          >
            {aboutContent.cta}
          </ChromeButton>
        </div>
      </div>
    </section>
  );
}
