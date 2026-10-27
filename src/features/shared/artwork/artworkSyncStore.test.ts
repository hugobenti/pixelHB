import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { db } from "@/features/shared/db/dexie.config";
import type { IArtwork } from "./artwork.type";
import * as artworkService from "./artworkService";
import * as syncStore from "./artworkSyncStore";

const input = { title: "Cat", width: 2, height: 2, backgroundColor: "#1A1C2C" };
const at = (ms: number) => vi.spyOn(Date, "now").mockReturnValue(ms);

function remote(id: string, updatedAt: number): IArtwork {
  return {
    id,
    title: "Remote",
    width: 1,
    height: 1,
    createdAt: 1,
    updatedAt,
    thumbnail: "",
    palette: ["#000000"],
    layers: [{ id: "l", name: "L", visible: true, pixelData: new Uint8Array([255]) }],
    activeLayerId: "l",
  };
}

beforeEach(async () => {
  artworkService.setActiveOwner(null);
  await db.artworks.clear();
  await db.deletions.clear();
});
afterEach(() => vi.restoreAllMocks());

test("putFromRemote stores a synced copy at the remote updatedAt; getStored ignores the active owner", async () => {
  at(9999);
  await syncStore.putFromRemote("u2", remote("r1", 4000));
  artworkService.setActiveOwner("u1");
  const row = await syncStore.getStored("r1");
  expect(row).toMatchObject({
    ownerId: "u2",
    updatedAt: 4000,
    sync: { state: "synced", syncedUpdatedAt: 4000 },
  });
  expect(row?.layers[0].pixelData).toBeInstanceOf(Uint8Array);
  expect(Array.from(row!.layers[0].pixelData)).toEqual([255]);
  expect(await syncStore.getStored("missing")).toBeUndefined();
});

test("listOwned scopes by owner; listDirty is dirty-only, oldest first", async () => {
  artworkService.setActiveOwner("u1");
  at(3000);
  const a = await artworkService.createArtwork(input);
  at(1000);
  const b = await artworkService.createArtwork(input);
  at(2000);
  const c = await artworkService.createArtwork(input);
  await syncStore.markTooLarge(c.id);
  await syncStore.putFromRemote("u1", remote("r", 500));
  await syncStore.putFromRemote("u2", remote("other", 100));
  expect((await syncStore.listDirty("u1")).map((r) => r.id)).toEqual([b.id, a.id]);
  expect((await syncStore.listOwned("u1")).map((r) => r.id).sort()).toEqual(
    [a.id, b.id, c.id, "r"].sort(),
  );
});

test("markSynced keeps the row dirty when it was edited during the upload", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  at(2000);
  await artworkService.saveArtwork(art);
  await syncStore.markSynced(art.id, 1000);
  expect((await db.artworks.get(art.id))?.sync).toEqual({ state: "dirty", syncedUpdatedAt: 1000 });
  await syncStore.markSynced(art.id, 2000);
  expect((await db.artworks.get(art.id))?.sync).toEqual({ state: "synced", syncedUpdatedAt: 2000 });
});

test("tooLarge holds until the next real edit makes the row dirty again", async () => {
  artworkService.setActiveOwner("u1");
  const art = await artworkService.createArtwork(input);
  await syncStore.markTooLarge(art.id);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("tooLarge");
  await artworkService.saveArtwork(art);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("dirty");
});

test("removeLocal deletes the row without a tombstone", async () => {
  await syncStore.putFromRemote("u1", remote("r1", 4000));
  await syncStore.removeLocal("r1");
  expect(await db.artworks.get("r1")).toBeUndefined();
  expect(await db.deletions.count()).toBe(0);
});

test("adoptUnowned gives every signed-out row to the owner as dirty and leaves other owners alone", async () => {
  await artworkService.createArtwork(input);
  await artworkService.createArtwork(input);
  await syncStore.putFromRemote("u2", remote("theirs", 4000));
  expect(await syncStore.adoptUnowned("u1")).toBe(2);
  const mine = await syncStore.listOwned("u1");
  expect(mine).toHaveLength(2);
  expect(mine.every((r) => r.sync.state === "dirty" && r.sync.syncedUpdatedAt === null)).toBe(true);
  expect((await db.artworks.get("theirs"))?.sync.state).toBe("synced");
});

test("countUnsynced, listDeletions, dropDeletion and wipeOwner are per owner", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  await artworkService.createArtwork(input); // dirty
  const big = await artworkService.createArtwork(input);
  await syncStore.markTooLarge(big.id);
  const gone = await artworkService.createArtwork(input);
  await syncStore.markSynced(gone.id, 1000);
  at(3000);
  await artworkService.deleteArtwork(gone.id); // tombstone
  await syncStore.putFromRemote("u2", remote("theirs", 4000));
  await db.deletions.put({ id: "x", ownerId: "u2", deletedAt: 1 });

  expect(await syncStore.countUnsynced("u1")).toBe(3);
  expect(await syncStore.listDeletions("u1")).toEqual([{ id: gone.id, ownerId: "u1", deletedAt: 3000 }]);
  await syncStore.dropDeletion(gone.id);
  expect(await syncStore.listDeletions("u1")).toEqual([]);

  await syncStore.wipeOwner("u2");
  expect(await db.artworks.get("theirs")).toBeUndefined();
  expect(await db.deletions.get("x")).toBeUndefined();
  expect(await syncStore.listOwned("u1")).toHaveLength(2);
});
