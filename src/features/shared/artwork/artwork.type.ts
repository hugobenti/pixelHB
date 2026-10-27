/**
 * Purpose:
 * Core TypeScript contracts for PixelHB artwork documents, shared by persistence, the editor and the gallery.
 */

export interface IArtwork {
  id: string;
  title: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
  palette: string[];
  layers: IArtworkLayer[];
  activeLayerId: string;
  /** Legacy mono-layer payload kept for backward compatibility during hydration. */
  pixelData?: Uint8Array;
  /** Optional reduced-size base64 guide image shown as an editor overlay. */
  referenceImageDataUrl?: string;
}

export interface IArtworkLayer {
  id: string;
  name: string;
  visible: boolean;
  pixelData: Uint8Array;
}

/** Light gallery projection of an artwork: everything except pixel buffers and palette. */
export interface IArtworkSummary {
  id: string;
  title: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
}
