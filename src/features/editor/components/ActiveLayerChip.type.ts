import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface IActiveLayerChipProps {
  layer: IArtworkLayer;
  palette: string[];
  width: number;
  height: number;
  /** Bumps when a stroke commits, undoes or redoes, so the preview follows in-place edits. */
  revision: number;
  /** The Layers drawer is open. */
  pressed: boolean;
  onClick: () => void;
}
