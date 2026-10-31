import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface ILayerPreviewProps {
  layer: IArtworkLayer;
  palette: string[];
  width: number;
  height: number;
  /** Bumps when the buffer was mutated in place, so the preview redraws. */
  revision?: number;
}
