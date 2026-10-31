/**
 * Purpose:
 * - Pure grid-line helpers used to fill gaps between pointer samples in brush strokes.
 */
import type { IGridPoint } from "./strokeLine.type";

/** Integer Bresenham line from `from` to `to`, both ends included, ordered from `from`. */
export function cellsOnLine(from: IGridPoint, to: IGridPoint): IGridPoint[] {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  const cells: IGridPoint[] = [];
  let x = from.x;
  let y = from.y;
  let err = dx - dy;
  for (;;) {
    cells.push({ x, y });
    if (x === to.x && y === to.y) {
      return cells;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Keeps only the cells inside a `width` × `height` canvas, preserving order. */
export function cellsInBounds(cells: IGridPoint[], width: number, height: number): IGridPoint[] {
  return cells.filter((c) => c.x >= 0 && c.y >= 0 && c.x < width && c.y < height);
}
