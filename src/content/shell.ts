import type { IShellContent } from "./content.type";

export const shell: IShellContent = {
  skipToContent: "Skip to content",
  nav: {
    gallery: "Gallery",
    help: "Help",
    about: "About",
    contact: "Feedback & contact",
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
  },
  footer: {
    tagline: "Pixel-art editor for the browser.",
    credit: "Made by Hugo Bentivegna",
    copyright: "© 2026",
    linksLabel: "Site",
  },
};
