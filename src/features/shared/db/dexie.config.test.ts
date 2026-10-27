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
  await legacy.table("artworks").put({
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
  });
  legacy.close();

  const upgraded = new PixelCraftDB();
  expect(await upgraded.artworks.get("old")).toMatchObject({
    id: "old",
    updatedAt: 2,
    ownerId: null,
    sync: { state: "local", syncedUpdatedAt: null },
  });
  expect(await upgraded.deletions.count()).toBe(0);
  expect(upgraded.verno).toBe(4);
  upgraded.close();
});
