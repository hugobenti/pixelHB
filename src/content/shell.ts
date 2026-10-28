import type { IShellContent } from "./content.type";

export const shell: IShellContent = {
  skipToContent: "Skip to content",
  nav: {
    gallery: "Gallery",
    help: "Help",
    about: "About",
    contact: "Feedback & contact",
    privacy: "Privacy",
    github: "GitHub",
    label: "Main",
  },
  menu: { open: "Open menu", title: "Menu" },
  theme: { toDark: "Switch to dark theme", toLight: "Switch to light theme" },
  primary: { start: "Start drawing", startCompact: "Draw" },
  account: {
    sectionTitle: "Account",
    signIn: "Sign in with Google",
    openAccount: "Account",
    signOut: "Sign out",
    signInAgain: "Sign in again",
    reauthNote: "Your Google sign-in expired. Sign in again to keep syncing.",
    signingOut: "Signing out…",
    reconnecting: "Reconnecting…",
    reconnectingNote:
      "Can’t reach PixelHB’s sign-in right now. Your artworks on this device stay available.",
    signOutDialog: {
      title: "Some changes aren’t in your Drive yet",
      description: (artworks, deletions) => {
        const parts: string[] = [];
        if (artworks > 0) {
          parts.push(
            `${artworks} ${artworks === 1 ? "artwork has" : "artworks have"} changes that aren’t in your Drive. Signing out removes ${artworks === 1 ? "it" : "them"} from this browser.`,
          );
        }
        if (deletions > 0) {
          parts.push(
            artworks > 0
              ? "Artworks you deleted may come back next time you sign in."
              : `${deletions} ${deletions === 1 ? "deletion hasn’t" : "deletions haven’t"} reached your Drive yet. Artworks you deleted may come back next time you sign in.`,
          );
        }
        return parts.join(" ");
      },
      download: "Download them",
      signOutAnyway: "Sign out anyway",
      downloadedTitle: "Check your downloads",
      downloadedDescription: (count) =>
        `${count} ${count === 1 ? "file" : "files"} downloaded. If your browser blocked some, cancel and try again. You can import them from the gallery.`,
      signOut: "Sign out",
      failed: "Couldn’t sign out. Check your connection and try again.",
      unreadableTitle: "Couldn’t check for unsynced changes",
      unreadableDescription:
        "We couldn’t check this browser for unsynced changes. Signing out removes this account’s artworks from it. Sign out anyway?",
      wipeFailed:
        "Signed out, but this account’s artworks are still in this browser. They’ll be removed the next time PixelHB starts.",
      downloadFailed: "Couldn’t download your artworks. Nothing was removed.",
    },
  },
  footer: {
    tagline: "Pixel-art editor for the browser.",
    credit: "Made by Hugo Bentivegna",
    copyright: "© 2026",
    linksLabel: "Site",
  },
};
