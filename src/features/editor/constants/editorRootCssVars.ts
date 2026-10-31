/**
 * Purpose:
 * Names of the design-token CSS custom properties (src/app/globals.css) the editor canvas strokes with
 * (backdrop checkerboard + edge, grid + symmetry guides).
 */

export const EDITOR_ROOT_CSS_VARS = {
  gridLine: "--color-grid-line",
  centerHorizontal: "--color-guide-horizontal",
  centerVertical: "--color-guide-vertical",
  checkerLight: "--color-checker-light",
  checkerDark: "--color-checker-dark",
  guideHalo: "--color-loupe-edge-dark",
  canvasEdge: "--color-line-strong",
} as const;
