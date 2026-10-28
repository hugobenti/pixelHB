import type { IHomeContent } from "./content.type";

export const home: IHomeContent = {
  metaTitle: { absolute: "PixelHB · Pixel art, right in your browser" },
  metaDescription:
    "Free online pixel art editor. Draw sprites, icons and tiles with layers and palettes up to 256 colors, then export PNG. No account needed, and your art is always yours.",
  h1: "Pixel art, right in your browser.",
  lead: "Draw sprites, icons and tiles with layers, a reference image and your own palette. No account needed. Sign in to keep your art in your own Google Drive.",
  primary: "Start drawing",
  secondary: "Read the guide",
  promises: [
    {
      title: "Open it and draw",
      text: "No sign-up and no download. Pick a canvas size and start.",
    },
    {
      title: "Your art is yours",
      text: "It saves automatically in this browser, or in your own Google Drive when you sign in. PixelHB keeps no copies.",
    },
    {
      title: "Ready for your game",
      text: "Export crisp PNGs up to 1000 × 1000 pixels, with palettes of up to 256 colors.",
    },
  ],
  insideLabel: "What’s inside",
  insideIntro: "Everything you need for sprites, icons and tiles.",
  inside: [
    { title: "Layers", text: "Add, hide, reorder and duplicate." },
    { title: "Reference image", text: "Trace over any picture." },
    { title: "Your palette", text: "Up to 256 colors, all yours." },
    { title: "Fill", text: "One tap fills an area." },
    { title: "Shift pixels", text: "Move everything; edges wrap around." },
    { title: "Grid and guides", text: "Pixel grid on G, center lines." },
    { title: "Undo and redo", text: "Step back and forth through your edits." },
    { title: "PNG export", text: "Crisp images, ready for your game." },
  ],
  stepsTitle: "How it works",
  steps: [
    { title: "Create a canvas", text: "Any size up to 1000 × 1000." },
    { title: "Draw", text: "Use a mouse, a trackpad or your finger." },
    { title: "Export", text: "A crisp PNG for your game or portfolio." },
  ],
  storageNote:
    "Signed out, your artworks live in this browser, and clearing your browsing data deletes them. Signed in, they’re kept in your Google Drive too.",
  storageLink: "Where your work is saved",
  closingTitle: "Ready to draw?",
  closingText: "Your first canvas is one click away. No sign-up needed.",
  closingCta: "Start drawing",
};
