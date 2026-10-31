export interface IPixelGridRenderOptions {
  /** Grid stroke color, read from the `--color-grid-line` token. */
  color: string;
  /** Stroke color for the horizontal mid-line (symmetry guide). */
  centerHorizontalColor?: string;
  /** Stroke color for the vertical mid-line (symmetry guide). */
  centerVerticalColor?: string;
  /** Halo stroked 3px wide under each 1px center guide, read from `--color-guide-halo` (transparent in light: no halo). */
  centerHaloColor?: string;
  lineWidthWorld?: number;
}
