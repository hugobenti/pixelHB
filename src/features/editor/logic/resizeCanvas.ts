/**
 * Purpose:
 * Resize pixel layer buffers and full artwork dimensions with top-left anchoring.
 *
 * Notes:
 * New cells use fillPaletteIndexForExpansion (the lightest palette color, so white when present).
 * Validation delegates to artworkLimits.validateDimensions.
 */
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { validateDimensions } from "@/features/shared/artwork/artworkLimits";
import { relativeLuminance } from "@/features/shared/utils/colorContrast";
import { parseHexColor } from "@/features/shared/utils/colorConverter";

/**
 * Palette index used for newly exposed pixels after expanding the canvas: the lightest color (white
 * when the palette has it), or 0 when no entry is a readable hex color.
 */
export function fillPaletteIndexForExpansion(palette: string[]): number {
  let best = 0;
  let bestLuminance = -1;
  palette.forEach((entry, index) => {
    const hex = parseHexColor(entry);
    if (!hex) {
      return;
    }
    const luminance = relativeLuminance(hex);
    if (luminance > bestLuminance) {
      best = index;
      bestLuminance = luminance;
    }
  });
  return best;
}

/**
 * Copy pixels from source into a new buffer with different dimensions; anchor top-left.
 */
export function resizeLayerPixelData(
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  source: Uint8Array,
  fillIndex: number
): Uint8Array {
  const out = new Uint8Array(newW * newH);
  out.fill(fillIndex);
  const copyW = Math.min(oldW, newW);
  const copyH = Math.min(oldH, newH);
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      const oldIdx = x + y * oldW;
      const newIdx = x + y * newW;
      out[newIdx] = source[oldIdx];
    }
  }
  return out;
}

/**
 * Returns a new artwork with updated width/height and resized layer buffers.
 * Throws if dimensions are invalid. Returns the same reference when size is unchanged.
 */
export function resizeArtworkDimensions(
  artwork: IArtwork,
  newWidth: number,
  newHeight: number
): IArtwork {
  validateDimensions(newWidth, newHeight);
  if (newWidth === artwork.width && newHeight === artwork.height) {
    return artwork;
  }
  const fillIndex = fillPaletteIndexForExpansion(artwork.palette);
  const oldW = artwork.width;
  const oldH = artwork.height;
  const layers = artwork.layers.map((layer) => ({
    ...layer,
    pixelData: resizeLayerPixelData(
      oldW,
      oldH,
      newWidth,
      newHeight,
      layer.pixelData,
      fillIndex
    ),
  }));
  return {
    ...artwork,
    width: newWidth,
    height: newHeight,
    layers,
    updatedAt: Date.now(),
  };
}
