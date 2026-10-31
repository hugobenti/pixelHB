import type { IHelpContent } from "./content.type";

export const help: IHelpContent = {
  metaTitle: "Help",
  metaDescription:
    "How to create, save, export and draw with PixelHB, plus its keyboard shortcuts.",
  h1: "Help",
  tocLabel: "On this page",
  intro: "Everything you need to start drawing, and where your art lives.",
  sections: [
    {
      id: "getting-started",
      title: "Getting started",
      paragraphs: [
        "Open your gallery and choose New artwork. Name it, pick a size (presets from 16 × 16 to 128 × 128, or type any size up to 1000 × 1000) and a background color. The editor opens right away.",
      ],
    },
    {
      id: "saving",
      title: "Where your work is saved",
      paragraphs: [
        "PixelHB saves every change automatically. Where it goes depends on whether you’re signed in. Either way, your art is yours: PixelHB keeps no copies.",
        "Signed out: your artworks stay in this browser on this device. Clearing your browsing data deletes them, and they don’t show up in a private window, another browser or another device.",
        "Signed in with Google: your artworks are also saved to a PixelHB folder in your Google Drive, so they appear on every device where you sign in. They pass through PixelHB’s server on the way and are never stored there.",
        "Syncing happens in the background about ten seconds after you stop drawing. Offline, you keep drawing; changes are sent when you’re back online. Very large artworks may be too big to sync. They stay in this browser, so export them to keep a copy.",
        "Deleting an artwork’s file in your Drive removes it from PixelHB on your devices too; restore it from the Drive trash and it comes back.",
        "If the same artwork is changed on two devices, the most recent change wins. If the older version had changes that hadn’t reached Drive, PixelHB keeps them as a separate artwork named “… (conflict copy)”.",
        "When you sign in, any artworks in this browser that aren’t tied to an account are added to your Drive, including when you sign in with a different Google account. On a shared computer, check the gallery before signing in: someone else’s drawings would be uploaded too.",
        "Signing out removes that account’s artworks from this browser; they stay in your Drive. If some changes haven’t reached Drive yet, PixelHB asks first: Download them, Sign out anyway, or Cancel.",
        "To disconnect PixelHB from your Google account, sign out, then remove PixelHB from your Google account’s third-party connections. Your files stay in your Drive.",
        "To keep a copy or move an artwork anywhere, open it, go to Settings › Export & share and choose Download JSON (editable). Open that file later with Import file in your gallery.",
      ],
    },
    {
      id: "export-png",
      title: "Exporting a PNG",
      paragraphs: [
        "In the editor, open Settings › Export & share and choose Download PNG to download an image of the visible layers.",
      ],
    },
    {
      id: "phone",
      title: "On a phone",
      paragraphs: [
        "Pinch with two fingers to zoom. Turn on Pan mode in the toolbar to move around with one finger, and turn it off to draw again.",
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
    {
      id: "limits",
      title: "Limits",
      paragraphs: [
        "Canvases go up to 1000 × 1000 pixels, and each artwork’s palette holds up to 256 colors.",
      ],
    },
  ],
  shortcutsTitle: "Keyboard shortcuts",
  shortcutsIntro: "These work in the editor on a computer.",
  shortcutColumns: { action: "Action", keys: "Keys" },
  keyNames: { ctrl: "Ctrl", shift: "Shift", space: "Space", arrows: "Arrow keys", alt: "Alt" },
  shortcuts: [
    { action: "Undo", combo: { key: "z", mod: true }, effect: "undo" },
    { action: "Redo", combo: { key: "z", mod: true, shift: true }, effect: "redo" },
    { action: "Show or hide the pixel grid", combo: { key: "g" }, effect: "toggleGrid" },
    { action: "Pan while dragging", combo: { key: "Space" }, effect: "spacePan", note: "hold" },
    {
      action: "Pick a color from the canvas",
      combo: { key: "Alt" },
      effect: "altPick",
      note: "hold, then press and drag on the canvas",
    },
    {
      action: "Move the canvas",
      combo: { key: "Arrows" },
      effect: "arrowPan",
      note: "Shift for bigger steps; click the canvas first",
    },
  ],
  contactPrompt: "Something not working, or missing?",
  privacyLink: "How PixelHB handles your data",
  contactLink: "Tell me on the Feedback & contact page",
};
