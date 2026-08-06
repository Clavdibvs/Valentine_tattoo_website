"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useRef, useState } from "react";

import { BrandLockup } from "@/components/ornaments/BrandMark";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { a11yContent } from "@/content/site-content";
import { navItems } from "@/config/site-config";
import { useActiveSection, useScrolled } from "@/lib/hooks/useActiveSection";

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
    transition: { duration: 0.9, ease: EASE, delayChildren: 0.28, staggerChildren: 0.07 },
  },
};

/** Pass-through: animates nothing, just forwards the state to its children. */
const passThrough: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.07 } } };

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection(SECTION_IDS, "home");
  const scrolled = useScrolled();
  const reduce = useReducedMotion();

  // Under reduced motion the header simply renders in its final state: no
  // variants, so nothing animates and nothing can be left hidden.
  const motionProps = reduce
    ? {}
    : { initial: "hidden" as const, animate: "shown" as const };
  const v = (variants: Variants) => (reduce ? {} : { variants });

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
