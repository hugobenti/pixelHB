/** Artwork dimensions in world (art-pixel) units. */
export interface IBackdropSize {
  width: number;
  height: number;
}

/** Resolved CSS colors of the two checkerboard tones. */
export interface IBackdropColors {
  light: string;
  dark: string;
}

/** Size of the canvas element in CSS pixels. */
export interface IBackdropCanvasCss {
  w: number;
  h: number;
}
