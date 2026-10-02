import Link from "next/link";
import { EditorialButton } from "@/components/editorial/EditorialButton";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { editorialArticles } from "@/content/editorial/articles";
import { articlePath } from "@/lib/editorial";
import styles from "./HomeJournalSection.module.css";

/** A visible, server-rendered route into the editorial section. */
export function HomeJournalSection() {
  const article = editorialArticles[0];
  if (!article) return null;

  return (
    <section id="journal" className={`section ${styles.journal}`} aria-labelledby="journal-title">
      <div className={`container ${styles.inner}`}>
        <header className={`text-pool ${styles.intro}`} data-reveal="">
          <p className={styles.eyebrow} data-reveal-child="">09 / Linguaggi sulla pelle</p>
          <h2 id="journal-title" className={styles.title} data-reveal-child="">Journal.</h2>
          <p className={styles.description} data-reveal-child="">Il tatuaggio, prima della pelle. Forme, cultura e progettazione negli approfondimenti di Valentine Tattoo.</p>
          <div data-reveal-child=""><EditorialButton href="/journal" trailing={<ArrowRightIcon size={17} />}>Esplora il Journal</EditorialButton></div>
        </header>
        <article className={styles.feature} aria-labelledby="journal-feature-title">
          <Link prefetch={false} href={articlePath(article)} className={styles.imageLink} aria-label={`Leggi la guida ${article.title}`}>
            <EditorialImage image={article.cover} sizes="(max-width: 699px) 88vw, (max-width: 1023px) 34vw, 23vw" />
          </Link>
          <div className={`text-pool ${styles.featureCopy}`}>
            <p className={styles.eyebrow}>Guida / {article.issue}</p>
            <h3 id="journal-feature-title"><Link prefetch={false} href={articlePath(article)}>{article.title}</Link></h3>
            <p className={styles.subtitle}>{article.subtitle}</p>
            <p className={styles.featureDescription}>{article.description}</p>
            <Link prefetch={false} href={articlePath(article)} className={styles.read}>Leggi l’approfondimento <ArrowRightIcon size={16} /></Link>
          </div>
        </article>
      </div>
    </section>
  );
}
