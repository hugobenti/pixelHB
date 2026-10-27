/**
 * Purpose:
 * Unit tests for palette index clamping, the duplicate-color guard on append and the undoable
 * palette-color removal.
 */

import { describe, expect, it } from "vitest";

import {
  appendPaletteColor,
  clampPaletteIndex,
  countColorUsage,
  nearestPaletteIndex,
  paletteHasColor,
  removePaletteColor,
  revertPaletteRemoval,
} from "@/features/editor/logic/paletteMutations";
import { MAX_PALETTE_ENTRIES } from "@/features/shared/artwork/artworkLimits";
import { TRANSPARENT_PIXEL_INDEX } from "@/features/shared/artwork/artworkService";

describe("clampPaletteIndex", () => {
  it("clamps to palette bounds", () => {
    expect(clampPaletteIndex(5, 3)).toBe(2);
    expect(clampPaletteIndex(-1, 4)).toBe(0);
  });

  it("returns 0 when palette is empty", () => {
    expect(clampPaletteIndex(3, 0)).toBe(0);
  });
});

describe("appendPaletteColor", () => {
  it("appends a new color, normalized", () => {
    expect(appendPaletteColor(["#000000"], "#ff8800")).toEqual(["#000000", "#FF8800"]);
  });

  it("rejects a color the palette already holds, whatever its case or shorthand", () => {
    const palette = ["#000000", "#FF8800"];
    expect(appendPaletteColor(palette, "#ff8800")).toBeNull();
    expect(appendPaletteColor(["#ffffff"], "#FFF")).toBeNull();
    expect(paletteHasColor(["#aabbcc"], "#ABC")).toBe(true);
  });

  it("rejects any color once the palette is full", () => {
    const full = Array.from(
      { length: MAX_PALETTE_ENTRIES },
      (_, i) => `#${i.toString(16).padStart(6, "0")}`
    );
    expect(appendPaletteColor(full, "#ABCDEF")).toBeNull();
  });
});

const PALETTE = ["#000000", "#ff0000", "#00ff00", "#0000ff"];

function layers() {
  return [
    { id: "a", pixelData: Uint8Array.from([0, 1, 2, 3, 2]) },
    { id: "b", pixelData: Uint8Array.from([2, 2, 3, 0, 1]) },
  ];
}

describe("removePaletteColor", () => {
  it("drops the color, remaps every layer and records the pixels that used it", () => {
    const ls = layers();
    const result = removePaletteColor(ls, PALETTE, 2, { primaryIndex: 3, secondaryIndex: 2 }, 0);

    expect(result?.palette).toEqual(["#000000", "#ff0000", "#0000ff"]);
    expect(Array.from(ls[0].pixelData)).toEqual([0, 1, 0, 2, 0]);
    expect(Array.from(ls[1].pixelData)).toEqual([0, 0, 2, 0, 1]);
    expect(result?.removal.index).toBe(2);
    expect(result?.removal.color).toBe("#00ff00");
    expect(result?.removal.removedPixels.map((p) => [p.layerId, Array.from(p.indices)])).toEqual([
      ["a", [2, 4]],
      ["b", [0, 1]],
    ]);
    expect(result?.slots).toEqual({ primaryIndex: 2, secondaryIndex: 0 });
  });

  it("paints the removed color's pixels with the chosen replacement, not palette index 0", () => {
    const ls = layers();
    const result = removePaletteColor(ls, PALETTE, 2, { primaryIndex: 0, secondaryIndex: 1 }, 3);

    // #0000ff was index 3 and is index 2 once #00ff00 is gone.
    expect(Array.from(ls[0].pixelData)).toEqual([0, 1, 2, 2, 2]);
    expect(Array.from(ls[1].pixelData)).toEqual([2, 2, 2, 0, 1]);
    expect(result?.removal.replacement).toBe(2);
  });

  it("erases the removed color's pixels when the replacement is transparent", () => {
    const ls = layers();
    removePaletteColor(ls, PALETTE, 1, { primaryIndex: 0, secondaryIndex: 1 }, null);

    expect(Array.from(ls[0].pixelData)).toEqual([0, TRANSPARENT_PIXEL_INDEX, 1, 2, 1]);
    expect(Array.from(ls[1].pixelData)).toEqual([1, 1, 2, 0, TRANSPARENT_PIXEL_INDEX]);
  });

  it("refuses the last color, an index out of range, or a replacement that isn't another color", () => {
    const slots = { primaryIndex: 0, secondaryIndex: 1 };
    expect(removePaletteColor(layers(), ["#000000"], 0, slots, null)).toBeNull();
    expect(removePaletteColor(layers(), PALETTE, 4, slots, 0)).toBeNull();
    expect(removePaletteColor(layers(), PALETTE, 2, slots, 2)).toBeNull();
    expect(removePaletteColor(layers(), PALETTE, 2, slots, 4)).toBeNull();
  });

  it("leaves every buffer untouched when it refuses", () => {
    const ls = layers();
    const before = ls.map((l) => Array.from(l.pixelData));
    removePaletteColor(ls, PALETTE, 2, { primaryIndex: 0, secondaryIndex: 1 }, 2);
    expect(ls.map((l) => Array.from(l.pixelData))).toEqual(before);
  });
});

describe("countColorUsage", () => {
  it("counts the pixels using a palette index across every layer", () => {
    expect(countColorUsage(layers(), 2)).toBe(4);
    expect(countColorUsage(layers(), 1)).toBe(2);
    expect(countColorUsage([{ id: "a", pixelData: new Uint8Array(4).fill(255) }], 0)).toBe(0);
  });
});

describe("nearestPaletteIndex", () => {
  it("returns the closest other color by RGB distance", () => {
    const palette = ["#000000", "#F4F4F4", "#B13E53", "#EF7D57", "#FFFFFF"];
    expect(nearestPaletteIndex(palette, 2)).toBe(3);
    expect(nearestPaletteIndex(palette, 4)).toBe(1);
  });

  it("never returns the color itself, prefers the lower index on ties, and is null when alone", () => {
    expect(nearestPaletteIndex(["#FF0000", "#FF0000", "#FF0000"], 1)).toBe(0);
    expect(nearestPaletteIndex(["#101010", "#000000", "#202020"], 1)).toBe(0);
    expect(nearestPaletteIndex(["#123456"], 0)).toBeNull();
  });
});

describe("revertPaletteRemoval", () => {
  it.each([
    [0, 1],
    [1, null],
    [2, 0],
    [3, 2],
  ])("restores every pixel after removing index %i (replacement %s)", (index, replacement) => {
    const ls = layers();
    const before = ls.map((l) => Array.from(l.pixelData));
    const slots = { primaryIndex: 0, secondaryIndex: 1 };
    const result = removePaletteColor(ls, PALETTE, index, slots, replacement);
    if (!result) {
      throw new Error("expected a removal");
    }

    revertPaletteRemoval(result.removal, ls, result.palette.length);

    expect(ls.map((l) => Array.from(l.pixelData))).toEqual(before);
  });

  it("shifts pixels on every current layer, including colors and layers added later", () => {
    const ls = layers();
    const result = removePaletteColor(ls, PALETTE, 1, { primaryIndex: 0, secondaryIndex: 1 }, 0);
    if (!result) {
      throw new Error("expected a removal");
    }
    ls[0].pixelData[0] = 3;
    const added = { id: "c", pixelData: Uint8Array.from([0, 1, 2, 3]) };

    revertPaletteRemoval(result.removal, [...ls, added], result.palette.length + 1);

    expect(ls[0].pixelData[0]).toBe(4);
    expect(Array.from(added.pixelData)).toEqual([0, 2, 3, 4]);
  });

  it("keeps transparent pixels (outside the palette) transparent through removal and undo", () => {
    const existing = { id: "a", pixelData: Uint8Array.from([255, 1, 3]) };
    const result = removePaletteColor([existing], PALETTE, 1, { primaryIndex: 0, secondaryIndex: 1 }, 0);
    if (!result) {
      throw new Error("expected a removal");
    }
    expect(Array.from(existing.pixelData)).toEqual([255, 0, 2]);
    const addedLater = { id: "b", pixelData: new Uint8Array(3).fill(255) };

    revertPaletteRemoval(result.removal, [existing, addedLater], result.palette.length);

    expect(Array.from(existing.pixelData)).toEqual([255, 1, 3]);
    expect(Array.from(addedLater.pixelData)).toEqual([255, 255, 255]);
  });
});
