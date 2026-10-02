"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
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
  /**
   * Leans toward a mouse pointer as it approaches, the label a little further
   * than the frame. For the calls to action that stand on their own — not for
   * full-width buttons, where a whole row sliding sideways reads as a fault.
   */
  magnetic?: boolean;
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

/** Spring for the magnetic pull: quick to follow, a little give on release. */
const MAGNET_SPRING = { stiffness: 240, damping: 17, mass: 0.6 };

/**
 * The site's primary interactive control: a notched chrome frame with a
 * hairline sweep on hover.
 *
 * Motion owns the interaction states (lift, press, magnetic pull); CSS owns
 * the glow and sweep. GSAP never touches these elements.
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
    magnetic = false,
  } = props;

  const reduce = useReducedMotion();

  // Raw pull, sprung for the frame, and amplified for the label inside it so
  // the two separate slightly — the face reads as having depth.
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const frameX = useSpring(pullX, MAGNET_SPRING);
  const frameY = useSpring(pullY, MAGNET_SPRING);
  const labelX = useTransform(frameX, (value) => value * 0.55);
  const labelY = useTransform(frameY, (value) => value * 0.55);
  const pulls = magnetic && !reduce && !block;

  const magnetHandlers = pulls
    ? {
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          if (event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          // A lean, not a slide: capped well inside the gap between two
          // buttons set side by side.
          const reach = (offset: number, factor: number, cap: number) =>
            Math.max(-cap, Math.min(cap, offset * factor));
          pullX.set(reach(event.clientX - (box.left + box.width / 2), 0.12, 7));
          pullY.set(reach(event.clientY - (box.top + box.height / 2), 0.28, 6));
        },
        onPointerLeave: () => {
          pullX.set(0);
          pullY.set(0);
        },
      }
    : {};

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

  // A magnetic button's position belongs to the pull; the hover lift would
  // fight it for `y`, so it keeps only the press.
  const interaction = reduce
    ? {}
    : pulls
      ? {
          whileTap: { scale: 0.975 },
          transition: { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.6 },
          style: { x: frameX, y: frameY },
          ...magnetHandlers,
        }
      : {
          whileHover: { y: -1.5 },
          whileTap: { y: 0, scale: 0.985 },
          transition: { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.6 },
        };

  const inner = (
    <>
      <span className={styles.sweep} aria-hidden="true" />
      <motion.span className={styles.content} style={pulls ? { x: labelX, y: labelY } : undefined}>
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
      </motion.span>
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
