/**
 * Purpose:
 * sitemap.xml listing the public pages. The editor and the gallery are left out: what they show
 * lives in each visitor's own browser.
 */
import type { MetadataRoute } from "next";

import { site } from "@/content/site";

const PUBLIC_PATHS = ["/", "/help", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({ url: `${site.url}${path}` }));
}
