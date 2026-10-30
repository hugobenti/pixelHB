import { describe, expect, it } from "vitest";

import { composeArtworkRgba } from "./artworkComposite";

function layer(pixelData: number[], visible = true) {
  return { id: "l", name: "l", visible, pixelData: Uint8Array.from(pixelData) };
}

describe("composeArtworkRgba", () => {
  const palette = ["#000000", "#ff0000", "#00ff00"];

  it("takes the top visible layer's colour", () => {
    const rgba = composeArtworkRgba({
      width: 1,
      height: 1,
      palette,
      layers: [layer([1]), layer([2])],
    });
    expect(Array.from(rgba)).toEqual([255, 0, 0, 255]);
  });

  it("skips hidden layers", () => {
    const rgba = composeArtworkRgba({
      width: 1,
      height: 1,
      palette,
      layers: [layer([1], false), layer([2])],
    });
    expect(Array.from(rgba)).toEqual([0, 255, 0, 255]);
  });

  it("index beyond the palette is transparent", () => {
    const rgba = composeArtworkRgba({ width: 1, height: 1, palette, layers: [layer([9])] });
    expect(Array.from(rgba)).toEqual([0, 0, 0, 0]);
  });

  it("all layers hidden gives a fully transparent buffer of w*h*4", () => {
    const rgba = composeArtworkRgba({
      width: 3,
      height: 2,
      palette,
      layers: [layer([1, 1, 1, 1, 1, 1], false)],
    });
    expect(rgba).toHaveLength(24);
    expect(rgba.every((value) => value === 0)).toBe(true);
  });
});
