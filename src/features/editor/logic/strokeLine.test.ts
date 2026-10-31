import { describe, expect, it } from "vitest";

import { cellsInBounds, cellsOnLine } from "./strokeLine";

describe("cellsOnLine", () => {
  it("draws a horizontal line", () => {
    const cells = cellsOnLine({ x: 0, y: 0 }, { x: 3, y: 0 });
    expect(cells).toHaveLength(4);
    expect(cells.map((c) => c.x)).toEqual([0, 1, 2, 3]);
  });

  it("draws a diagonal line", () => {
    expect(cellsOnLine({ x: 0, y: 0 }, { x: 3, y: 3 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });

  it("draws a steep line with each y once and connected neighbours", () => {
    const cells = cellsOnLine({ x: 0, y: 0 }, { x: 1, y: 3 });
    expect(cells).toHaveLength(4);
    expect(cells.map((c) => c.y)).toEqual([0, 1, 2, 3]);
    for (let i = 1; i < cells.length; i++) {
      expect(Math.abs(cells[i].x - cells[i - 1].x)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps order from start to end for right-to-left lines", () => {
    const cells = cellsOnLine({ x: 3, y: 1 }, { x: 0, y: 1 });
    expect(cells[0]).toEqual({ x: 3, y: 1 });
    expect(cells[cells.length - 1]).toEqual({ x: 0, y: 1 });
  });

  it("returns a single cell for identical endpoints", () => {
    expect(cellsOnLine({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([{ x: 2, y: 2 }]);
  });

  it("has length max(|dx|,|dy|)+1", () => {
    expect(cellsOnLine({ x: 0, y: 0 }, { x: 999, y: 0 })).toHaveLength(1000);
  });
});

describe("cellsInBounds", () => {
  it("drops cells outside the canvas", () => {
    const cells = cellsOnLine({ x: -2, y: 0 }, { x: 2, y: 0 });
    expect(cellsInBounds(cells, 2, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
  });

  it("drops cells beyond height and negative y", () => {
    expect(
      cellsInBounds(
        [
          { x: 0, y: -1 },
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
        1,
        1,
      ),
    ).toEqual([{ x: 0, y: 0 }]);
  });
});
