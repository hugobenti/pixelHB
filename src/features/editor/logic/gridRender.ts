/**
 * Purpose:
 * Draw the editorial pixel grid overlay in world space with viewport-aligned transforms and culling.
 *
 * Notes (optional):
 * Symmetry guides use the artwork mid-lines in world space (half-width / half-height), drawn after the base grid.
 */

import type { IViewportState } from "@/features/editor/types/editor.type";

import { getVisibleWorldBounds } from "@/features/editor/logic/coordinateMath";
import type { IPixelGridRenderOptions } from "./gridRender.type";

/**
 * Strokes grid lines on pixel boundaries; skips work outside the visible world slice when bounds are provided.
 */
export function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  worldHeight: number,
  viewport: IViewportState,
  options: IPixelGridRenderOptions,
  canvasWidthCss: number,
  canvasHeightCss: number
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(viewport.viewOffset.x, viewport.viewOffset.y);
  ctx.scale(viewport.scale, viewport.scale);

  const bounds = getVisibleWorldBounds(
    viewport,
    canvasWidthCss,
    canvasHeightCss,
    worldWidth,
    worldHeight
  );

  const baseLineWidth =
    options.lineWidthWorld ?? Math.max(1.2 / viewport.scale, 1e-6);

  ctx.strokeStyle = options.color;
  ctx.lineWidth = baseLineWidth;

  const startX = Math.max(0, bounds.minX);
  const endX = Math.min(worldWidth, bounds.maxX + 1);
  const startY = Math.max(0, bounds.minY);
  const endY = Math.min(worldHeight, bounds.maxY + 1);

  ctx.beginPath();
  for (let x = startX; x <= endX; x++) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y++) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  const centerFactor = options.centerLineWidthFactor ?? 1.45;
  const guideWidth = Math.max(baseLineWidth * centerFactor, 1e-6);
  const haloWidth = guideWidth + 2 / viewport.scale;
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;

  const guides: Array<{ color: string; x0: number; y0: number; x1: number; y1: number }> = [];
  if (options.centerVerticalColor && worldWidth > 0 && cx >= startX && cx <= endX) {
    guides.push({ color: options.centerVerticalColor, x0: cx, y0: startY, x1: cx, y1: endY });
  }
  if (options.centerHorizontalColor && worldHeight > 0 && cy >= startY && cy <= endY) {
    guides.push({ color: options.centerHorizontalColor, x0: startX, y0: cy, x1: endX, y1: cy });
  }

  // Halos first, then guides, so one guide's halo never cuts into the other where they cross.
  const passes: Array<[boolean, number]> = [];
  if (options.centerHaloColor && options.centerHaloColor !== "transparent") {
    passes.push([true, haloWidth]);
  }
  passes.push([false, guideWidth]);
  for (const [isHalo, width] of passes) {
    ctx.lineWidth = width;
    for (const g of guides) {
      ctx.beginPath();
      ctx.strokeStyle = isHalo ? (options.centerHaloColor as string) : g.color;
      ctx.moveTo(g.x0, g.y0);
      ctx.lineTo(g.x1, g.y1);
      ctx.stroke();
    }
  }

  ctx.restore();
}
