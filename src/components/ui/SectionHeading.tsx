import { Fragment } from "react";

import { OrnamentArc, OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SigilStar } from "@/components/ornaments/SigilStar";

import styles from "./SectionHeading.module.css";

/**
 * Section heading: chapter index, eyebrow, chrome title.
 *
 * Every section used to stack the same five ornaments over its title — the arc
 * and its star, a star either side of the eyebrow, a star either side of the
 * title — so eight sections read as one heading repeated. The ornament now
 * does less and the typography more: the title is larger, the eyebrow carries
 * the chapter number between two hairlines, and the arc is kept for the
 * chapters that open the page's main movements rather than for every one.
 */
export function SectionHeading({
  eyebrow,
  index,
  lines,
  accessibleTitle,
  align = "center",
  size = "lg",
  arc = false,
  divider = true,
  id,
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  /** Two-digit chapter number, e.g. "02". Decorative: hidden from AT. */
  index?: string;
  /** Visual line breaks; joined for the accessible name. */
  lines: readonly string[];
  accessibleTitle?: string;
  /**
   * `startDesktop` is centred on mobile and start-aligned from 1024px. It is a
   * real variant rather than a per-section override, because overriding the
   * alignment from a consumer stylesheet loses the specificity contest against
   * `.start .titleRow` and silently leaves the heading off-centre.
   */
  align?: "center" | "start" | "startDesktop";
  /** `md` for the collection series and for titles set beside other content. */
  size?: "lg" | "md";
  arc?: boolean;
  divider?: boolean;
  id?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={[styles.wrap, styles[align], styles[size], className].filter(Boolean).join(" ")}
      data-reveal=""
    >
      {arc ? <OrnamentArc className={styles.arc} /> : null}

      {eyebrow ? (
        <p className={[styles.eyebrow, "u-eyebrow"].join(" ")} data-reveal-child="">
          {/* The hairlines grow outward from the label; the number and the
              label resolve out of noise as they arrive. */}
          <span className={styles.rule} aria-hidden="true" data-draw="right" />
          {index ? (
            <>
              <span
                className={`u-index ${styles.index}`}
                aria-hidden="true"
                data-decode="digits"
              >
                {index}
              </span>
              <SigilStar size={9} className={styles.eyebrowStar} />
            </>
          ) : null}
          <span className={styles.eyebrowText} data-decode="">
            {eyebrow}
          </span>
          <span
            className={[styles.rule, styles.ruleEnd].join(" ")}
            aria-hidden="true"
            data-draw="left"
          />
        </p>
      ) : null}

      <div className={styles.titleRow} data-reveal-child="mask">
        <Tag
          id={id}
          className={[styles.title, "u-display", "u-chrome-text"].join(" ")}
          data-chrome-sweep=""
        >
          {/* Rendered as a single heading; <br> only controls the visual break. */}
          <span className="sr-only">{accessibleTitle ?? lines.join(" ")}</span>
          <span aria-hidden="true">
            {lines.map((line, i) => (
              <Fragment key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </span>
        </Tag>
      </div>

      {divider ? (
        <OrnamentDivider
          className={styles.divider}
          width={align === "center" ? "360px" : "100%"}
        />
      ) : null}
    </div>
  );
}
