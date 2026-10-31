/**
 * Purpose:
 * Rasterize indexed pixel data into a 2D canvas context using the artwork palette.
 */

import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IRenderOptions, IRenderViewport } from "./canvasRender.type";

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  artwork: Pick<IArtwork, "width" | "height" | "layers" | "palette">,
  viewport: IRenderViewport,
  { clear = true }: IRenderOptions = {}
): void {
  const { width, height, layers, palette } = artwork;

  if (clear) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.translate(viewport.viewOffset.x, viewport.viewOffset.y);
  ctx.scale(viewport.scale, viewport.scale);

  for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex--) {
    const layer = layers[layerIndex];
    if (!layer.visible) {
      continue;
    }
    const pixelData = layer.pixelData;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = x + y * width;
        const paletteIndex = pixelData[pixelIndex];
        const color = palette[paletteIndex] ?? "transparent";

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.restore();
}
