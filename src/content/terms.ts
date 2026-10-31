import type { ITermsContent } from "./content.type";
import { site } from "./site";

export const terms: ITermsContent = {
  metaTitle: "Terms",
  metaDescription:
    "The terms for using PixelHB, the free pixel art editor: your art stays yours, fair use, and no guarantees.",
  h1: "Terms",
  intro: "The short, plain rules for using PixelHB.",
  updated: "Last updated: October 29, 2026",
  sections: [
    {
      id: "about",
      title: "What PixelHB is",
      paragraphs: [
        `PixelHB is a free pixel art editor that runs in your browser, made by ${site.author}. By using it, you accept these terms.`,
      ],
    },
    {
      id: "your-art",
      title: "Your art is yours",
      paragraphs: [
        "You own everything you make with PixelHB. PixelHB claims no rights to it.",
        "When you sign in, PixelHB only moves your files between your browser and your own Google Drive, on your behalf. The privacy page explains exactly how.",
      ],
      link: { label: "Read the privacy page", href: "/privacy" },
    },
    {
      id: "google",
      title: "Your Google account",
      paragraphs: [
        "Signing in is optional. Your use of Google Drive is also covered by Google’s own terms.",
        "You can disconnect PixelHB from your Google account at any time.",
      ],
      link: { label: "How to disconnect PixelHB", href: "/privacy#revoke" },
    },
    {
      id: "fair-use",
      title: "Fair use",
      paragraphs: [
        "Don’t use PixelHB to break the law, to attack or overload the service, or to try to access other people’s data.",
      ],
    },
    {
      id: "no-guarantees",
      title: "No guarantees",
      paragraphs: [
        "To the extent the law allows, PixelHB is provided as is, without warranties of any kind.",
        `Keep your own backups with Download JSON (Download PNG saves an image only). To the extent the law allows, neither PixelHB nor ${site.author} is liable for lost or damaged work, or for any indirect damage.`,
      ],
    },
    {
      id: "changes",
      title: "Changes",
      paragraphs: [
        "Features can change or stop. These terms can change too, and the date at the top shows the latest version. If you keep using PixelHB, you accept the updated terms.",
      ],
    },
    {
      id: "contact",
      title: "Questions",
      paragraphs: ["Something unclear? Get in touch."],
      link: { label: "Feedback & contact", href: "/contact" },
    },
  ],
};
