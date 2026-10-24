import type { Metadata } from "next";
import { about } from "./about";
import { contact } from "./contact";
import { gallery } from "./gallery";
import { help } from "./help";
import { home } from "./home";
import { site } from "./site";
import { statusPages } from "./statusPages";

/**
 * Page metadata for the whole app, derived from the site content.
 * `metadataBase` makes every relative URL (canonical, social image) absolute.
 */
export const siteMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.metaDescription,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.metaDescription,
  },
  twitter: { card: "summary_large_image" },
};

/** The gallery tab reads "Your artworks · PixelHB". */
export const galleryMetadata: Metadata = {
  title: gallery.screen.heading,
  description: gallery.metaDescription,
  alternates: { canonical: "/gallery" },
};

/** The home tab reads "PixelHB · Pixel art, right in your browser" (no template suffix). */
export const homeMetadata: Metadata = {
  title: home.metaTitle,
  description: home.metaDescription,
  alternates: { canonical: "/" },
};

export const aboutMetadata: Metadata = {
  title: about.metaTitle,
  description: about.metaDescription,
  alternates: { canonical: "/about" },
};

export const contactMetadata: Metadata = {
  title: contact.metaTitle,
  description: contact.metaDescription,
  alternates: { canonical: "/contact" },
};

export const helpMetadata: Metadata = {
  title: help.metaTitle,
  description: help.metaDescription,
  alternates: { canonical: "/help" },
};

export const notFoundMetadata: Metadata = { title: statusPages.metaTitle };
