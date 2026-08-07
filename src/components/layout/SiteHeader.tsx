"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BrandLockup } from "@/components/ornaments/BrandMark";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { a11yContent } from "@/content/site-content";
import { navItems } from "@/config/site-config";
import { useActiveSection, useScrolled } from "@/lib/hooks/useActiveSection";
import { onIntroCue } from "@/lib/intro-timing";

import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

const SECTION_IDS = navItems.map((item) => item.id);

/** Matches the hero reveal, so header and hero read as one opening. */
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Entrance variants.
 *
 * Motion propagates variants only through motion components, so the chain from
 * the header down to each item has to be unbroken — the inner bar and the nav
 * are motion elements with empty variants purely to pass the state along.
 */
const headerVariants: Variants = {
  hidden: { y: -28, opacity: 0 },
  shown: {
    y: 0,
    opacity: 1,
    transition: { duration: 1.2, ease: EASE, delayChildren: 0.34, staggerChildren: 0.1 },
  },
};

/** Pass-through: animates nothing, just forwards the state to its children. */
const passThrough: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.07 } } };

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  shown: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

export function SiteHeader({ waitForIntro = false }: { waitForIntro?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection(SECTION_IDS, "home");
  const scrolled = useScrolled();
  const reduce = useReducedMotion();

  /**
   * The header arrives with the rest of the opening rather than before it.
   *
   * Without this it was fully drawn while the clip was still playing, which put
   * the navigation on top of the film for its whole length. It now waits for
   * the same cue the hero content waits for — and, as everywhere else, a
   * fallback timer guarantees it appears even if the cue never comes.
   */
  const [ready, setReady] = useState(!waitForIntro);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setReady(true), 8000);
    const unsubscribe = onIntroCue(() => {
      window.clearTimeout(timer);
      setReady(true);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [ready]);

  /*
   * Under reduced motion the header mounts already shown.
   *
   * Dropping the props instead — which is what this did at first — leaves the
   * header invisible for good. `useReducedMotion` reports false on the very
   * first render and only flips once its media query is read, by which time
   * `initial="hidden"` has already written `opacity: 0` into the element's
   * inline style. Removing `animate` afterwards does not take that back:
   * nothing is left to animate it away. `initial={false}` instead tells Motion
   * to mount directly in the target state, so the preference is honoured — no
   * movement — and the element is definitely visible.
   */
  const motionProps = reduce
    ? { initial: false as const, animate: "shown" as const }
    : { initial: "hidden" as const, animate: ready ? ("shown" as const) : ("hidden" as const) };
  const v = (variants: Variants) => ({ variants });

  return (
    <>
      <motion.header
        className={styles.header}
        data-scrolled={scrolled ? "" : undefined}
        {...motionProps}
        {...v(headerVariants)}
      >
        <motion.div className={styles.bar} {...v(passThrough)}>
          <motion.a
            href="#home"
            className={styles.brand}
            aria-label="Valentine Tattoo — torna all’inizio"
            {...v(itemVariants)}
          >
            <BrandLockup
              markSize={32}
              className={styles.lockup}
              wordmarkClassName={styles.wordmark}
              nameClassName={styles.brandName}
              taglineClassName={styles.brandTagline}
            />
          </motion.a>

          <motion.nav
            className={styles.nav}
            aria-label={a11yContent.primaryNavLabel}
            {...v(passThrough)}
          >
            <ul className={styles.navList}>
              {/* No separator glyphs: with seven items they cost the width the
                  labels need. The active underline carries the emphasis. */}
              {navItems.map((navItem) => (
                <motion.li key={navItem.id} className={styles.navItem} {...v(itemVariants)}>
                  <a
                    href={navItem.href}
                    className={styles.navLink}
                    aria-current={activeSection === navItem.id ? "page" : undefined}
                    data-active={activeSection === navItem.id ? "" : undefined}
                  >
                    {navItem.label}
                    <span className={styles.navUnderline} aria-hidden="true" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          <motion.div className={styles.actions} {...v(itemVariants)}>
            <SigilStar size={18} className={styles.actionStar} />
            <ChromeButton href="#booking" size="sm" className={styles.bookingButton} tracked>
              BOOKING
            </ChromeButton>

            <motion.button
              ref={triggerRef}
              type="button"
              className={styles.burger}
              aria-label={a11yContent.openMenu}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <span className={styles.burgerLines} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        <span className={styles.divider} aria-hidden="true" data-decor="" />
      </motion.header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        triggerRef={triggerRef}
      />
    </>
  );
}
