import { ConsultationForm } from "@/components/booking/ConsultationForm";
import { SigilBadge, SigilOrnament } from "@/components/ornaments/SigilOrnament";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ArrowCircleIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingContent } from "@/content/site-content";
import { instagramProfile, whatsapp } from "@/config/site-config";

import styles from "./BookingSection.module.css";

/**
 * Booking: the direct channels and the consultation form.
 *
 * On a wide screen the channels and the reassurances stand in a column beside
 * the form and stay in view while it is filled in — they used to end halfway
 * down it, leaving a void beside the second half of the fields, with the
 * reassurances stranded underneath both. On a phone the order is unchanged:
 * channels, reassurances, form.
 */
export function BookingSection() {
  // Only a developer needs to be told the number is missing. A visitor was
  // shown "WhatsApp non ancora configurato" in its place, which reads as a
  // broken site; in production the button is simply absent, as the README
  // promises.
  const showWhatsappNotice = !whatsapp.url && process.env.NODE_ENV !== "production";

  return (
    <section id="booking" className={`section ${styles.booking}`} aria-labelledby="booking-title">
      <SideGlyphRail side="left" index="06" />
      <SideGlyphRail side="right" words={["CONSULENZA", "CUSTOM WORK"]} />

      <div className={`container ${styles.inner}`}>
        <SectionHeading
          id="booking-title"
          index="06"
          eyebrow={bookingContent.eyebrow}
          lines={bookingContent.titleLines}
          accessibleTitle={bookingContent.titleAccessible}
          align="center"
          arc
          divider={false}
          className={styles.heading}
        />

        <div className={styles.intro} data-reveal="">
          <p className={`u-halo ${styles.introLead}`} data-reveal-child="words">
            {bookingContent.introLead}
          </p>
          <p className={`u-halo ${styles.introBody}`} data-reveal-child="lines">
            {bookingContent.introBody}
          </p>
        </div>

        <div className={styles.panels}>
          <div className={styles.aside}>
            <div data-reveal="">
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
                  <span data-decode="">{bookingContent.contactCardTitle}</span>
                </p>

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
                  ) : null}

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

                  {showWhatsappNotice ? (
                    <p className={styles.channelDisabled} role="note">
                      {bookingContent.whatsappUnconfigured}
                    </p>
                  ) : null}
                </div>
              </ChromeFrame>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Reassurances                                                  */}
            {/* ------------------------------------------------------------ */}
            <div data-reveal="">
              <ChromeFrame notch={13} className={styles.reassurance} innerClassName={styles.reassuranceInner}>
                <ul className={styles.reassuranceList}>
                  {bookingContent.reassurance.map((item) => (
                    <li key={item.id} className={styles.reassuranceItem} data-reveal-child="">
                      <SigilBadge size={22} className={styles.reassuranceIcon} />
                      <span className={styles.reassuranceText}>
                        <span className={styles.reassuranceTitle} data-decode="">
                          {item.title}
                        </span>
                        <span className={styles.reassuranceDescription}>{item.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </ChromeFrame>
            </div>
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
      </div>
    </section>
  );
}
