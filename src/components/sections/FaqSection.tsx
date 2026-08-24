import { CornerSigil } from "@/components/ornaments/SigilOrnament";
import { OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SideGlyphRail } from "@/components/ornaments/SideGlyphRail";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeFrame } from "@/components/ui/ChromeFrame";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqContent } from "@/content/site-content";

import styles from "./FaqSection.module.css";

/**
 * The FAQ, and the page's structured data.
 *
 * ## Why `<details>` rather than a scripted accordion
 *
 * The answers are the reason this section exists — for readers, for Google and
 * for the assistants that quote pages. `<details>` keeps every answer in the
 * server-rendered HTML whether it is open or shut, so a crawler that never runs
 * the page's JavaScript still reads all of it, and it arrives with the
 * expand/collapse behaviour, the keyboard support and the accessible state
 * already built in. A scripted accordion would have had to re-earn all four.
 *
 * The first item is open on load: a column of closed rows does not always read
 * as expandable, and one open answer shows what the rest do.
 */
export function FaqSection() {
  /**
   * FAQPage structured data.
   *
   * This is the half of the section a person never sees and search engines act
   * on: it is what lets an answer be pulled into a result page or an AI
   * overview attributed to this site. It is generated from the same array the
   * markup renders, so the two cannot drift — a schema that describes questions
   * the page does not actually show is a manual action waiting to happen.
   *
   * Only FAQPage is emitted. LocalBusiness would be the obvious companion, but
   * it wants a street address and opening hours, and neither has been supplied;
   * inventing them to satisfy a schema validator would put false information
   * about a real business into Google's index.
   */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqContent.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className={`section ${styles.faq}`} aria-labelledby="faq-title">
      {/* Structured data, per Next's JSON-LD guidance: a plain <script> tag,
          with `<` escaped so no answer could ever close it early. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className={styles.decorLayer} aria-hidden="true" data-decor="">
        <CornerSigil corner="top-right" className={styles.cornerTop} opacity={0.38} />
        <CornerSigil corner="bottom-left" className={styles.cornerBottom} opacity={0.45} />
      </div>

      <SideGlyphRail side="left" index="08" />
      <SideGlyphRail side="right" words={["PROCESSO", "GHOSTLINES", "PREVENTIVO"]} />

      <div className={`container ${styles.inner}`}>
        <SectionHeading
          id="faq-title"
          eyebrow={faqContent.eyebrow}
          lines={faqContent.titleLines}
          accessibleTitle={faqContent.titleAccessible}
          align="center"
          arc
          divider={false}
          className={styles.heading}
        />

        <p className={styles.supporting} data-reveal="">
          {faqContent.supporting}
        </p>

        <OrnamentDivider className={styles.headDivider} width="300px" />

        <ChromeFrame
          metal
          notch={16}
          className={styles.panel}
          innerClassName={styles.panelInner}
          nodes
          brackets
        >
          <ul className={styles.list} data-reveal="">
            {faqContent.items.map((item, index) => (
              <li key={item.id} className={styles.item} data-reveal-child="">
                <details className={styles.details} open={index === 0}>
                  <summary className={styles.summary}>
                    <SigilStar size={11} className={styles.summaryStar} />
                    <span className={styles.question}>{item.question}</span>
                    <ChevronDownIcon size={18} className={styles.chevron} />
                  </summary>
                  <div className={styles.answerWrap}>
                    <p className={styles.answer}>{item.answer}</p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </ChromeFrame>
      </div>
    </section>
  );
}
