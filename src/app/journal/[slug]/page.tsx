import { notFound } from "next/navigation";
import { EditorialArticle } from "@/components/editorial/EditorialArticle";
import { editorialArticles, findEditorialArticle } from "@/content/editorial/articles";
import { editorialMetadata } from "@/lib/editorial";

export const dynamicParams = false;
export function generateStaticParams() {
  return editorialArticles.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const article = findEditorialArticle((await params).slug);
  return article ? editorialMetadata(article) : {};
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = findEditorialArticle((await params).slug);
  if (!article) notFound();
  return <EditorialArticle article={article} />;
}
