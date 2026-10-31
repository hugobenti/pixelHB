/**
 * Purpose:
 * Decide whether a finished stroke is invisible because visible layers above the active one cover it.
 *
 * Notes:
 * `layers[0]` is the topmost layer. A pixel covers when it is opaque (index below `palette.length`;
 * 255 and anything past the palette are transparent). A stroke only warns when every pixel is covered:
 * a partly visible stroke is feedback enough.
 */

import type { IArtwork } from "@/features/shared/artwork/artwork.type";

export function isStrokeHidden(
  artwork: Pick<IArtwork, "layers" | "palette">,
  activeLayerId: string,
  deltas: readonly { index: number }[],
): boolean {
  const { layers, palette } = artwork;
  const activeIdx = layers.findIndex((layer) => layer.id === activeLayerId);
  if (activeIdx <= 0 || deltas.length === 0) {
    return false;
  }
  for (const { index: pixelIndex } of deltas) {
    let covered = false;
    for (let i = 0; i < activeIdx && !covered; i++) {
      const above = layers[i];
      covered = above.visible && above.pixelData[pixelIndex] < palette.length;
    }
    if (!covered) {
      return false;
    }
  }
  return true;
}
