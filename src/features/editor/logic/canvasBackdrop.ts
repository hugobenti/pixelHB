/**
 * Purpose:
 * Draw the transparency checkerboard inside the artwork rectangle and a 1 CSS px edge just outside it.
 *
 * Notes:
 * The checker cell is a power of two in world units so squares always line up with art pixels (or
 * halve them cleanly when zoomed in), and its on-screen size stays within [8, 16) CSS px at every zoom.
 * Only the cells inside the visible world rectangle are drawn, so a zoomed-out 1000 × 1000 artwork
 * costs the same as a small one.
 */

import type { IViewportState } from "@/features/editor/types/editor.type";
import type { IBackdropCanvasCss, IBackdropColors, IBackdropSize } from "./canvasBackdrop.type";

const MIN_CHECKER_SCREEN_PX = 8;

export function checkerWorldSize(scale: number): number {
  return 2 ** Math.ceil(Math.log2(MIN_CHECKER_SCREEN_PX / scale));
}

export function drawCanvasBackdrop(
  ctx: CanvasRenderingContext2D,
  size: IBackdropSize,
  viewport: IViewportState,
  colors: IBackdropColors,
  canvasCss: IBackdropCanvasCss,
): void {
  const { scale, viewOffset } = viewport;
  const { width, height } = size;
  const cell = checkerWorldSize(scale);

  // Tight bounds, not getVisibleWorldBounds: its ±1 margin would overdraw squares that are off screen.
  const minX = Math.max(0, -viewOffset.x / scale);
  const maxX = Math.min(width, (canvasCss.w - viewOffset.x) / scale);
  const minY = Math.max(0, -viewOffset.y / scale);
  const maxY = Math.min(height, (canvasCss.h - viewOffset.y) / scale);

  ctx.save();
  ctx.translate(viewOffset.x, viewOffset.y);
  ctx.scale(scale, scale);

  ctx.fillStyle = colors.light;
  ctx.fillRect(0, 0, width, height);

  if (minX < maxX && minY < maxY) {
    ctx.fillStyle = colors.dark;
    const firstX = Math.floor(minX / cell);
    const lastX = Math.ceil(maxX / cell);
    const firstY = Math.floor(minY / cell);
    const lastY = Math.ceil(maxY / cell);
    for (let cy = firstY; cy < lastY; cy++) {
      for (let cx = firstX; cx < lastX; cx++) {
        if ((cx + cy) % 2 !== 1) {
          continue;
        }
        const x = cx * cell;
        const y = cy * cell;
        ctx.fillRect(x, y, Math.min(cell, width - x), Math.min(cell, height - y));
      }
    }
  }

  ctx.restore();
}

export function drawCanvasEdge(
  ctx: CanvasRenderingContext2D,
  size: IBackdropSize,
  viewport: IViewportState,
  color: string,
): void {
  const { scale, viewOffset } = viewport;
  const left = Math.round(viewOffset.x) - 0.5;
  const top = Math.round(viewOffset.y) - 0.5;
  const right = Math.round(viewOffset.x + size.width * scale) + 0.5;
  const bottom = Math.round(viewOffset.y + size.height * scale) + 0.5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, right - left, bottom - top);
  ctx.restore();
}
