/**
 * Purpose:
 * Flatten an artwork's visible layers into one RGBA buffer at 1×.
 *
 * Notes:
 * `layers[0]` is the top layer. A pixel index beyond the palette is transparent.
 */
import type { IArtwork } from "./artwork.type";

function parseHexRgb(color: string): [number, number, number] {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function composeArtworkRgba(
  artwork: Pick<IArtwork, "width" | "height" | "layers" | "palette">,
): Uint8ClampedArray {
  const pixelCount = artwork.width * artwork.height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);
  const palette = artwork.palette.map(parseHexRgb);
  const visibleLayers = artwork.layers.filter((layer) => layer.visible);

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    for (const layer of visibleLayers) {
      const rgb = palette[layer.pixelData[pixel]];
      if (!rgb) {
        continue;
      }
      const offset = pixel * 4;
      rgba[offset] = rgb[0];
      rgba[offset + 1] = rgb[1];
      rgba[offset + 2] = rgb[2];
      rgba[offset + 3] = 255;
      break;
    }
  }
  return rgba;
}
