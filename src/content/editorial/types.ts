export type EditorialImage = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  position?: string;
};

export type EditorialSource = { id: string; name: string; title: string; url: string };
export type EditorialFAQ = { question: string; answer: string };
type ChapterBase = { id: string; label: string; title: string; intro: string };

export type EditorialChapter = ChapterBase & (
  | { type: "definition"; image: EditorialImage; traits: { title: string; text: string }[] }
  | { type: "comparison"; styles: { name: string; text: string; features: string }[]; note: string; source: string }
  | { type: "history"; timeline: { era: string; title: string; text: string; source: string }[]; influences: string[] }
  | { type: "statement"; statement: string; paragraphs: string[]; source: string }
  | { type: "process"; image: EditorialImage; steps: { title: string; text: string }[]; note: string }
  | { type: "placements"; items: { title: string; text: string }[] }
  | { type: "portfolio"; images: EditorialImage[] }
  | { type: "longevity"; items: { title: string; text: string }[]; source: string }
  | { type: "artist"; image: EditorialImage; paragraphs: string[]; quote: string }
);

export type EditorialArticle = {
  slug: string;
  issue: string;
  title: string;
  seoTitle: string;
  headline: string;
  topics: string[];
  titleLines: string[];
  subtitle: string;
  dek: string;
  definition: string;
  description: string;
  datePublished: string;
  dateModified: string;
  readingMinutes: number;
  cover: EditorialImage;
  ogImage: string;
  chapters: EditorialChapter[];
  faqs: EditorialFAQ[];
  sources: EditorialSource[];
};
