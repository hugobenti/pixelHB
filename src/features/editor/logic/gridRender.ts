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

  const guideWidth = 1 / viewport.scale;
  const haloWidth = 3 / viewport.scale;
  const strokeGuide = (color: string, x0: number, y0: number, x1: number, y1: number) => {
    if (options.centerHaloColor) {
      ctx.beginPath();
      ctx.strokeStyle = options.centerHaloColor;
      ctx.lineWidth = haloWidth;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = guideWidth;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;

  if (
    options.centerVerticalColor &&
    worldWidth > 0 &&
    cx >= startX &&
    cx <= endX
  ) {
    strokeGuide(options.centerVerticalColor, cx, startY, cx, endY);
  }

  if (
    options.centerHorizontalColor &&
    worldHeight > 0 &&
    cy >= startY &&
    cy <= endY
  ) {
    strokeGuide(options.centerHorizontalColor, startX, cy, endX, cy);
  }

  ctx.restore();
}
