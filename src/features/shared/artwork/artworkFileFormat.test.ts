import { describe, expect, test } from "vitest";

import type { IArtwork } from "./artwork.type";
import { parseArtworkFile, serializeArtworkFile } from "./artworkFileFormat";

const b64 = (bytes: number[]) => Buffer.from(bytes).toString("base64");

function artwork(): IArtwork {
  return {
    id: "art-1",
    title: "Sunset cat",
    width: 2,
    height: 2,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_500_000,
    thumbnail: "data:image/png;base64,AAAA",
    palette: ["#000000", "#FFFFFF"],
    layers: [
      { id: "top", name: "Top", visible: false, pixelData: new Uint8Array([255, 1, 255, 0]) },
      { id: "bg", name: "Background", visible: true, pixelData: new Uint8Array([0, 1, 1, 0]) },
    ],
    activeLayerId: "top",
    referenceImageDataUrl: "data:image/jpeg;base64,BBBB",
  };
}

function v2File(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 2,
    title: "Old",
    width: 2,
    height: 1,
    palette: ["#112233", "#445566"],
    layers: [{ id: "l1", name: "Layer 1", visible: true, pixelDataBase64: b64([0, 1]) }],
    activeLayerId: "l1",
    ...overrides,
  };
}

function v3File(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...v2File(), version: 3, id: "art-9", createdAt: 10, updatedAt: 20, ...overrides };
}

describe("serializeArtworkFile + parseArtworkFile", () => {
  test("round-trips a multi-layer artwork with transparent pixels through JSON", () => {
    const file = serializeArtworkFile(artwork());
    expect(file.version).toBe(3);
    expect(file).not.toHaveProperty("thumbnail");

    const parsed = parseArtworkFile(JSON.parse(JSON.stringify(file)));
    expect(parsed?.meta).toEqual({
      id: "art-1",
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_500_000,
    });
    expect(parsed?.data).toMatchObject({
      title: "Sunset cat",
      width: 2,
      height: 2,
      palette: ["#000000", "#FFFFFF"],
      activeLayerId: "top",
      referenceImageDataUrl: "data:image/jpeg;base64,BBBB",
    });
    expect(
      parsed?.data.layers.map((l) => [l.id, l.name, l.visible, Array.from(l.pixelData)]),
    ).toEqual([
      ["top", "Top", false, [255, 1, 255, 0]],
      ["bg", "Background", true, [0, 1, 1, 0]],
    ]);
  });
});

describe("parseArtworkFile", () => {
  test("reads a v2 file with no meta", () => {
    const parsed = parseArtworkFile(v2File());
    expect(parsed?.meta).toBeNull();
    expect(Array.from(parsed!.data.layers[0].pixelData)).toEqual([0, 1]);
  });

  test("reads a v1 file with number-array layers and no meta", () => {
    const parsed = parseArtworkFile({
      ...v2File({ version: 1 }),
      layers: [{ id: "l1", name: "Layer 1", visible: true, pixelData: [1, 255] }],
    });
    expect(parsed?.meta).toBeNull();
    expect(Array.from(parsed!.data.layers[0].pixelData)).toEqual([1, 255]);
  });

  test("falls back to the first layer when activeLayerId is unknown", () => {
    expect(parseArtworkFile(v3File({ activeLayerId: "gone" }))?.data.activeLayerId).toBe("l1");
  });

  const wide = 1001;
  test.each<[string, unknown]>([
    ["unknown version", v3File({ version: 4 })],
    ["zero width", v2File({ width: 0, layers: [] })],
    [
      "width above 1000",
      v2File({
        width: wide,
        layers: [{ id: "l1", name: "L", visible: true, pixelDataBase64: b64(new Array(wide).fill(0)) }],
      }),
    ],
    ["fractional height", v2File({ height: 1.5 })],
    [
      "palette over 256 colors",
      v2File({ palette: Array.from({ length: 257 }, (_, i) => `#${i.toString(16).padStart(6, "0")}`) }),
    ],
    ["malformed palette entry", v2File({ palette: ["#112233", "red"] })],
    ["no layers", v2File({ layers: [] })],
    [
      "layer shorter than width × height",
      v2File({ layers: [{ id: "l1", name: "L", visible: true, pixelDataBase64: b64([0]) }] }),
    ],
    [
      "layer Base64 not decodable",
      v2File({ layers: [{ id: "l1", name: "L", visible: true, pixelDataBase64: "%%%not-base64" }] }),
    ],
    [
      "v1 pixel value outside a byte",
      { ...v2File({ version: 1 }), layers: [{ id: "l1", name: "L", visible: true, pixelData: [0, 256] }] },
    ],
    ["v3 with empty id", v3File({ id: "" })],
    ["v3 with string updatedAt", v3File({ updatedAt: "20" })],
    ["a string", "hello"],
    ["null", null],
  ])("rejects %s", (_label, raw) => {
    expect(parseArtworkFile(raw)).toBeNull();
  });
});
