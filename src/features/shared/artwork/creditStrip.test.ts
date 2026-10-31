import { describe, expect, it } from "vitest";

import { WORDMARK_GRID } from "@/features/shared/brand/brandArt";
import { creditStripHeight, creditStripLayout, CREDIT_MIN_EXPORT_WIDTH } from "./creditStrip";
import { allowedExportScales, noStrip } from "./exportScale";

const WORDMARK_WIDTH = WORDMARK_GRID[0].length;
const WORDMARK_HEIGHT = WORDMARK_GRID.length;

describe("creditStripHeight", () => {
  it("is 0 below the minimum width", () => {
    expect(CREDIT_MIN_EXPORT_WIDTH).toBe(256);
    expect(creditStripHeight(255)).toBe(0);
  });

  it("is max(32, round(width * 0.08))", () => {
    expect(creditStripHeight(256)).toBe(32);
    expect(creditStripHeight(1024)).toBe(82);
    expect(creditStripHeight(4096)).toBe(328);
  });
});

describe("creditStripLayout", () => {
  it.each([256, 512, 1024, 4096])("fits the wordmark and the host text at %i px", (width) => {
    const { height, cellPx, wordmark, host } = creditStripLayout(width);
    expect(height).toBe(creditStripHeight(width));
    expect(cellPx).toBeGreaterThanOrEqual(1);
    expect(wordmark.x + WORDMARK_WIDTH * cellPx).toBeLessThan(host.x);
    expect(wordmark.y).toBeGreaterThanOrEqual(0);
    expect(wordmark.y + WORDMARK_HEIGHT * cellPx).toBeLessThanOrEqual(height);
    expect(host.fontPx).toBeGreaterThanOrEqual(12);
    expect(host.baselineY).toBeLessThanOrEqual(height);
  });

  it("returns a zero-height layout below the minimum width", () => {
    expect(creditStripLayout(100).height).toBe(0);
  });
});

describe("credit and export sizes", () => {
  it("allows only ×1 for a 1000×1000 artwork with the strip", () => {
    expect(allowedExportScales({ width: 1000, height: 1000 }, creditStripHeight)).toEqual([1]);
  });

  it("allows ×4 for a 1000×1000 artwork without the strip", () => {
    expect(allowedExportScales({ width: 1000, height: 1000 }, noStrip)).toEqual([1, 4]);
  });
});
