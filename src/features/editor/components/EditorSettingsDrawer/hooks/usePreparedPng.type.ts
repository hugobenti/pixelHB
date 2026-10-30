import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";

export interface IUsePreparedPngParams {
  artwork: IArtwork;
  scale: TExportScale;
  credit: boolean;
  /** Renders only while true (the Export panel is open). */
  active: boolean;
  /** Called once per failed render. */
  onError?: (error: unknown) => void;
}

export interface IPreparedPng {
  blob: Blob;
  file: File;
  fileName: string;
  /** True when a credit strip was drawn. */
  credit: boolean;
}

export interface IPreparedPngEntry {
  /** The inputs this PNG was rendered from. */
  key: string;
  png: IPreparedPng;
}
