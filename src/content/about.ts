import type { IAboutContent } from "./content.type";
import { site } from "./site";

export const about: IAboutContent = {
  metaTitle: "About",
  metaDescription: "Who makes PixelHB, and why your art always stays yours.",
  h1: "About PixelHB",
  intro:
    "What you draw is yours. PixelHB is just the tool: a pixel-art editor that runs in your browser, made for drawing sprites, icons and tiles without installs or waiting.",
  sections: [
    {
      id: "ownership",
      title: "Your art belongs to you",
      paragraphs: [
        "PixelHB keeps no copies of your work and makes no claim on it. What you make, you own: share it, sell it, put it in your game.",
        "If you don’t sign in, your artworks stay in this browser.",
        "Sign in with Google (optional) and they live in your own Google Drive, in a PixelHB folder you control. On the way there they pass through PixelHB’s server, which forwards them and never stores them. PixelHB can only see the files it created, nothing else in your Drive.",
        "Exports are yours too: PNG and JSON files you can keep anywhere.",
      ],
    },
    {
      id: "why",
      title: "Why PixelHB exists",
      paragraphs: [
        "I was working on an art project and needed a complete pixel tool: layers I could organize, a reference image to draw from, a palette I fully control, and nothing to install. Every editor I tried was missing something, so I built my own.",
        "Now PixelHB is for anyone who makes things a pixel at a time: artists drawing for the joy of it, and developers making sprites and tiles for their games.",
        "It grows with your feedback. If something gets between you and your art, or a tool you need is missing, tell me.",
      ],
    },
    {
      id: "source",
      title: "Source code",
      paragraphs: ["PixelHB’s code is on GitHub."],
    },
  ],
  feedbackLink: "Send feedback",
  githubLink: "View on GitHub",
  privacyLink: "Read the privacy page",
  signature: site.author,
};
