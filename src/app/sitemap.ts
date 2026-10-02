import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site-config";
import { editorialArticles } from "@/content/editorial/articles";
import { articlePath } from "@/lib/editorial";

/**
 * The sitemap.
 *
 * The home remains one entry: its section anchors are not separate pages.
 * Journal URLs follow the editorial registry, so future articles are included
 * without maintaining a second list of routes.
 *
 * `lastModified` is the build time. The page is fully static, so its content
 * cannot change between deploys, which makes the moment it was built the exact
 * truth about when it last changed.
 *
 * `changeFrequency` and `priority` are advisory only — Google has said for
 * years that it ignores both. They are here because other crawlers still read
 * them and they cost nothing, not because they will move anything on Google.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: editorialArticles.reduce((latest, article) => article.dateModified > latest ? article.dateModified : latest, "2026-10-02"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...editorialArticles.map((article) => ({
      url: `${siteUrl}${articlePath(article)}`,
      lastModified: article.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [`${siteUrl}${article.ogImage}`],
    })),
  ];
}
