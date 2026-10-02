import { cyberSigilism } from "./cyber-sigilism";
import type { EditorialArticle } from "./types";

/** Add a researched article here; routing, index, metadata and sitemap follow. */
export const editorialArticles: EditorialArticle[] = [cyberSigilism];
export function findEditorialArticle(slug: string) {
  return editorialArticles.find((article) => article.slug === slug);
}
