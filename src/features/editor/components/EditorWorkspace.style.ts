/**
 * Purpose:
 * Classes for the EditorWorkspace layout: a full-height grid (title, palette, canvas and tools areas; tools sit in the bottom row below `md`) and the canvas area.
 *
 * Notes:
 * The shell gives up `--consent-banner-height` (set while the analytics banner is shown), so the
 * banner sits below the editor instead of over the canvas or its controls.
 */

export const editorWorkspace = {
  shell:
    "mx-auto grid h-[calc(min(100dvh,100vh)-var(--consent-banner-height,0px))] min-h-0 w-full max-w-6xl grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_1fr_auto] gap-x-2 [reading-flow:grid-rows] [grid-template-areas:'title'_'palette'_'canvas'_'tools'] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto_1fr] md:[grid-template-areas:'title_tools'_'palette_palette'_'canvas_canvas']",
  chrome: "contents",
  main: "flex min-h-0 flex-col pt-2 [grid-area:canvas]",
};
