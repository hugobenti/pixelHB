/**
 * Purpose:
 * Classes for the root layout: full-height document and the column body the routes render into.
 *
 * Notes:
 * The body pads by `--consent-banner-height` (set while the analytics banner is shown), so the
 * fixed banner never covers the end of a page.
 */

export const rootLayout = {
  html: "h-full min-h-dvh bg-bg antialiased",
  body: "flex min-h-dvh flex-col bg-bg pb-[var(--consent-banner-height,0px)] font-sans text-sm text-fg",
};
