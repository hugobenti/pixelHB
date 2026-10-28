import type { IPrivacyContent } from "./content.type";
import { site } from "./site";

export const privacy: IPrivacyContent = {
  metaTitle: "Privacy",
  metaDescription:
    "What PixelHB stores, what it can see in your Google Drive, and how to disconnect it.",
  h1: "Privacy",
  intro:
    "Your art belongs to you. PixelHB is the tool, not the owner: it keeps no copies of your work and makes no claim on it. This page explains exactly where your artworks go.",
  updated: "Last updated: October 27, 2026",
  sections: [
    {
      id: "without-account",
      title: "If you don’t sign in",
      paragraphs: [
        "Your artworks are saved in this browser only, in its built-in storage (IndexedDB). They are not sent to PixelHB or anyone else.",
        "Clearing your browsing data deletes them. Use Export JSON in the editor settings to keep a copy.",
      ],
    },
    {
      id: "google",
      title: "If you sign in with Google",
      paragraphs: [
        "Signing in is optional. When you do, PixelHB saves your artworks to a folder called PixelHB in your own Google Drive, so you can open them on any device.",
        "PixelHB asks Google for your name, email address and profile picture, to show who is signed in, and for permission to see and change only the files PixelHB itself creates in your Drive (Google calls this “drive.file”). It cannot see, open or list any other file in your Drive.",
        "When an artwork is saved or opened, it passes through PixelHB’s server on its way between your browser and Google Drive. The server does not store it, log its contents or keep a copy. It only forwards it.",
        "Your Google sign-in is kept in a secure, encrypted cookie in your browser. The cookie lasts up to 7 days after your last visit, and signing out also revokes PixelHB’s access token at Google. PixelHB has no user database and no account records.",
      ],
    },
    {
      id: "browser",
      title: "What stays in your browser",
      paragraphs: [
        "A working copy of your artworks, so PixelHB works offline and opens instantly. When you’re signed in, changes are copied to your Drive automatically.",
        "Your theme choice (light or dark).",
        "When you sign out, the copies of that account’s artworks are removed from this browser. They stay in your Drive.",
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      paragraphs: [
        "PixelHB uses Vercel Web Analytics to count page visits. It uses no cookies, doesn’t track you across sites and never sees your artworks.",
      ],
    },
    {
      id: "revoke",
      title: "Disconnecting PixelHB from Google",
      paragraphs: [
        "Sign out from the menu in the top corner. To remove PixelHB’s access to your Google account entirely, open your Google account’s third-party connections page and remove PixelHB.",
        "Removing access does not delete anything: the PixelHB folder and its files stay in your Drive, and you can move, share or delete them like any other file.",
      ],
    },
    {
      id: "contact",
      title: "Questions",
      paragraphs: [
        `PixelHB is made by ${site.author}. If anything here is unclear, get in touch.`,
      ],
    },
  ],
  revokeLink: {
    label: "Open your Google account connections",
    href: "https://myaccount.google.com/connections",
  },
  contactLink: "Feedback & contact",
};
