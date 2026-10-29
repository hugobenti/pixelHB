/**
 * Purpose:
 * App font definitions (next/font): Schibsted Grotesk for the interface and JetBrains Mono for
 * numbers (sizes, zoom, hex), exposed as the CSS variables the `font-sans` / `font-mono` tokens in
 * globals.css read. Both themes share them; see DESIGN.md "Typography". Roboto Medium is for the
 * Sign in with Google button only (`font-google-btn`), as Google's branding guidelines require.
 */
import { JetBrains_Mono, Roboto, Schibsted_Grotesk } from "next/font/google";

export const fontSans = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const fontGoogleButton = Roboto({
  variable: "--font-roboto",
  weight: "500",
  subsets: ["latin"],
  display: "swap",
});
