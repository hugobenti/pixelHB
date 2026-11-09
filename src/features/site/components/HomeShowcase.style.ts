/**
 * Purpose:
 * Classes for HomeShowcase: a miniature of the editor (toolbar, palette row, canvas well) with the
 * live canvas, its cursor and status line, and the caption showing each export at its real size.
 *
 * Notes:
 * The 48 × 48 drawings show at a whole-number scale (5×, 6× from `sm`, 7× from `lg`) on a
 * checkerboard of one cell per art pixel, as in the editor. Pressed tool and swatch rings follow the
 * editor's own treatment; the accent never marks a pressed tool. The cursor is one art pixel wide and
 * is moved with a percentage translate, so it lands on pixels at every scale.
 */

import { cx } from "@/features/shared/utils/cx";
import { button } from "@/features/shared/components/Button.style";

export const homeShowcase = {
  figure: "flex min-w-0 flex-col gap-3",
  frame: "flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:p-4",
  toolbar: "flex items-center gap-2",
  back: "size-4 text-fg-soft",
  artworkTitle: "mr-auto min-w-0 truncate text-sm font-semibold text-fg",
  tools: "flex items-center gap-0.5 sm:gap-1",
  tool: "flex size-8 items-center justify-center rounded-md text-fg-soft transition-colors",
  toolPressed: "bg-surface-strong text-fg ring-1 ring-control-border ring-inset",
  toolIcon: "size-[18px]",
  pair: "relative ml-1 size-8 shrink-0 rounded-md border border-control-border",
  pairPrimary: "absolute top-1.5 left-1.5 z-10 size-3.5 ring-1 ring-control-border",
  pairSecondary: "absolute right-1.5 bottom-1.5 size-3.5 ring-1 ring-control-border",
  palette: "grid grid-cols-8 gap-2 border-t border-line pt-3 sm:grid-cols-16 sm:gap-1.5",
  swatch: "aspect-square rounded-sm transition-shadow",
  swatchRing: {
    idle: "ring-1 ring-control-border",
    primary: "ring-2 ring-pick-primary ring-offset-1 ring-offset-surface",
    secondary: "ring-2 ring-pick-secondary ring-offset-1 ring-offset-surface",
  },
  well: "flex items-center justify-center rounded-lg bg-surface-muted p-6 sm:p-7",
  stage: cx(
    "pixel-checkerboard relative size-60 ring-1 ring-line-strong [--checker-size:10px]",
    "sm:size-72 sm:[--checker-size:12px] lg:size-[336px] lg:[--checker-size:14px]",
  ),
  canvas: "block size-full transition-opacity duration-700 [image-rendering:pixelated]",
  canvasFaded: "opacity-0",
  cursor:
    "pointer-events-none absolute top-0 left-0 size-[calc(100%/48)] transition-[transform,opacity] duration-100 ease-linear",
  cursorHidden: "opacity-0",
  cursorPixel:
    "absolute inset-0 shadow-[0_0_0_1px_var(--color-loupe-edge-light),0_0_0_2px_var(--color-loupe-edge-dark)]",
  statusRow: "flex min-h-10 items-center justify-between gap-3 text-xs text-muted",
  status: "min-w-0 truncate text-fg-secondary",
  hex: "ml-1.5 font-mono font-medium text-fg",
  pause: cx(button.base, button.size.default, button.variant.ghost),
  caption: "flex items-center gap-3 text-sm text-muted",
  export: "size-12 shrink-0 opacity-0 transition-opacity duration-500 [image-rendering:pixelated]",
  exportShown: "opacity-100",
  size: "font-mono text-xs font-medium whitespace-nowrap text-fg",
};
