import Link from "next/link";
import type { ReactNode } from "react";
import { EditorialMotion } from "./EditorialMotion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandLockup } from "@/components/ornaments/BrandMark";
import { ChromeDefs } from "@/components/ornaments/ChromeDefs";
import { PageBackdrop } from "@/components/ornaments/PageBackdrop";
import { EditorialButton } from "./EditorialButton";
import { ArrowRightIcon } from "@/components/ui/Icons";
import styles from "./EditorialShell.module.css";

/** Dedicated route shell: home anchors always resolve back to the home page. */
export function EditorialShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ChromeDefs />
      <div className="atmosphere" aria-hidden="true" data-decor="" />
      <div className="grain" aria-hidden="true" data-decor="" />
      <PageBackdrop variant="editorial" />
      <div className="page-frame" aria-hidden="true" data-decor="" />
      <a href="#main" className="skip-link">Vai al contenuto</a>
      <header className={styles.header}>
        <Link prefetch={false} href="/" className={styles.brand} aria-label="Valentine Tattoo — homepage">
          <BrandLockup markSize={34} className={styles.lockup} wordmarkClassName={styles.wordmark} nameClassName={styles.name} taglineClassName={styles.tagline} />
        </Link>
        <nav aria-label="Navigazione principale" className={styles.nav}>
          <Link prefetch={false} href="/#creazioni">Portfolio</Link>
          <Link prefetch={false} href="/journal" aria-current="true">Journal <span aria-hidden="true">↗</span></Link>
          <Link prefetch={false} href="/#about">Valentina</Link>
        </nav>
        <EditorialButton href="/#booking" variant="solid" size="sm" tracked trailing={<ArrowRightIcon size={14} />} className={styles.booking}>
          Consulenza
        </EditorialButton>
      </header>
      <main id="main" className={styles.main}>{children}</main>
      <SiteFooter />
      <EditorialMotion />
    </>
  );
}
