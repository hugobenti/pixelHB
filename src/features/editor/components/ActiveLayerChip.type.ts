import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface IActiveLayerChipProps {
  layer: IArtworkLayer;
  palette: string[];
  width: number;
  height: number;
  /** Bumps on every paint, so the preview follows strokes that mutate the buffer in place. */
  revision: number;
  /** The Layers drawer is open. */
  pressed: boolean;
  onClick: () => void;
}
