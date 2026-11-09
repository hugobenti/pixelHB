/**
 * Purpose:
 * Classes for HomeShowcase: a miniature of the editor (toolbar, palette row, canvas well) holding the
 * sample sprite, and the caption showing the same sprite at its real size.
 *
 * Notes:
 * The sprite is drawn at a whole-number scale (8×, 10× from `lg`) with a checkerboard of one cell per
 * art pixel, as in the editor. Pressed tool and swatch rings follow the editor's own treatment; the
 * accent never marks a pressed tool.
 */

export const homeShowcase = {
  figure: "flex min-w-0 flex-col gap-3",
  frame: "flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:p-4",
  toolbar: "flex items-center gap-2",
  back: "size-4 text-fg-soft",
  artworkTitle: "mr-auto min-w-0 truncate text-sm font-semibold text-fg",
  tools: "flex items-center gap-0.5 sm:gap-1",
  tool: "flex size-8 items-center justify-center rounded-md text-fg-soft",
  toolPressed: "bg-surface-strong text-fg ring-1 ring-control-border ring-inset",
  toolIcon: "size-[18px]",
  pair: "relative ml-1 size-8 shrink-0 rounded-md border border-control-border",
  pairPrimary: "absolute top-1.5 left-1.5 z-10 size-3.5 ring-1 ring-control-border",
  pairSecondary: "absolute right-1.5 bottom-1.5 size-3.5 ring-1 ring-control-border",
  palette: "grid grid-cols-8 gap-2 border-t border-line pt-3 sm:grid-cols-16 sm:gap-1.5",
  swatch: "aspect-square rounded-sm",
  swatchRing: {
    idle: "ring-1 ring-control-border",
    primary: "ring-2 ring-pick-primary ring-offset-1 ring-offset-surface",
    secondary: "ring-2 ring-pick-secondary ring-offset-1 ring-offset-surface",
  },
  well: "flex items-center justify-center rounded-lg bg-surface-muted py-6 sm:py-8",
  canvas:
    "pixel-checkerboard relative size-64 ring-1 ring-line-strong [--checker-size:16px] lg:size-80 lg:[--checker-size:20px]",
  sprite: "size-full [image-rendering:pixelated]",
  caption: "flex items-center gap-3 text-sm text-muted",
  spriteActual: "size-8 shrink-0 [image-rendering:pixelated]",
  size: "font-mono text-xs font-medium whitespace-nowrap text-fg",
};
