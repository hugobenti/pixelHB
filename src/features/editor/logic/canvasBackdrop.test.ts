import { describe, expect, test } from "vitest";

import { checkerWorldSize, drawCanvasBackdrop, drawCanvasEdge } from "./canvasBackdrop";

interface IFillCall {
  style: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function fakeCtx() {
  const fills: IFillCall[] = [];
  const strokes: Array<{ x: number; y: number; w: number; h: number; style: string }> = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    save() {},
    restore() {},
    translate() {},
    scale() {},
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ style: this.fillStyle, x, y, w, h });
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      strokes.push({ x, y, w, h, style: this.strokeStyle });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, strokes };
}

const colors = { light: "light", dark: "dark" };

describe("checkerWorldSize", () => {
  test.each([
    [1, 8],
    [3, 4],
    [8, 1],
    [16, 0.5],
    [40, 0.25],
  ])("scale %s gives %s world px", (scale, expected) => {
    expect(checkerWorldSize(scale)).toBe(expected);
  });

  test("on-screen square is in [8, 16) CSS px for every integer scale 1-64", () => {
    for (let scale = 1; scale <= 64; scale++) {
      const screen = scale * checkerWorldSize(scale);
      expect(screen).toBeGreaterThanOrEqual(8);
      expect(screen).toBeLessThan(16);
    }
  });
});

describe("drawCanvasBackdrop", () => {
  test("fills the artwork rectangle with light first, then dark squares", () => {
    const { ctx, fills } = fakeCtx();
    drawCanvasBackdrop(
      ctx,
      { width: 16, height: 16 },
      { scale: 16, viewOffset: { x: 0, y: 0 } },
      colors,
      { w: 1000, h: 1000 },
    );
    expect(fills[0]).toMatchObject({ style: "light", x: 0, y: 0, w: 16, h: 16 });
    expect(fills.slice(1).every((f) => f.style === "dark")).toBe(true);
  });

  test("draws only the dark squares that intersect the visible part", () => {
    const size = { width: 16, height: 16 };
    const full = fakeCtx();
    drawCanvasBackdrop(full.ctx, size, { scale: 16, viewOffset: { x: 0, y: 0 } }, colors, {
      w: 256,
      h: 256,
    });
    const quarter = fakeCtx();
    drawCanvasBackdrop(quarter.ctx, size, { scale: 16, viewOffset: { x: 0, y: 0 } }, colors, {
      w: 128,
      h: 128,
    });
    const fullDark = full.fills.length - 1;
    const quarterDark = quarter.fills.length - 1;
    expect(fullDark).toBeGreaterThan(0);
    expect(quarterDark).toBeLessThan(0.3 * fullDark);
    expect(quarterDark).toBeGreaterThan(0);
  });

  test("dark cells are those where (cx + cy) is odd", () => {
    const { ctx, fills } = fakeCtx();
    drawCanvasBackdrop(
      ctx,
      { width: 8, height: 8 },
      { scale: 8, viewOffset: { x: 0, y: 0 } },
      colors,
      { w: 64, h: 64 },
    );
    const cell = checkerWorldSize(8);
    for (const f of fills.slice(1)) {
      expect((Math.round(f.x / cell) + Math.round(f.y / cell)) % 2).toBe(1);
    }
  });
});

describe("drawCanvasEdge", () => {
  test("strokes a 1 CSS px line just outside the artwork, snapped to .5", () => {
    const { ctx, strokes } = fakeCtx();
    drawCanvasEdge(
      ctx,
      { width: 16, height: 16 },
      { scale: 10, viewOffset: { x: 20, y: 30 } },
      "edge",
    );
    expect(strokes).toEqual([{ x: 19.5, y: 29.5, w: 161, h: 161, style: "edge" }]);
  });
});
