import { describe, expect, test } from "vitest";

import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";
import {
  insertLayerAbove,
  moveLayerByIds,
  withRenamedLayer,
  withToggledVisibility,
} from "./layerEdits";

const layer = (id: string, name = id, visible = true): IArtworkLayer => ({
  id,
  name,
  visible,
  pixelData: new Uint8Array(1),
});
const layers = [layer("a"), layer("b"), layer("c")];

describe("layerEdits", () => {
  test("moveLayerByIds returns the same array when nothing moves", () => {
    expect(moveLayerByIds(layers, "a", "a")).toBe(layers);
    expect(moveLayerByIds(layers, "a", "zz")).toBe(layers);
    expect(moveLayerByIds(layers, "a", "c").map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  test("withToggledVisibility flips one layer and is null for an unknown id", () => {
    expect(withToggledVisibility(layers, "zz")).toBeNull();
    expect(withToggledVisibility(layers, "b")?.map((l) => l.visible)).toEqual([true, false, true]);
  });

  test("withRenamedLayer is null for unknown ids and unchanged names", () => {
    expect(withRenamedLayer(layers, "zz", "X")).toBeNull();
    expect(withRenamedLayer(layers, "a", "a")).toBeNull();
    expect(withRenamedLayer(layers, "a", "X")?.map((l) => l.name)).toEqual(["X", "b", "c"]);
  });
});

describe("insertLayerAbove", () => {
  const A = layer("A");
  const B = layer("B");
  const N = layer("N");

  test("puts the new layer in front of the active top layer", () => {
    expect(insertLayerAbove([A, B], "A", N).map((l) => l.id)).toEqual(["N", "A", "B"]);
  });

  test("puts the new layer directly above a lower active layer", () => {
    expect(insertLayerAbove([A, B], "B", N).map((l) => l.id)).toEqual(["A", "N", "B"]);
  });

  test("falls back to the top for an unknown active id", () => {
    expect(insertLayerAbove([A, B], "zz", N).map((l) => l.id)).toEqual(["N", "A", "B"]);
  });

  test("does not mutate the input", () => {
    const input = [A, B];
    insertLayerAbove(input, "B", N);
    expect(input).toEqual([A, B]);
  });
});
