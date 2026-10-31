import type { IPrivacyContent } from "./content.type";
import { site } from "./site";

export const privacy: IPrivacyContent = {
  metaTitle: "Privacy",
  metaDescription:
    "What PixelHB stores, what it can see in your Google Drive, and how to disconnect it.",
  h1: "Privacy",
  intro:
    "Your art belongs to you. PixelHB is the tool, not the owner: it keeps no copies of your work and makes no claim on it. This page explains exactly where your artworks go.",
  updated: "Last updated: October 30, 2026",
  sections: [
    {
      id: "without-account",
      title: "If you don’t sign in",
      paragraphs: [
        "Your artworks are saved in this browser only, in its built-in storage (IndexedDB). They are not sent to PixelHB or anyone else.",
        "Clearing your browsing data deletes them. Use Download JSON in the editor settings to keep a copy.",
      ],
    },
    {
      id: "google",
      title: "If you sign in with Google",
      paragraphs: [
        "Signing in is optional. When you do, PixelHB saves your artworks to a folder called PixelHB in your own Google Drive, so you can open them on any device.",
        "PixelHB asks Google for your name, email address and profile picture, to show who is signed in, and for permission to see and change only the files PixelHB itself creates in your Drive (Google calls this “drive.file”). It cannot see, open or list any other file in your Drive.",
        "When an artwork is saved or opened, it passes through PixelHB’s server on its way between your browser and Google Drive. The server does not store it, log its contents or keep a copy. It only forwards it.",
        "Your Google sign-in is kept in a secure, encrypted cookie in your browser. The cookie lasts up to 7 days after your last visit, and signing out also asks Google to revoke PixelHB’s access. PixelHB has no user database and no account records.",
        "PixelHB’s use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. In plain words: what PixelHB gets from Google is used only to sign you in, show who is signed in and keep your artworks in your Drive. It is never sold, never used for advertising and never passed on to anyone else, except that it travels through PixelHB’s hosting provider, Vercel, on its way between your browser and Google, or where the law requires it.",
      ],
    },
    {
      id: "browser",
      title: "What stays in your browser",
      paragraphs: [
        "A working copy of your artworks, so PixelHB works offline and opens instantly. When you’re signed in, changes are copied to your Drive automatically.",
        "Your theme choice (light or dark).",
        "When you sign out, the copies of that account’s artworks are removed from this browser. They stay in your Drive.",
        "Your analytics choice and, if you accept analytics, the random ID PostHog uses to group your visits.",
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      paragraphs: [
        "PixelHB uses Vercel Web Analytics to count page visits. It uses no cookies, doesn’t track you across sites and never sees your artworks.",
        "If you accept on the analytics banner, PixelHB also uses PostHog to learn how the app is used and where it gets in the way. The data is sent through PixelHB’s own server, which passes on none of your cookies, and is stored on PostHog’s EU servers.",
        "What is collected: anonymous usage events (which pages you open, and actions such as creating, opening, exporting or importing an artwork, starting to sign in, or a sync error code), with your browser, device type and screen size; heatmaps of where you click and how far you scroll; and session replays, a recording of how the page changes as you use it.",
        "What is not: your artworks. The canvas, thumbnails and reference images are left out of replays, and events never include artwork names, pixels or palettes. What you type is hidden in replays; the rest of the page shows as you saw it, artwork names included. Your IP address is used only to estimate your country and is then discarded. PixelHB never links this data to your Google account, your name or your email.",
        "Nothing is collected unless you accept, and declining loads nothing from PostHog. You can change your mind at any time with the switch below: turning it off stops the recording, resets PostHog’s random ID and sends no more events.",
      ],
    },
    {
      id: "revoke",
      title: "Disconnecting PixelHB from Google",
      paragraphs: [
        "Sign out from the menu in the top corner. To remove PixelHB’s access to your Google account entirely, open your Google account’s third-party connections page and remove PixelHB.",
        "Removing access does not delete anything: the PixelHB folder and its files stay in your Drive, and you can move or share them like any other file. Moving a single artwork file to the Drive trash also removes it from PixelHB on your devices at their next sync; restore it from the Drive trash within 30 days and it comes back. Trashing the whole PixelHB folder doesn’t remove anything from your devices.",
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
