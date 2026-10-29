/**
 * Purpose:
 * App font definitions (next/font): Schibsted Grotesk for the interface and JetBrains Mono for
 * numbers (sizes, zoom, hex), exposed as the CSS variables the `font-sans` / `font-mono` tokens in
 * globals.css read. Both themes share them; see DESIGN.md "Typography". Google Sans Medium is for
 * the Sign in with Google button only (`font-google-btn`), as Google's branding guidelines require;
 * not preloaded, since most visits never show the button.
 */
import { Google_Sans, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";

export const fontSans = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const fontGoogleButton = Google_Sans({
  variable: "--font-google-sans",
  weight: "500",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  /* next/font has no metric overrides for Google Sans; fall back like Google's own button does. */
  adjustFontFallback: false,
  fallback: ["arial", "sans-serif"],
});
