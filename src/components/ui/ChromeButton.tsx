"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import styles from "./ChromeButton.module.css";

type Common = {
  children: ReactNode;
  /** Leading icon, usually a channel mark. */
  icon?: ReactNode;
  /** Trailing icon, usually an arrow. */
  trailing?: ReactNode;
  /** Small caps line rendered under the label inside the button. */
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "solid" | "ghost";
  block?: boolean;
  className?: string;
  /** Renders the label in the uppercase tracked style. */
  tracked?: boolean;
};

type AnchorProps = Common & {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
  disabled?: never;
  "aria-label"?: string;
};

type ButtonProps = Common & {
  href?: never;
  external?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
};

export type ChromeButtonProps = AnchorProps | ButtonProps;

/**
 * The site's primary interactive control: a notched chrome frame with a
 * hairline sweep on hover.
 *
 * Motion owns the interaction states (lift + press); CSS owns the glow and
 * sweep. GSAP never touches these elements.
 */
export function ChromeButton(props: ChromeButtonProps) {
  const {
    children,
    icon,
    trailing,
    sublabel,
    size = "md",
    variant = "outline",
    block = false,
    className,
    tracked = false,
  } = props;

  const reduce = useReducedMotion();

  const classes = [
    styles.button,
    styles[size],
    styles[variant],
    block ? styles.block : "",
    tracked ? styles.tracked : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const interaction = reduce
    ? {}
    : {
        whileHover: { y: -1.5 },
        whileTap: { y: 0, scale: 0.985 },
        transition: { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.6 },
      };

  const inner = (
    <>
      <span className={styles.sweep} aria-hidden="true" />
      <span className={styles.content}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.labels}>
          <span className={styles.label}>{children}</span>
          {sublabel ? <span className={styles.sublabel}>{sublabel}</span> : null}
        </span>
        {trailing ? (
          <span className={styles.trailing} aria-hidden="true">
            {trailing}
          </span>
        ) : null}
      </span>
    </>
  );

  if ("href" in props && props.href) {
    const externalProps = props.external
      ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
      : {};
    return (
      <motion.a
        href={props.href}
        className={classes}
        aria-label={props["aria-label"]}
        {...externalProps}
        {...interaction}
      >
        {inner}
      </motion.a>
    );
  }

  const { onClick, type = "button", disabled } = props as ButtonProps;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={props["aria-label"]}
      {...(disabled ? {} : interaction)}
    >
      {inner}
    </motion.button>
  );
}
