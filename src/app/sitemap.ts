/**
 * Purpose:
 * sitemap.xml listing the public pages. The editor is left out: its URLs are per-visitor.
 */
import type { MetadataRoute } from "next";

import { site } from "@/content/site";

const PUBLIC_PATHS = ["/", "/gallery", "/help", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({ url: `${site.url}${path}` }));
}
