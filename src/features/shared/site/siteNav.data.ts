/**
 * Purpose:
 * The site's link lists: header nav, phone menu rows and footer links.
 */

import { shell } from "@/content/shell";
import { site } from "@/content/site";
import type { ISiteLink } from "./SiteShell.type";

export const SITE_NAV: ISiteLink[] = [
  { href: "/gallery", label: shell.nav.gallery },
  { href: "/help", label: shell.nav.help },
  { href: "/about", label: shell.nav.about },
];

export const SITE_MENU_LINKS: ISiteLink[] = [
  ...SITE_NAV,
  { href: "/contact", label: shell.nav.contact },
];

export const SITE_FOOTER_LINKS: ISiteLink[] = [
  ...SITE_MENU_LINKS,
  { href: "/privacy", label: shell.nav.privacy },
  { href: site.repoUrl, label: shell.nav.github, external: true },
];
