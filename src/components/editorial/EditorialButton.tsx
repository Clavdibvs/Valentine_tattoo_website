import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/ui/ChromeButton.module.css";

/** Native editorial link using the existing chrome button's exact styling.
 * No pointer animation is needed in a reading interface; native links also
 * keep their server markup identical under reduced-motion preferences.
 */
export function EditorialButton({ href, children, trailing, className, size = "md", tracked = false }: {
  href: string; children: ReactNode; trailing?: ReactNode; className?: string;
  size?: "sm" | "md" | "lg"; tracked?: boolean; variant?: "solid";
}) {
  return (
    <Link href={href} prefetch={false} className={[styles.button, styles.solid, styles[size], tracked ? styles.tracked : "", className].filter(Boolean).join(" ")}>
      <span className={styles.sweep} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.labels}><span className={styles.label}>{children}</span></span>
        {trailing ? <span className={styles.trailing} aria-hidden="true">{trailing}</span> : null}
      </span>
    </Link>
  );
}
