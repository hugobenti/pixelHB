import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeEach, expect, test } from "vitest";

import { PixelCraftDB } from "./dexie.config";

beforeEach(async () => {
  await Dexie.delete("PixelCraftDB");
});

test("upgrading a v3 database keeps every artwork as a signed-out local row", async () => {
  const legacy = new Dexie("PixelCraftDB");
  legacy.version(3).stores({ artworks: "id, updatedAt, title" });
  const rows = [
    {
      id: "old",
      title: "Old",
      width: 1,
      height: 1,
      createdAt: 1,
      updatedAt: 2,
      thumbnail: "",
      palette: ["#000000"],
      layers: [{ id: "l", name: "L", visible: true, pixelData: new Uint8Array([0]) }],
      activeLayerId: "l",
    },
    {
      id: "ref",
      title: "With reference",
      width: 2,
      height: 2,
      createdAt: 5,
      updatedAt: 9,
      thumbnail: "data:image/png;base64,AAAA",
      palette: ["#000000", "#FFFFFF"],
      layers: [
        { id: "a", name: "A", visible: true, pixelData: new Uint8Array([0, 1, 1, 0]) },
        { id: "b", name: "B", visible: false, pixelData: new Uint8Array([255, 255, 1, 255]) },
      ],
      activeLayerId: "b",
      referenceImageDataUrl: "data:image/png;base64,BBBB",
    },
  ];
  await legacy.table("artworks").bulkPut(rows);
  legacy.close();

  const upgraded = new PixelCraftDB();
  for (const row of rows) {
    expect(await upgraded.artworks.get(row.id)).toEqual({
      ...row,
      ownerId: null,
      sync: { state: "local", syncedUpdatedAt: null },
    });
  }
  expect(await upgraded.deletions.count()).toBe(0);
  expect(upgraded.verno).toBe(4);
  upgraded.close();
});
