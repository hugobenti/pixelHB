import type { IAboutContent } from "./content.type";
import { site } from "./site";

export const about: IAboutContent = {
  metaTitle: "About",
  metaDescription: "Who makes PixelHB, and why your art always stays yours.",
  h1: "About PixelHB",
  intro:
    "What you draw is yours. PixelHB is just the tool: a pixel-art editor that runs in your browser, made for drawing sprites, icons and tiles without installs or waiting.",
  ownership: {
    id: "ownership",
    title: "Your art belongs to you",
    paragraphs: [
      "PixelHB keeps no copies of your work and makes no claim on it. What you make, you own: share it, sell it, put it in your game.",
    ],
    outcomes: [
      {
        title: "If you’re signed in with Google",
        paragraphs: [
          "Signing in is optional. Your artworks are saved in this browser and in a PixelHB folder in your own Google Drive, so you can open them on any device.",
          "On the way, they pass through PixelHB’s server, which only forwards them and never stores them. PixelHB can see only the files it created, nothing else in your Drive.",
        ],
      },
      {
        title: "If you’re signed out",
        paragraphs: [
          "Your artworks stay in this browser on this device. Clearing your browsing data deletes them, so download the artwork file to keep a copy.",
        ],
      },
    ],
    exports:
      "Exports are yours too: a PNG ready for your game or a post, and an artwork file that keeps every layer and the palette, so you can keep editing in any browser.",
    links: [
      { label: "Where your work is saved", href: "/help#saving" },
      { label: "How PixelHB handles your data", href: "/privacy" },
    ],
  },
  story: {
    id: "why",
    title: "Why PixelHB exists",
    paragraphs: [
      "I was working on an art project and needed a complete pixel tool: layers I could organize, a reference image to draw from, a palette I fully control, and nothing to install. Every editor I tried was missing something, so I built my own.",
      "Now PixelHB is for anyone who makes things a pixel at a time: artists drawing for the joy of it, and developers making sprites and tiles for their games.",
      "It grows with your feedback. If something gets between you and your art, or a tool you need is missing, tell me.",
    ],
    links: [
      { label: "Send feedback", href: "/contact" },
      { label: "View the code on GitHub", href: site.repoUrl, external: true },
    ],
  },
  signature: site.author,
  closingCta: { label: "Start drawing", href: "/gallery" },
};
