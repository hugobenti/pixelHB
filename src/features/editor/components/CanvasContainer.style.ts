/**
 * Purpose:
 * Classes for the CanvasContainer: bordered viewport shell, focusable canvas
 * stack and the artwork canvas.
 *
 * Notes:
 * The stack's focus ring sits inside the border (negative offset) and is hidden after pointer focus
 * (`data-pointer-focus`, set by useViewportNavigation), so it shows only for keyboard focus.
 */

export const canvasContainer = {
  shell:
    "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface-muted",
  stack:
    "relative z-10 h-full min-h-0 w-full min-w-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-pointer-focus:focus-visible:outline-none",
  artworkCanvas: "absolute inset-0 block h-full w-full cursor-crosshair touch-none",
};
