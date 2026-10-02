import Link from "next/link";
import { Fragment } from "react";
import { artist, instagramProfile } from "@/config/site-config";
import type { EditorialArticle as ArticleData, EditorialChapter, EditorialSource } from "@/content/editorial/types";
import { formattedEditorialDate, editorialSchema } from "@/lib/editorial";
import { OrnamentDivider } from "@/components/ornaments/OrnamentDivider";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { EditorialButton } from "./EditorialButton";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { EditorialImage } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";
import styles from "./EditorialArticle.module.css";

function SourceLink({ id, sources }: { id: string; sources: EditorialSource[] }) {
  const source = sources.find((item) => item.id === id);
  return source ? <a className={styles.sourceLink} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} <span aria-hidden="true">↗</span></a> : null;
}

function ChapterHeading({ chapter, index }: { chapter: EditorialChapter; index: number }) {
  return (
    <div className={`text-pool ${styles.chapterHeading}`} data-reveal="">
      <p className={styles.kicker} data-reveal-child=""><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span><span>{chapter.label}</span></p>
      <h2 id={`${chapter.id}-title`} tabIndex={-1} data-reveal-child="" className={styles.chapterTitle}>{chapter.title}</h2>
    </div>
  );
}

function ChapterContent({ chapter, sources }: { chapter: EditorialChapter; sources: EditorialSource[] }) {
  switch (chapter.type) {
    case "definition": return (
      <div className={styles.definitionGrid}>
        <EditorialImage image={chapter.image} className={styles.definitionPhoto} />
        <div className={`text-pool ${styles.traits}`}>
          <p className={styles.lead}>{chapter.intro}</p>
          <dl>{chapter.traits.map((trait, i) => <div key={trait.title}><dt><span aria-hidden="true">0{i + 1}</span>{trait.title}</dt><dd>{trait.text}</dd></div>)}</dl>
          <a className={styles.textLink} href="#differenze">Capire le differenze <ArrowRightIcon size={15} /></a>
        </div>
      </div>
    );
    case "comparison": return (
      <>
        <p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p>
        <table className={styles.styleComparison}>
          <caption className="sr-only">Differenze tra Cyber Tribal, Cyber Sigilism e Neo Tribal</caption>
          <thead><tr><th scope="col">Linguaggio</th><th scope="col">Cosa osservare</th><th scope="col">Coordinate visive</th></tr></thead>
          <tbody>{chapter.styles.map((style, i) => <tr key={style.name}>
            <th scope="row"><span className={styles.styleNumber} aria-hidden="true">0{i + 1}</span><h3>{style.name}</h3></th>
            <td><p>{style.text}</p></td>
            <td><ul className={styles.styleCoordinates}>{style.features.split(" / ").map((feature) => <li key={feature}>{feature}</li>)}</ul></td>
          </tr>)}</tbody>
        </table>
        <aside className={styles.culturalNote}><SigilStar size={21} /><div><h3>Le parole hanno una storia.</h3><p>{chapter.note}</p><SourceLink id={chapter.source} sources={sources} /></div></aside>
      </>
    );
    case "history": return (
      <>
        <p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p>
        <ol className={styles.timeline}>{chapter.timeline.map((item) => <li key={item.era} data-reveal=""><span className={styles.era}>{item.era}</span><div><h3>{item.title}</h3><p>{item.text}</p><SourceLink id={item.source} sources={sources} /></div></li>)}</ol>
        <div className={styles.influences}><p className={styles.kicker}>Coordinate visive</p><ul>{chapter.influences.map((influence) => <li key={influence}><SigilStar size={10} />{influence}</li>)}</ul></div>
      </>
    );
    case "statement": return (
      <div className={styles.statementGrid}>
        <div className={styles.statement} data-reveal=""><SigilStar size={30} /><p>{chapter.statement}</p><OrnamentDivider width="220px" /></div>
        <div className={`text-pool ${styles.statementCopy}`}><p className={styles.lead}>{chapter.intro}</p>{chapter.paragraphs.map((p) => <p key={p}>{p}</p>)}<SourceLink id={chapter.source} sources={sources} /></div>
      </div>
    );
    case "process": return (
      <>
        <p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p>
        <div className={styles.processGrid}>
          <div className={styles.anatomyPhoto}>
            <EditorialImage image={chapter.image} sizes="(max-width: 699px) 90vw, 48vw" />
            <span className={`${styles.photoAnnotation} ${styles.annotationOne}`} aria-hidden="true">01 / Asse</span>
            <span className={`${styles.photoAnnotation} ${styles.annotationTwo}`} aria-hidden="true">02 / Direzione</span>
            <span className={`${styles.photoAnnotation} ${styles.annotationThree}`} aria-hidden="true">03 / Vuoti</span>
          </div>
          <ol className={styles.steps}>{chapter.steps.map((step, i) => <li key={step.title} data-reveal=""><span className={styles.stepIndex} aria-hidden="true">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        </div>
        <p className={styles.processNote}>{chapter.note} <Link prefetch={false} href="/#about">Conosci il suo approccio ↗</Link></p>
      </>
    );
    case "placements": return (
      <>
        <p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p>
        <div className={styles.placements}>{chapter.items.map((item, i) => <div key={item.title} data-reveal=""><span className={styles.placementIndex} aria-hidden="true">0{i + 1}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
      </>
    );
    case "portfolio": return (
      <>
        <div className={styles.portfolioIntro}><p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p><Link prefetch={false} className={styles.textLink} href="/#creazioni">Tutte le creazioni <ArrowRightIcon size={16} /></Link></div>
        <div className={styles.portfolioGrid}>{chapter.images.map((image) => <Link prefetch={false} href="/#creazioni" key={image.src} className={styles.portfolioLink} aria-label={`${image.caption}. Esplora il portfolio Valentine Tattoo`}><EditorialImage image={image} sizes="(max-width: 699px) 82vw, 30vw" /><span className={styles.photoLinkIcon} aria-hidden="true">↗</span></Link>)}</div>
        <p className={styles.credit}>Tatuaggi e fotografie dall’archivio Valentine Tattoo / Valentina Stucchi.</p>
      </>
    );
    case "longevity": return (
      <>
        <p className={`text-pool ${styles.sectionIntro}`}>{chapter.intro}</p>
        <div className={styles.longevity}>{chapter.items.map((item, i) => <div key={item.title}><span className={styles.index} aria-hidden="true">0{i + 1}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
        <SourceLink id={chapter.source} sources={sources} />
      </>
    );
    case "artist": return (
      <div className={styles.artistGrid}>
        <EditorialImage image={chapter.image} className={styles.artistPhoto} sizes="(max-width: 699px) 74vw, 28vw" />
        <div className={`text-pool ${styles.artistCopy}`}><p className={styles.lead}>{chapter.intro}</p>
          <blockquote><p>«{chapter.quote}»</p><cite>{artist.name} / Valentine Tattoo</cite></blockquote>
          {chapter.paragraphs.map((p) => <p key={p}>{p}</p>)}
          <div className={styles.ctas}><EditorialButton href="/#booking" variant="solid" trailing={<ArrowRightIcon size={17} />}>Richiedi una consulenza</EditorialButton><Link prefetch={false} className={styles.textLink} href="/#about">Conosci Valentina ↗</Link></div>
        </div>
      </div>
    );
  }
}

export function EditorialArticle({ article }: { article: ArticleData }) {
  const navigation = [...article.chapters.map(({ id, label }) => ({ id, label })), { id: "faq", label: "FAQ" }];
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editorialSchema(article)).replace(/</g, "\\u003c") }} />
      <header id="home" className={styles.hero}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link prefetch={false} href="/">Valentine Tattoo</Link><span aria-hidden="true">/</span><Link prefetch={false} href="/journal">Journal</Link><span aria-hidden="true">/</span><span aria-current="page">{article.title}</span></nav>
        <div className={`text-pool ${styles.heroCopy}`}>
          <div data-reveal="">
            <p className={styles.kicker} data-reveal-child="">Journal / {article.issue}<span aria-hidden="true">✦</span>Linguaggi sulla pelle</p>
            <h1 className={`${styles.heroTitle} u-chrome-text`} data-reveal-child="">{article.titleLines.map((line, i) => <Fragment key={line}>{i > 0 ? " " : null}<span>{line}</span></Fragment>)}</h1>
            <p className={styles.subtitle} data-reveal-child="">{article.subtitle}</p>
            <p className={styles.dek} data-reveal-child="">{article.dek}</p>
            <p className={styles.heroDefinition} data-reveal-child="">{article.definition}</p>
            <div className={styles.byline} data-reveal-child=""><Link prefetch={false} href="/journal">Valentine Tattoo</Link><span aria-hidden="true">/</span><span>{article.readingMinutes} min di lettura</span></div>
            <a href={`#${article.chapters[0].id}`} className={styles.heroCta} data-reveal-child="">Esplora la guida <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className={styles.heroMargin} aria-hidden="true"><span>VT / JOURNAL</span><span>ART. {article.issue}</span></div>
      </header>

      <EditorialNav chapters={navigation} />

      <div className={styles.articleBody}>
        {article.chapters.map((chapter, index) => <section key={chapter.id} id={chapter.id} className={styles.chapter} aria-labelledby={`${chapter.id}-title`}><ChapterHeading chapter={chapter} index={index} /><ChapterContent chapter={chapter} sources={article.sources} /></section>)}

        <section id="faq" className={`${styles.chapter} ${styles.faq}`} aria-labelledby="faq-title">
          <div className={`text-pool ${styles.faqHeading}`}><p className={styles.kicker}><span className={styles.index}>{String(article.chapters.length + 1).padStart(2, "0")}</span>Domande frequenti</p><h2 id="faq-title" tabIndex={-1} className={styles.chapterTitle}>Prima di scegliere il tuo segno.</h2><p>Definizioni, differenze e dettagli pratici: le risposte alle domande da cui partire.</p></div>
          <div className={styles.faqList}>{article.faqs.map((faq, i) => <details key={faq.question} open={i === 0}><summary><span className={styles.faqIndex} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><span className={styles.faqQuestion}>{faq.question}</span><span className={styles.plus} aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
        </section>

        <section className={styles.sources} aria-labelledby="sources-title"><div><p className={styles.kicker}>Note editoriali</p><h2 id="sources-title">Fonti e riferimenti.</h2><p>Guida editoriale di Valentine Tattoo. I passaggi storici si basano sulle fonti qui raccolte; le informazioni sul processo di Valentina riprendono quelle presenti nel sito.</p><p className={styles.updated}>Pubblicato il <time dateTime={article.datePublished}>{formattedEditorialDate(article.datePublished)}</time>.<br />Ultima revisione: <time dateTime={article.dateModified}>{formattedEditorialDate(article.dateModified)}</time>.</p></div><ol>{article.sources.map((source, i) => <li key={source.id}><span aria-hidden="true">0{i + 1}</span><a href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.name}</strong><span>{source.title}</span><span className={styles.sourceArrow} aria-hidden="true">↗</span></a></li>)}</ol></section>

        <aside className={styles.finalCta} aria-label="Richiedi il tuo progetto"><OrnamentDivider width="280px" /><p className={styles.kicker}>Dall’ispirazione alla pelle</p><p className={styles.finalTitle}>Che forma ha<br />la tua idea?</p><p>Raccontala a Valentina. Il prossimo passo è una consulenza.</p><div className={styles.ctas}><EditorialButton href="/#booking" variant="solid" trailing={<ArrowRightIcon size={17} />}>Parliamo del tuo tatuaggio</EditorialButton><a href={instagramProfile.directMessageUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Scrivi su Instagram ↗</a></div></aside>
      </div>
    </article>
  );
}
