"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef } from "react";

import { CornerSigil } from "@/components/ornaments/SigilOrnament";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { CloseIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { a11yContent } from "@/content/site-content";
import { instagramProfile, navItems, whatsapp } from "@/config/site-config";
import type { SectionId } from "@/config/site-config";
import { useScrollLock } from "@/lib/scroll-lock";

import styles from "./MobileMenu.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function MobileMenu({
  open,
  onClose,
  activeSection,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  activeSection: SectionId;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const titleId = useId();

  // The panel is a modal: the page behind it stays put.
  useScrollLock(open);

  /* -------------------------------------------------------------------- */
  /* Escape + focus trap                                                   */
  /* -------------------------------------------------------------------- */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  /* -------------------------------------------------------------------- */
  /* Move focus in on open, restore it on close                            */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (open) {
      // Wait a frame so the panel is mounted and measurable.
      const raf = requestAnimationFrame(() => {
        const panel = panelRef.current;
        panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
    triggerRef.current?.focus();
  }, [open, triggerRef]);

  /* -------------------------------------------------------------------- */
  /* Variants                                                              */
  /* -------------------------------------------------------------------- */
  const overlay = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reduce
        ? { duration: 0.01 }
        : { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] as const, staggerChildren: 0.055, delayChildren: 0.08 },
    },
    exit: {
      opacity: 0,
      transition: reduce ? { duration: 0.01 } : { duration: 0.2, ease: "easeIn" as const },
    },
  };

  const item = reduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] as const },
        },
        exit: { opacity: 0, y: 8, transition: { duration: 0.16 } },
      };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-menu"
          className={styles.overlay}
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />

          <div ref={panelRef} className={styles.panel}>
            <h2 id={titleId} className="sr-only">
              {a11yContent.menuLabel}
            </h2>

            <CornerSigil corner="top-right" className={styles.cornerTop} opacity={0.5} />
            <CornerSigil corner="bottom-left" className={styles.cornerBottom} opacity={0.42} />

            <motion.button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={a11yContent.closeMenu}
              variants={item}
              whileTap={reduce ? undefined : { scale: 0.94 }}
            >
              <CloseIcon size={22} />
            </motion.button>

            <motion.nav className={styles.nav} aria-label={a11yContent.menuLabel} variants={overlay}>
              <ul className={styles.list}>
                {navItems.map((navItem, index) => (
                  <motion.li key={navItem.id} variants={item}>
                    <a
                      href={navItem.href}
                      className={styles.link}
                      aria-current={activeSection === navItem.id ? "page" : undefined}
                      data-active={activeSection === navItem.id ? "" : undefined}
                      onClick={onClose}
                    >
                      <span className={styles.linkIndex} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.linkLabel}>{navItem.label}</span>
                      <SigilStar size={13} className={styles.linkStar} />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>

            <motion.div className={styles.footer} variants={item}>
              <span className={styles.divider} aria-hidden="true" />
              <div className={styles.channels}>
                {whatsapp.url ? (
                  <a
                    className={styles.channel}
                    href={whatsapp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                  >
                    <WhatsAppIcon size={18} />
                    <span>WhatsApp</span>
                  </a>
                ) : null}
                <a
                  className={styles.channel}
                  href={instagramProfile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  <InstagramIcon size={18} />
                  <span>{instagramProfile.handleWithAt}</span>
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
