export interface ICreditStripLayout {
  /** Strip height in px; 0 when the export is too narrow for a strip. */
  height: number;
  /** Side of one wordmark pixel, in px. */
  cellPx: number;
  /** Top-left of the wordmark, relative to the strip's top-left. */
  wordmark: { x: number; y: number };
  /** Left edge and baseline of the host text, relative to the strip's top-left. */
  host: { x: number; baselineY: number; fontPx: number };
}
