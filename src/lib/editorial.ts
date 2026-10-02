import type { Metadata } from "next";
import { artist, instagramProfile, siteUrl } from "@/config/site-config";
import type { EditorialArticle } from "@/content/editorial/types";

export const journalPath = "/journal";
export const articlePath = (article: EditorialArticle) => `${journalPath}/${article.slug}`;

export function editorialMetadata(article: EditorialArticle): Metadata {
  const title = article.seoTitle;
  const url = `${siteUrl}${articlePath(article)}`;
  const images = [{ url: article.ogImage, width: 1200, height: 630, alt: `${article.title} — ${artist.brand}` }];
  return {
    title, description: article.description,
    authors: [{ name: artist.brand, url: `${siteUrl}${journalPath}` }],
    alternates: { canonical: articlePath(article) },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article", locale: "it_IT", siteName: artist.brand, title,
      description: article.description, url, images,
      publishedTime: article.datePublished, modifiedTime: article.dateModified,
    },
    twitter: { card: "summary_large_image", title, description: article.description, images: [article.ogImage] },
  };
}

export function editorialSchema(article: EditorialArticle) {
  const url = `${siteUrl}${articlePath(article)}`;
  const brandId = `${siteUrl}/#brand`;
  const artistId = `${siteUrl}/#valentina-stucchi`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": brandId, name: artist.brand, url: siteUrl, sameAs: [instagramProfile.url] },
      {
        "@type": "Person", "@id": artistId, name: artist.name, alternateName: artist.brand, jobTitle: artist.role,
        url: `${siteUrl}/#about`, image: `${siteUrl}/images/valentina/portrait.webp`,
        sameAs: [instagramProfile.url], knowsAbout: ["Cyber Tribal", "Neo Tribal", "Biomechanical Tattoo", "Dark Ornamental"],
        workLocation: {
          "@type": "Place", name: artist.studio,
          address: { "@type": "PostalAddress", addressLocality: artist.city, addressRegion: "Puglia", addressCountry: "IT" },
          containedInPlace: { "@type": "Place", name: "Provincia di Bari" },
        },
      },
      {
        "@type": "WebPage", "@id": url, url, name: article.title,
        inLanguage: "it-IT", description: article.description,
        breadcrumb: { "@id": `${url}#breadcrumb` }, mainEntity: { "@id": `${url}#article` },
      },
      {
        "@type": "Article", "@id": `${url}#article`, mainEntityOfPage: { "@id": url },
        headline: article.headline, description: article.description,
        inLanguage: "it-IT", datePublished: article.datePublished, dateModified: article.dateModified,
        author: { "@id": brandId }, publisher: { "@id": brandId },
        image: [
          `${siteUrl}${article.ogImage}`,
          ...article.chapters.flatMap((chapter) => chapter.type === "portfolio" ? chapter.images.map((image) => `${siteUrl}${image.src}-1200.webp`) : []),
        ],
        about: article.topics.map((name) => ({ "@type": "Thing", name })),
        mentions: { "@id": artistId }, citation: article.sources.map((source) => source.url),
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Valentine Tattoo", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${siteUrl}${journalPath}` },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
      {
        "@type": "FAQPage", "@id": `${url}#faq`, isPartOf: { "@id": url },
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question", name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

export function formattedEditorialDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(new Date(`${date}T12:00:00Z`));
}
