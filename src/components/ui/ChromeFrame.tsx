import type { ElementType, ReactNode } from "react";

import styles from "./ChromeFrame.module.css";

export type ChromeFrameProps = {
  children: ReactNode;
  /** Element rendered for the outer wrapper. */
  as?: ElementType;
  className?: string;
  innerClassName?: string;
  /** Corner cut size. */
  notch?: number;
  /** Interior fill. `transparent` keeps the dark page showing through. */
  fill?: string;
  /** Metal gradient stroke instead of the flat hairline. */
  metal?: boolean;
  /** Adds the faint internal top/bottom gradient. */
  lit?: boolean;
  /** Luminous dots on the corner cuts. */
  nodes?: boolean;
  /** Ornate tribal brackets on the corners. */
  brackets?: boolean;
  id?: string;
};

/**
 * Reusable hairline chrome frame with clipped corners.
 *
 * Structural, never decorative-only: it wraps real content. The ornamental
 * add-ons (nodes, brackets) are `aria-hidden` and non-interactive.
 */
export function ChromeFrame({
  children,
  as: Tag = "div",
  className,
  innerClassName,
  notch,
  fill,
  metal = false,
  lit = false,
  nodes = false,
  brackets = false,
  id,
}: ChromeFrameProps) {
  // CSS custom properties are valid inline styles but are not in CSSProperties.
  const style = {
    ...(notch !== undefined ? { "--frame-notch": `${notch}px` } : {}),
    ...(fill !== undefined ? { "--frame-fill": fill } : {}),
  } as React.CSSProperties;

  return (
    <Tag
      id={id}
      className={[
        "chrome-frame",
        metal ? "chrome-frame--metal" : "",
        lit ? "chrome-frame--lit" : "",
        styles.frame,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className={["chrome-frame__inner", styles.inner, innerClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
      {nodes ? <FrameNodes /> : null}
      {brackets ? <FrameBrackets /> : null}
    </Tag>
  );
}

function FrameNodes() {
  return (
    <span aria-hidden="true" data-decor="" data-frame-ornament="nodes" className={styles.nodes}>
      <span className="chrome-node" style={{ top: -1, left: "var(--frame-notch)" }} />
      <span className="chrome-node" style={{ top: -1, right: "var(--frame-notch)" }} />
      <span className="chrome-node" style={{ bottom: -1, left: "var(--frame-notch)" }} />
      <span className="chrome-node" style={{ bottom: -1, right: "var(--frame-notch)" }} />
    </span>
  );
}

/** Ornate corner brackets matching the reference's tribal card corners. */
function FrameBrackets() {
  const corners = ["tl", "tr", "bl", "br"] as const;
  return (
    <span aria-hidden="true" data-decor="" data-frame-ornament="brackets" className={styles.brackets}>
      {corners.map((c) => (
        <svg key={c} className={[styles.bracket, styles[c]].join(" ")} viewBox="0 0 90 90" fill="none">
          <path
            d="M2 34C2 16 16 2 34 2"
            stroke="url(#vt-hairline)"
            strokeWidth="1.2"
          />
          <g fill="url(#vt-chrome)">
            <path d="M4 30c1.6-9.4 7-16.4 16.2-21-6 6.6-10.6 13.6-13.4 21-.5 1.4-2.5 1.2-2.8 0Z" />
            <path d="M30 4c-9.4 1.6-16.4 7-21 16.2 6.6-6 13.6-10.6 21-13.4 1.4-.5 1.2-2.5 0-2.8Z" />
            <path d="M40 6c-5.6 2.6-9.6 6.6-12 12 4-4.2 8-8.2 12-12Z" opacity="0.75" />
            <path d="M6 40c2.6-5.6 6.6-9.6 12-12-4.2 4-8.2 8-12 12Z" opacity="0.75" />
          </g>
          <circle cx="24" cy="24" r="1.7" fill="#fff" opacity="0.8" />
        </svg>
      ))}
    </span>
  );
}
