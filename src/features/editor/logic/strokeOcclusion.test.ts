import { describe, expect, it } from "vitest";

import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";
import { TRANSPARENT_PIXEL_INDEX } from "@/features/shared/artwork/artworkService";
import { isStrokeHidden } from "./strokeOcclusion";

function layer(id: string, pixels: number[], visible = true): IArtworkLayer {
  return { id, name: id, visible, pixelData: Uint8Array.from(pixels) };
}

const T = TRANSPARENT_PIXEL_INDEX;
const palette = ["#000000", "#ffffff"];

function artwork(top: IArtworkLayer) {
  return {
    palette,
    layers: [top, layer("mid", [T, T, T, T]), layer("bottom", [0, 0, 0, 0])],
  };
}

describe("isStrokeHidden", () => {
  it("is true when every stroked pixel is covered by an opaque pixel above", () => {
    expect(
      isStrokeHidden(artwork(layer("top", [0, 1, T, T])), "mid", [{ index: 0 }, { index: 1 }]),
    ).toBe(true);
  });

  it("is false when part of the stroke stays visible", () => {
    expect(
      isStrokeHidden(artwork(layer("top", [0, 1, T, T])), "mid", [
        { index: 0 },
        { index: 1 },
        { index: 2 },
      ]),
    ).toBe(false);
  });

  it("ignores hidden layers above", () => {
    expect(
      isStrokeHidden(artwork(layer("top", [0, 1, 0, 0], false)), "mid", [
        { index: 0 },
        { index: 1 },
      ]),
    ).toBe(false);
  });

  it("does not count transparent or out-of-palette pixels as covering", () => {
    expect(isStrokeHidden(artwork(layer("top", [T, T, T, T])), "mid", [{ index: 0 }])).toBe(false);
    expect(
      isStrokeHidden(artwork(layer("top", [2, 9, T, T])), "mid", [{ index: 0 }, { index: 1 }]),
    ).toBe(false);
  });

  it("is false when the active layer is topmost", () => {
    expect(isStrokeHidden(artwork(layer("top", [0, 0, 0, 0])), "top", [{ index: 0 }])).toBe(false);
  });

  it("is false for an empty stroke", () => {
    expect(isStrokeHidden(artwork(layer("top", [0, 0, 0, 0])), "mid", [])).toBe(false);
  });

  it("is false for an unknown active layer", () => {
    expect(isStrokeHidden(artwork(layer("top", [0, 0, 0, 0])), "nope", [{ index: 0 }])).toBe(false);
  });
});
