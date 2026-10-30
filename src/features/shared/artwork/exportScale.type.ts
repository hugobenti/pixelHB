import type { EXPORT_SCALES } from "./exportScale";

export type TExportScale = (typeof EXPORT_SCALES)[number];

export type TStripHeight = (exportWidth: number) => number;

export interface IExportArtSize {
  width: number;
  height: number;
}

export interface IExportSize {
  width: number;
  height: number;
  /** Height of the scaled art; anything below it is the credit strip. */
  artHeight: number;
}
