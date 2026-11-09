import type { IHomeContent } from "./content.type";

export const home: IHomeContent = {
  metaTitle: { absolute: "PixelHB · Pixel art editor for sprites, tiles and icons" },
  metaDescription:
    "Free pixel art editor in your browser. Draw sprites, tiles and icons with layers and palettes of up to 256 colors, then export pixel-perfect PNGs. No account needed.",
  /** U+2011 (non-breaking hyphen) keeps "pixel‑perfect" on one line. */
  h1: "Draw sprites and tiles. Export pixel\u2011perfect PNGs.",
  lead: "A focused pixel-art editor for your browser, on a computer or a phone: layers, a palette you control and a reference image to draw from. No account needed, and your art stays yours.",
  primary: "Start drawing",
  secondary: "Read the guide",
  showcase: {
    label:
      "Illustration: the PixelHB editor drawing a cat, a pitbull, a robin, a cactus and a monstera leaf, one after another, then exporting each as a PNG.",
    drawings: { cat: "Cat", robin: "Robin", pitbull: "Pitbull", monstera: "Monstera", cactus: "Cactus" },
    touch: { cat: "Eyes", robin: "Eye", pitbull: "Eyes", monstera: "Veins", cactus: "Flower" },
    tools: { brush: "Brush", bucket: "Paint bucket" },
    parts: { outline: "Outline", fill: "Fill", shadow: "Shadow", color: "Color", light: "Light" },
    status: (tool, part) => `${tool} · ${part}`,
    exporting: "Download PNG · ×1",
    pause: "Pause",
    play: "Play",
    pauseLabel: "Pause the drawing",
    playLabel: "Play the drawing",
    caption: "Illustrative samples",
  },
  promises: [
    {
      title: "Start in seconds",
      text: "No sign-up and no install. Pick a canvas size, from 16 × 16 up to 1000 × 1000, and draw.",
    },
    {
      title: "Your art is yours",
      text: "It saves as you draw, in this browser or in your own Google Drive when you sign in. PixelHB never keeps a copy.",
    },
    {
      title: "Ready for your game",
      text: "Download a PNG at its real size for your engine, or scaled up for a store page or a post.",
    },
  ],
  insideLabel: "In the editor",
  insideIntro: "The tools you reach for in every piece.",
  inside: [
    { title: "Layers", text: "Add, hide, reorder and duplicate." },
    { title: "Reference image", text: "Load a picture to draw from, right on the canvas." },
    { title: "Indexed palette", text: "Up to 256 colors. Change one and every pixel using it follows." },
    { title: "Fill", text: "Fill a connected area in one tap." },
    { title: "Shift pixels", text: "Nudge your art. Edges wrap, so you can check a tile repeats cleanly." },
    { title: "Grid and guides", text: "A pixel grid (press G) and center lines for symmetry." },
    { title: "Undo and redo", text: "Step back and forth through your edits." },
    { title: "PNG export", text: "The visible layers as one image, at 1× or scaled up." },
  ],
  stepsTitle: "How it works",
  steps: [
    { title: "Create a canvas", text: "Pick a preset or any size up to 1000 × 1000." },
    { title: "Draw", text: "With a mouse, a trackpad or your finger." },
    { title: "Export", text: "A PNG for your game, or an artwork file to keep editing." },
  ],
  storageNote:
    "Signed out, your artworks live in this browser, and clearing your browsing data deletes them. Signed in, they’re also kept in your Google Drive.",
  storageLink: "Where your work is saved",
  closingTitle: "Make your first sprite",
  closingText: "Pick a canvas size and start drawing. No account, no install.",
  closingCta: "Start drawing",
};
