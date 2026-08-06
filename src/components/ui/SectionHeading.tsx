import { Fragment } from "react";

import { OrnamentArc, OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SigilStar } from "@/components/ornaments/SigilStar";

import styles from "./SectionHeading.module.css";

export function SectionHeading({
  eyebrow,
  lines,
  accessibleTitle,
  align = "center",
  arc = false,
  divider = true,
  flankStars = false,
  id,
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  /** Visual line breaks; joined for the accessible name. */
  lines: readonly string[];
  accessibleTitle?: string;
  align?: "center" | "start";
  arc?: boolean;
  divider?: boolean;
  flankStars?: boolean;
  id?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={[styles.wrap, styles[align], className].filter(Boolean).join(" ")}
      data-reveal=""
    >
      {arc ? <OrnamentArc className={styles.arc} /> : null}

      {eyebrow ? (
        <p className={[styles.eyebrow, "u-eyebrow"].join(" ")} data-reveal-child="">
          {align === "center" ? <SigilStar size={11} className={styles.eyebrowStar} /> : null}
          <span>{eyebrow}</span>
          <SigilStar size={11} className={styles.eyebrowStar} />
        </p>
      ) : null}

      <div className={styles.titleRow} data-reveal-child="">
        {flankStars ? <SigilStar size={30} className={styles.flank} /> : null}
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
        {flankStars ? <SigilStar size={30} className={styles.flank} /> : null}
      </div>

      {divider ? (
        <OrnamentDivider className={styles.divider} width={align === "center" ? "440px" : "100%"} />
      ) : null}
    </div>
  );
}
