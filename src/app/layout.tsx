/**
 * Purpose:
 * Root layout for the PixelHB App Router shell (fonts, global styles, full-height body).
 *
 * Notes:
 * The inline <head> script sets `data-theme` before first paint, so the page never flashes the wrong
 * theme; React doesn't know that attribute, hence suppressHydrationWarning on <html>.
 */
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/app/AppProviders";
import { siteMetadata } from "@/content/metadata";
import { themeInitScript } from "@/features/shared/theme/themePreference";
import { cx } from "@/features/shared/utils/cx";
import { fontMono, fontSans } from "./fonts";
import { rootLayout } from "./layout.style";
import { siteViewport } from "./viewport";

import "./globals.css";

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(fontSans.variable, fontMono.variable, rootLayout.html)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={rootLayout.body}>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
