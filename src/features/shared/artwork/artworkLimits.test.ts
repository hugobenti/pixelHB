import { describe, expect, it } from "vitest";
import { canAddLayer, MAX_LAYERS } from "./artworkLimits";

describe("canAddLayer", () => {
  it.each([
    [1, true],
    [MAX_LAYERS - 1, true],
    [MAX_LAYERS, false],
    [MAX_LAYERS + 1, false],
  ])("with %i layers: %s", (count, expected) => {
    expect(canAddLayer(count)).toBe(expected);
  });

  it("caps an artwork at 64 layers", () => {
    expect(MAX_LAYERS).toBe(64);
  });
});
