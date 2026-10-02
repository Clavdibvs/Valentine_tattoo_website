"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./EditorialArticle.module.css";

export function EditorialNav({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const progressRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) navRef.current.dataset.enhanced = "";
    let frame = 0;
    let pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    const draw = () => {
      frame = 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${pageHeight > 0 ? Math.min(window.scrollY / pageHeight, 1) : 0})`;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const resize = new ResizeObserver(() => { pageHeight = document.documentElement.scrollHeight - window.innerHeight; scroll(); });
    resize.observe(document.body);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    draw();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    chapters.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", scroll);
      document.removeEventListener("keydown", escape);
    };
  }, [chapters]);

  useEffect(() => {
    const rail = railRef.current;
    const link = rail?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (rail && link) rail.scrollTo({ left: link.offsetLeft - rail.offsetLeft - 20, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [active]);

  const close = () => { if (detailsRef.current) detailsRef.current.open = false; };
  const links = chapters.map((chapter, index) => (
    <li key={chapter.id}>
      <a href={`#${chapter.id}`} aria-current={active === chapter.id ? "location" : undefined} onClick={() => {
        close();
        document.getElementById(`${chapter.id}-title`)?.focus({ preventScroll: true });
      }}>
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{chapter.label}
      </a>
    </li>
  ));
  return (
    <nav ref={navRef} className={styles.chapterNav} aria-label="Indice dell’approfondimento">
      <div className={styles.navInner}>
        <span className={styles.navLabel}>In questa guida</span>
        <ul ref={railRef} className={styles.chapterLinks}>{links}</ul>
        <details ref={detailsRef} className={styles.mobileContents}>
          <summary>Indice <span className={styles.currentChapter}>{chapters.find((chapter) => chapter.id === active)?.label}</span><span className={styles.plus} aria-hidden="true">+</span></summary>
          <ul>{links}</ul>
        </details>
      </div>
      <span className={styles.readingProgress} ref={progressRef} aria-hidden="true" />
    </nav>
  );
}
