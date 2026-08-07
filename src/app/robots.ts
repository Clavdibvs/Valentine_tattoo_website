import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site-config";

/**
 * robots.txt.
 *
 * Everything is crawlable: there is one public page and nothing on it that
 * should be kept out of an index. `/api/` is disallowed only because there is
 * no reason to spend crawl budget on endpoints that return no indexable
 * content — it is not a security measure, since robots.txt is a request that
 * well-behaved crawlers honour and nothing else does.
 *
 * The `Sitemap:` line is the part that matters. It is how a crawler that
 * arrives at the domain without being told anything finds the sitemap, and it
 * works even before the site is verified in Search Console.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
