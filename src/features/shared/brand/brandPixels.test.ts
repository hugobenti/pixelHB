/**
 * Purpose:
 * Unit tests for the PixelHB logo grids, their run encoding and the icon / wordmark / social image
 * layouts.
 */

import { describe, expect, it } from "vitest";

import {
  BRAND_FIXED_COLORS,
  BRAND_GRIDS,
  BRAND_STATIC_THEME_COLORS,
  HB_WORD_GRID,
  PENCIL_END_GRID,
  PIXEL_WORD_GRID,
  WORDMARK_GRID,
} from "@/features/shared/brand/brandArt";
import {
  TRANSPARENT_BACKGROUND,
  iconImage,
  ogImage,
  wordmarkSquareImage,
} from "@/features/shared/brand/brandImageLayout";
import { gridRuns } from "@/features/shared/brand/brandPixels";

const TOKENS = { surface: "#fcfbf7", bg: "#ece9e1", line: "#dcd8cd", fgSecondary: "#3a3c46" };

describe("brand grids", () => {
  it.each(Object.entries(BRAND_GRIDS))("%s is rectangular and every pixel has a color", (_name, grid) => {
    const colors = { ...BRAND_FIXED_COLORS, ...BRAND_STATIC_THEME_COLORS };
    expect(new Set(grid.map((row) => row.length)).size).toBe(1);
    const unknown = grid.join("").replaceAll(".", "").split("").filter((key) => !(key in colors));
    expect(unknown).toEqual([]);
  });

  it("the pencil and the wordmark are the same height, so the lockup lines up", () => {
    expect(BRAND_GRIDS.pencil).toHaveLength(7);
    expect(BRAND_GRIDS.wordmark).toHaveLength(7);
    expect(BRAND_GRIDS.brandPencil).toHaveLength(7);
  });
});

describe("wordmark split", () => {
  it("splits the wordmark into Pixel and HB around their one-column gap", () => {
    WORDMARK_GRID.forEach((row, y) => {
      expect(`${PIXEL_WORD_GRID[y]}.${HB_WORD_GRID[y]}`).toBe(row);
    });
    expect(PIXEL_WORD_GRID.join("")).not.toMatch(/h/);
    expect(HB_WORD_GRID.join("")).toMatch(/^[h.]+$/);
  });
});

describe("gridRuns", () => {
  it("merges same-color neighbours in a row and splits on color changes and gaps", () => {
    expect(gridRuns(["yyY.y", ".oo.."])).toEqual([
      { x: 0, y: 0, length: 2, key: "y" },
      { x: 2, y: 0, length: 1, key: "Y" },
      { x: 4, y: 0, length: 1, key: "y" },
      { x: 1, y: 1, length: 2, key: "o" },
    ]);
  });
});

function opaqueBounds(blocks: { left: number; top: number; width: number; height: number }[]) {
  return {
    left: Math.min(...blocks.map((b) => b.left)),
    top: Math.min(...blocks.map((b) => b.top)),
    right: Math.max(...blocks.map((b) => b.left + b.width)),
    bottom: Math.max(...blocks.map((b) => b.top + b.height)),
  };
}

describe("iconImage", () => {
  it.each([16, 32, 48])("draws the pencil end edge to edge on a transparent %ipx favicon", (size) => {
    const image = iconImage(size, TOKENS.surface);
    expect(image.blocks.every((b) => b.height === size / 16)).toBe(true);
    expect(gridRuns(PENCIL_END_GRID)).toHaveLength(image.blocks.length);
    expect(image.background).toBe(TRANSPARENT_BACKGROUND);
  });

  it.each([
    [180, 7],
    [192, 8],
    [512, 22],
  ])("centers the pencil end at a whole-number scale on the %ipx tile", (size, scale) => {
    const image = iconImage(size, TOKENS.surface);
    expect(image.background).toBe(TOKENS.surface);
    expect(image.blocks.every((b) => b.height === scale && Number.isInteger(b.left) && Number.isInteger(b.top))).toBe(true);
    const bounds = opaqueBounds(image.blocks);
    expect(bounds.left).toBe(size - bounds.right);
    expect(bounds.top).toBe(size - bounds.bottom);
  });

  it("keeps every pixel of the 512 tile inside the maskable safe zone (central 80% circle)", () => {
    const image = iconImage(512, TOKENS.surface);
    const radius = 512 * 0.4;
    for (const b of image.blocks) {
      for (const [x, y] of [
        [b.left, b.top],
        [b.left + b.width, b.top],
        [b.left, b.top + b.height],
        [b.left + b.width, b.top + b.height],
      ]) {
        expect(Math.hypot(x - 256, y - 256)).toBeLessThanOrEqual(radius);
      }
    }
  });
});

describe("ogImage", () => {
  it("puts the brand pencil on the 20px paper grid, centered, with the caption below it", () => {
    const image = ogImage({ paper: TOKENS.bg, gridLine: TOKENS.line, captionColor: TOKENS.fgSecondary, caption: "Pixel-art editor", fontFamily: "Schibsted Grotesk" });
    expect([image.width, image.height]).toEqual([1200, 630]);
    const pencil = image.blocks.filter((b) => b.color !== TOKENS.line);
    const bounds = opaqueBounds(pencil);
    expect(bounds.left).toBe(1200 - bounds.right);
    expect(pencil.every((b) => b.left % 20 === 0 && b.top % 20 === 0 && b.height === 20)).toBe(true);
    expect(image.caption?.top).toBeGreaterThan(bounds.bottom);
  });
});

describe("wordmarkSquareImage", () => {
  it("draws Pixel at 4x above HB at 8x, centered on an opaque 120px square", () => {
    const image = wordmarkSquareImage(120, TOKENS.surface);
    expect([image.width, image.height, image.background]).toEqual([120, 120, TOKENS.surface]);
    const pixel = image.blocks.filter((b) => b.color === BRAND_STATIC_THEME_COLORS.i);
    const hb = image.blocks.filter((b) => b.color === BRAND_STATIC_THEME_COLORS.h);
    expect(pixel.length + hb.length).toBe(image.blocks.length);
    expect(pixel.every((b) => b.height === 4)).toBe(true);
    expect(hb.every((b) => b.height === 8)).toBe(true);
    expect(opaqueBounds(pixel)).toEqual({ left: 10, top: 14, right: 110, bottom: 42 });
    expect(opaqueBounds(hb)).toEqual({ left: 16, top: 50, right: 104, bottom: 106 });
  });

  it.each([96, 120, 180, 256])("stays centered at whole-number positions at %ipx", (size) => {
    const image = wordmarkSquareImage(size, TOKENS.surface);
    expect(image.blocks.every((b) => [b.left, b.top, b.width, b.height].every(Number.isInteger))).toBe(true);
    const bounds = opaqueBounds(image.blocks);
    expect(bounds.left).toBeGreaterThan(0);
    expect(Math.abs(bounds.left - (size - bounds.right))).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.top - (size - bounds.bottom))).toBeLessThanOrEqual(1);
  });
});
