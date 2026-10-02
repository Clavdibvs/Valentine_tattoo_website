import Link from "next/link";
import type { Metadata } from "next";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { editorialArticles } from "@/content/editorial/articles";
import { articlePath } from "@/lib/editorial";
import { artist, siteUrl } from "@/config/site-config";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Journal | Valentine Tattoo",
  description: "Linguaggi, cultura e progettazione del tatuaggio. Il journal di Valentine Tattoo: approfondimenti su Cyber Sigilism, Cyber Tribal e Neo Tribal.",
  alternates: { canonical: "/journal" },
  openGraph: { title: "Journal | Valentine Tattoo", type: "website", locale: "it_IT", siteName: artist.brand, url: `${siteUrl}/journal`, images: [{ url: editorialArticles[0].ogImage, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Journal | Valentine Tattoo", images: [editorialArticles[0].ogImage] },
};

export default function JournalPage() {
  return (
    <div id="home" className={styles.journal}>
      <header className={styles.heading} data-reveal=""><p className="u-eyebrow" data-reveal-child="">Valentine Tattoo / Linguaggi sulla pelle</p><h1 className="u-chrome-text" data-reveal-child="">Journal.</h1><p data-reveal-child="">Forme, cultura e idee.<br />Il tatuaggio, prima di diventare pelle.</p></header>
      <div className={styles.articles}>{editorialArticles.map((article) => <article key={article.slug} className={styles.feature}><Link prefetch={false} href={articlePath(article)} className={styles.imageLink}><EditorialImage image={article.cover} eager sizes="(max-width: 699px) 88vw, 40vw" /></Link><div className={styles.copy}><p className="u-label">Guida / {article.issue} <span>{article.readingMinutes} min di lettura</span></p><h2><Link prefetch={false} href={articlePath(article)}>{article.title}</Link></h2><p className={styles.subtitle}>{article.subtitle}</p><p>{article.definition}</p><Link prefetch={false} href={articlePath(article)} className={styles.read}>Esplora la guida <span aria-hidden="true">↗</span></Link></div></article>)}</div>
    </div>
  );
}
