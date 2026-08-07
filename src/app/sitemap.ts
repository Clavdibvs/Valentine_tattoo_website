import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site-config";

/**
 * The sitemap.
 *
 * One entry, because the site is one page: every nav item is an anchor into
 * `/`, not a route of its own. Listing `#creazioni`, `#booking` and the rest
 * would be actively harmful — a sitemap declares indexable URLs, fragments are
 * not URLs to a crawler, and Google reports them as errors rather than
 * indexing them separately.
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
  ];
}
