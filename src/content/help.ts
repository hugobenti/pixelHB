import type { IHelpContent } from "./content.type";

export const help: IHelpContent = {
  metaTitle: "Help",
  metaDescription:
    "How to create, save, export and draw with PixelHB: layers, palette, reference image, phone controls and keyboard shortcuts.",
  h1: "Help",
  tocLabel: "On this page",
  intro: "How to create, draw, export and keep your art, on a computer or a phone.",
  sections: [
    {
      id: "getting-started",
      title: "Getting started",
      paragraphs: [
        "Open your gallery and choose New artwork. Name it, pick a size (presets from 16 × 16 to 128 × 128, or type any size up to 1000 × 1000) and a background color, or turn on Transparent background for sprites. The editor opens right away.",
      ],
    },
    {
      id: "saving",
      title: "Where your work is saved",
      paragraphs: [
        "PixelHB saves every change as you draw, so you can close the tab at any time and pick up where you left off from your gallery. Where it’s kept depends on whether you’re signed in, and either way your art is yours: PixelHB keeps no copies.",
        "To keep a copy of your own, download the artwork file from Export & share in the editor.",
      ],
      subsections: [
        {
          id: "google-drive",
          title: "If you’re signed in with Google",
          note: {
            title: "On a shared computer",
            text: "Check the gallery before you sign in. Artworks in this browser that aren’t tied to an account are added to your Drive, so someone else’s drawings would be uploaded too.",
          },
          paragraphs: [
            "Your artworks are saved in this browser and to a PixelHB folder in your Google Drive, so they appear on every device where you sign in. They pass through PixelHB’s server on the way and are never stored there.",
            "Syncing happens in the background about ten seconds after you stop drawing. Offline, you keep drawing; changes are sent when you’re back online.",
            "When you sign in, any artworks in this browser that aren’t tied to an account are added to your Drive, including when you sign in with a different Google account.",
            "Signing out removes that account’s artworks from this browser; they stay in your Drive. If some changes haven’t reached Drive yet, PixelHB asks first: Download them, Sign out anyway, or Cancel.",
            "To disconnect PixelHB from your Google account, sign out, then remove PixelHB from your Google account’s third-party connections. Your files stay in your Drive.",
          ],
        },
        {
          id: "this-browser",
          title: "If you’re signed out",
          paragraphs: [
            "Your artworks stay in this browser on this device. Clearing your browsing data deletes them, and they don’t show up in a private window, another browser or another device.",
          ],
        },
        {
          id: "backup",
          title: "Keeping a copy or moving an artwork",
          paragraphs: [
            "Open the artwork, choose Export & share and download the artwork file. It’s a .json file that keeps every layer and the palette, so you can keep editing it.",
            "Open it later, in any browser or on any device, with Import file in your gallery. A PNG is an image only: it can’t be opened again with its layers.",
          ],
        },
        {
          id: "sync-edge-cases",
          title: "Conflicts, deleted files and very large artworks",
          paragraphs: [
            "If the same artwork is changed on two devices, the most recent change wins. If the older version had changes that hadn’t reached Drive, PixelHB keeps them as a separate artwork named “… (conflict copy)”.",
            "Deleting an artwork’s file in your Drive removes it from PixelHB on your devices too; restore it from the Drive trash and it comes back.",
            "Very large artworks may be too big to sync. They stay in this browser, so download the artwork file to keep a copy.",
          ],
        },
      ],
      links: [{ label: "How PixelHB handles your data", href: "/privacy" }],
    },
    {
      id: "export-png",
      title: "Exporting a PNG",
      paragraphs: [
        "In the editor, choose Export & share, pick a size and choose Download PNG. The PNG is the visible layers flattened into one image, so hidden layers are left out: ×1 is the real pixel size for a game engine, larger sizes scale every pixel up evenly for sharing.",
      ],
    },
    {
      id: "gallery",
      title: "Managing your gallery",
      paragraphs: [
        "Each artwork’s card has a menu with Rename, Share image, Duplicate and Delete. Delete asks first and can’t be undone.",
        "To open an artwork file you downloaded, choose Import file at the top of the gallery.",
      ],
    },
    {
      id: "drawing",
      title: "Drawing",
      paragraphs: [],
      subsections: [
        {
          id: "tools",
          title: "Brush, eraser and fill",
          paragraphs: [
            "The brush paints one pixel at a time; drag to draw a line. The eraser paints transparent. Fill (the paint bucket) colors the whole connected area of one color in a single click or tap. All three work on the layer you’ve chosen in Layers.",
            "Zoom with the Zoom in and Zoom out buttons. Hold Space and drag, or turn on Pan mode, to move around the canvas.",
          ],
        },
        {
          id: "colors",
          title: "Your two colors",
          paragraphs: [
            "You paint with one of two colors, shown as a pair in the toolbar. Click a palette color to paint with it, and press X or click the pair to switch to the other one. With a mouse, right-click paints with the other color.",
          ],
        },
        {
          id: "color-picker",
          title: "Picking a color from the canvas",
          paragraphs: [
            "Turn on the color picker in the toolbar (or hold Alt, Option on a Mac), press on the canvas and drag. The circle next to your pointer or finger magnifies the pixels under it: the top of its ring is the color you would pick, the bottom is the color you have now. Let go to paint with it.",
            "Letting go on an empty spot or outside the canvas changes nothing, so you can always back out.",
          ],
        },
      ],
    },
    {
      id: "layers",
      title: "Layers",
      paragraphs: [
        "Open Layers from the toolbar; its button shows the layer you’re painting on. Choose a layer in the list to paint on it.",
        "Add layer puts a new layer above the current one. Each layer can be hidden, duplicated, renamed or deleted, and you can drag layers to reorder them (on touch, hold briefly, then drag). Layers higher in the list are drawn in front.",
        "A hidden layer can’t be painted on, and hidden layers are left out of a PNG. An artwork holds up to 64 layers.",
      ],
    },
    {
      id: "palette",
      title: "Editing your palette",
      paragraphs: [
        "Each artwork has its own palette, shown above the canvas. Choose Edit palette to change it.",
        "Pick a swatch and change its value under Selected color: every pixel that uses that color changes with it. Add new color adds one to the end, up to 256, and each color can appear only once.",
        "Removing a color that pixels use asks what those pixels should become, another color or Transparent. Undo brings the color back.",
      ],
    },
    {
      id: "reference-image",
      title: "Drawing from a reference image",
      paragraphs: [
        "Open Editor settings and choose Load image to show a picture (PNG, JPEG, WebP, GIF or BMP) on the canvas at half opacity, fitted and centered, to draw from. Turn it off and on with the Reference image switch.",
        "The picture is kept with the artwork and is never part of a PNG.",
      ],
    },
    {
      id: "canvas-tools",
      title: "Shifting pixels, grid and canvas size",
      paragraphs: [
        "Shift pixels moves the current layer one pixel at a time with four arrows. Pixels that leave one edge come back on the opposite one, so you can check that a tile repeats cleanly.",
        "The pixel grid is on when you start; turn it off with Pixel grid in Editor settings, or press G. With the grid on, two center lines help with symmetry.",
        "Canvas size in Editor settings resizes the artwork. Pixels stay anchored to the top-left. Making it smaller crops every layer and clears the undo history, so PixelHB asks first.",
      ],
    },
    {
      id: "phone",
      title: "On a phone",
      paragraphs: [
        "The tools sit in one row at the bottom of the screen: Brush, Eraser, Fill, Picker, Pan and Shift, next to your two colors. At the top are Undo, Redo, Layers, Export & share and Editor settings.",
        "Pinch with two fingers to zoom. One finger draws; turn on Pan to move around with one finger, and turn it off to draw again.",
        "To reorder layers, hold a layer briefly, then drag it.",
      ],
    },
    {
      id: "limits",
      title: "Limits",
      paragraphs: [
        "Canvases go up to 1000 × 1000 pixels, each artwork holds up to 64 layers, and its palette holds up to 256 colors.",
      ],
    },
  ],
  shortcutsTitle: "Keyboard shortcuts",
  shortcutsIntro: "These work in the editor on a computer.",
  shortcutColumns: { action: "Action", keys: "Keys" },
  keyNames: { ctrl: "Ctrl", shift: "Shift", space: "Space", arrows: "Arrow keys", alt: "Alt" },
  shortcutGroups: [
    {
      title: "Edit",
      shortcuts: [
        { action: "Undo", combo: { key: "z", mod: true }, effect: "undo" },
        { action: "Redo", combo: { key: "z", mod: true, shift: true }, effect: "redo" },
      ],
    },
    {
      title: "Tools and colors",
      shortcuts: [
        { action: "Use the brush", combo: { key: "b" }, effect: "selectBrush" },
        {
          action: "Turn the eraser on or off (paints transparent)",
          combo: { key: "e" },
          effect: "toggleEraser",
        },
        { action: "Turn the paint bucket on or off", combo: { key: "f" }, effect: "toggleBucket" },
        { action: "Turn the color picker on or off", combo: { key: "i" }, effect: "togglePicker" },
        {
          action: "Pick a color from the canvas",
          combo: { key: "Alt" },
          effect: "altPick",
          note: "hold, then press and drag on the canvas",
        },
        { action: "Switch between your two colors", combo: { key: "x" }, effect: "switchSlot" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { action: "Zoom in", combo: { key: "+" }, effect: "zoomIn", note: "= works too" },
        { action: "Zoom out", combo: { key: "-" }, effect: "zoomOut" },
        { action: "Pan while dragging", combo: { key: "Space" }, effect: "spacePan", note: "hold" },
        {
          action: "Move the canvas",
          combo: { key: "Arrows" },
          effect: "arrowPan",
          note: "Shift for bigger steps; click the canvas first",
        },
        { action: "Show or hide the pixel grid", combo: { key: "g" }, effect: "toggleGrid" },
        {
          action: "Show or hide the shortcuts list",
          combo: { key: "?" },
          effect: "toggleShortcuts",
        },
      ],
    },
  ],
  contactPrompt: "Something not working, or missing?",
  contactLink: "Tell me on the Feedback & contact page",
  closingCta: { label: "Start drawing", href: "/gallery" },
};
