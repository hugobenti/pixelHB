import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface ISortableLayerItemProps {
  layer: IArtworkLayer;
  isActive: boolean;
  palette: string[];
  width: number;
  height: number;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  /** Duplicates the layer; omitted (button disabled) when the artwork holds `MAX_LAYERS`. */
  onCopyLayer?: (layerId: string) => void;
  onRenameClick: (layerId: string) => void;
  /** Opens the delete confirmation; omitted (button disabled) when this is the only layer. */
  onDeleteClick?: (layerId: string) => void;
  drawerOpen: boolean;
}
