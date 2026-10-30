import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";

export interface IUsePreparedPngParams {
  /** `null` while it is still loading; nothing renders until it is set. */
  artwork: IArtwork | null;
  scale: TExportScale;
  credit: boolean;
  /** Renders only while true (the Export panel or card menu is open). */
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
