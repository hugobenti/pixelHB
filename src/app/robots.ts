/**
 * Purpose:
 * robots.txt: crawlers may read the public pages and the sitemap, but not the editor.
 *
 * Notes:
 * `/editor/[id]` only exists for artworks stored in a visitor's own browser, so a crawler has
 * nothing to index there.
 */
import type { MetadataRoute } from "next";

import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/editor/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
