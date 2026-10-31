/**
 * Purpose:
 * Toolbar button that shows the active layer (preview + name) and opens the Layers drawer.
 *
 * Notes:
 * Outlined at rest; pressedState while the drawer is open, never the accent.
 */
"use client";

import { LayerPreview } from "@/features/editor/components/LayersDrawer/LayerPreview";
import { activeLayerChip } from "./ActiveLayerChip.style";
import type { IActiveLayerChipProps } from "./ActiveLayerChip.type";
import { useActiveLayerChip } from "./useActiveLayerChip";

export function ActiveLayerChip(props: IActiveLayerChipProps) {
  const { layer, palette, width, height, revision, pressed, onClick } = props;
  const { label } = useActiveLayerChip(props);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className={activeLayerChip.base}
      onClick={onClick}
    >
      <span className={activeLayerChip.well}>
        <LayerPreview
          layer={layer}
          palette={palette}
          width={width}
          height={height}
          revision={revision}
        />
      </span>
      <span className={activeLayerChip.layerName}>{layer.name}</span>
    </button>
  );
}
