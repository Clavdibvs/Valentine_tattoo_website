"use client";

import { motion, useReducedMotion } from "motion/react";
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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection(SECTION_IDS, "home");
  const scrolled = useScrolled();
  const reduce = useReducedMotion();

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled ? "" : undefined}>
        <div className={styles.bar}>
          <a href="#home" className={styles.brand} aria-label="Valentine Tattoo — torna all’inizio">
            <BrandLockup
              markSize={32}
              className={styles.lockup}
              wordmarkClassName={styles.wordmark}
              nameClassName={styles.brandName}
              taglineClassName={styles.brandTagline}
            />
          </a>

          <nav className={styles.nav} aria-label={a11yContent.primaryNavLabel}>
            <ul className={styles.navList}>
              {navItems.map((item, index) => (
                <li key={item.id} className={styles.navItem}>
                  <a
                    href={item.href}
                    className={styles.navLink}
                    aria-current={activeSection === item.id ? "page" : undefined}
                    data-active={activeSection === item.id ? "" : undefined}
                  >
                    {item.label}
                    <span className={styles.navUnderline} aria-hidden="true" />
                  </a>
                  {index < navItems.length - 1 ? (
                    <SigilStar size={9} className={styles.navSeparator} />
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
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
          </div>
        </div>

        <span className={styles.divider} aria-hidden="true" data-decor="" />
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        triggerRef={triggerRef}
      />
    </>
  );
}
