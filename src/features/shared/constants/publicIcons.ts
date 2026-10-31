/**
 * Purpose:
 * Root-relative URLs for SVG assets under public/icons (neutral names, shared across features).
 *
 * Notes:
 * One icon family: every file is a 24-grid, 1.5-stroke `currentColor` outline (enforced by publicIcons.test.ts).
 * One meaning per glyph: `move` shifts pixels, `resize` is canvas size, `download` exports, `photo` loads an image,
 * `pipette` picks a color from the canvas.
 */

export const PUBLIC_ICONS = {
  chevronLeft: "/icons/chevron-left.svg",
  chevronUp: "/icons/chevron-up.svg",
  chevronRight: "/icons/chevron-right.svg",
  chevronDown: "/icons/chevron-down.svg",
  xMark: "/icons/x-mark.svg",
  eye: "/icons/eye.svg",
  eyeOff: "/icons/eye-off.svg",
  grip: "/icons/grip.svg",
  pencil: "/icons/pencil.svg",
  bucket: "/icons/bucket.svg",
  eraser: "/icons/eraser.svg",
  pipette: "/icons/pipette.svg",
  copy: "/icons/copy.svg",
  undo: "/icons/undo.svg",
  redo: "/icons/redo.svg",
  pan: "/icons/pan.svg",
  move: "/icons/move.svg",
  resize: "/icons/resize.svg",
  zoomOut: "/icons/zoom-out.svg",
  zoomIn: "/icons/zoom-in.svg",
  cog: "/icons/cog.svg",
  grid: "/icons/grid.svg",
  photo: "/icons/photo.svg",
  download: "/icons/download.svg",
  dashboard: "/icons/dashboard.svg",
  swatch: "/icons/swatch.svg",
  layers: "/icons/layers.svg",
  moreHorizontal: "/icons/more-horizontal.svg",
  trash: "/icons/trash.svg",
  sun: "/icons/sun.svg",
  moon: "/icons/moon.svg",
  menu: "/icons/menu.svg",
  mail: "/icons/mail.svg",
  lock: "/icons/lock.svg",
  chat: "/icons/chat.svg",
} as const;
