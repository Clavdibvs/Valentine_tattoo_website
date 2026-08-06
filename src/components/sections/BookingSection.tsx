import { ConsultationForm } from "@/components/booking/ConsultationForm";
import { CornerSigil, SigilBadge, SigilOrnament } from "@/components/ornaments/SigilOrnament";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ArrowCircleIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingContent } from "@/content/site-content";
import { instagramProfile, whatsapp } from "@/config/site-config";

import styles from "./BookingSection.module.css";

export function BookingSection() {
  return (
    <section id="booking" className={`section ${styles.booking}`} aria-labelledby="booking-title">

      <div className={styles.decorLayer} aria-hidden="true" data-decor="">
        <CornerSigil corner="top-left" className={styles.cornerTopLeft} opacity={0.5} />
        <CornerSigil corner="top-right" className={styles.cornerTopRight} opacity={0.45} />
        <CornerSigil corner="bottom-left" className={styles.cornerBottomLeft} opacity={0.5} />
        <CornerSigil corner="bottom-right" className={styles.cornerBottomRight} opacity={0.45} />
      </div>

      <SideGlyphRail side="left" index="06" />
      <SideGlyphRail side="right" words={["CONSULENZA", "CUSTOM WORK"]} />

      <div className={`container ${styles.inner}`}>
        <SectionHeading
          id="booking-title"
          eyebrow={bookingContent.eyebrow}
          lines={bookingContent.titleLines}
          accessibleTitle={bookingContent.titleAccessible}
          align="center"
          className={styles.heading}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Contact card + form                                               */}
        {/*                                                                   */}
        {/* Laid out with grid areas rather than nesting, so the order can     */}
        {/* differ per breakpoint: the mobile reference puts the reassurance   */}
        {/* row between the CTAs and the form, the desktop one puts it below   */}
        {/* both panels.                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className={styles.panels}>
          <div className={styles.contactArea} data-reveal="">
            <ChromeFrame
              metal
              notch={16}
              className={styles.panel}
              innerClassName={styles.contactInner}
              brackets
              nodes
            >
              <SigilOrnament variant="card" className={styles.contactSigil} />

              <p className={`u-label ${styles.contactTitle}`}>
                <SigilStar size={11} />
                <span>{bookingContent.contactCardTitle}</span>
              </p>

              <p className={styles.intro}>{bookingContent.intro}</p>

              <div className={styles.channels}>
                {whatsapp.url ? (
                  <div className={styles.channel}>
                    <ChromeButton
                      href={whatsapp.url}
                      external
                      size="lg"
                      block
                      icon={<WhatsAppIcon size={24} />}
                      trailing={<ArrowCircleIcon size={34} />}
                    >
                      {bookingContent.whatsappCta}
                    </ChromeButton>
                    <p className={`u-micro ${styles.channelNote}`}>
                      {bookingContent.whatsappSupport}
                    </p>
                  </div>
                ) : (
                  <p className={styles.channelDisabled} role="note">
                    {bookingContent.whatsappUnconfigured}
                  </p>
                )}

                <div className={styles.channel}>
                  <ChromeButton
                    href={instagramProfile.directMessageUrl}
                    external
                    size="lg"
                    block
                    icon={<InstagramIcon size={24} />}
                    trailing={<ArrowCircleIcon size={34} />}
                  >
                    {bookingContent.instagramCta}
                  </ChromeButton>
                  <p className={`u-micro ${styles.channelNote}`}>
                    {bookingContent.instagramSupport}
                  </p>
                </div>
              </div>
            </ChromeFrame>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Reassurance strip                                                 */}
          {/* ---------------------------------------------------------------- */}
          <div className={styles.reassuranceArea} data-reveal="">
            <ChromeFrame
              notch={13}
              className={styles.reassurance}
              innerClassName={styles.reassuranceInner}
            >
              <ul className={styles.reassuranceList}>
                {bookingContent.reassurance.map((item) => (
                  <li key={item.id} className={styles.reassuranceItem} data-reveal-child="">
                    <SigilBadge size={22} />
                    <span className={styles.reassuranceText}>
                      <span className={styles.reassuranceTitle}>{item.title}</span>
                      <span className={styles.reassuranceDescription}>{item.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </ChromeFrame>
          </div>

          <div className={styles.formArea} data-reveal="">
            <ChromeFrame
              metal
              notch={16}
              className={styles.panel}
              innerClassName={styles.formInner}
              brackets
              nodes
            >
              <ConsultationForm />
            </ChromeFrame>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Legal line — deliberately not a separate footer section            */}
        {/* ---------------------------------------------------------------- */}
        <p className={styles.legal}>
          <span>{bookingContent.legal.copyright}</span>
          <span aria-hidden="true" className={styles.legalDot} />
          <span>{bookingContent.legal.privacy}</span>
        </p>
      </div>
    </section>
  );
}
