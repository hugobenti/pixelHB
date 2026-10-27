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
  await syncStore.putFromRemote("u2", remote("r1", 4000), undefined);
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
  await syncStore.markTooLarge(c.id, 2000);
  await syncStore.putFromRemote("u1", remote("r", 500), undefined);
  await syncStore.putFromRemote("u2", remote("other", 100), undefined);
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
  await syncStore.markTooLarge(art.id, art.updatedAt);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("tooLarge");
  await artworkService.saveArtwork(art);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("dirty");
});

test("removeLocal deletes the row without a tombstone", async () => {
  await syncStore.putFromRemote("u1", remote("r1", 4000), undefined);
  expect(await syncStore.removeLocal("r1", { ownerId: "u1", updatedAt: 4000, state: "synced" })).toBe(true);
  expect(await db.artworks.get("r1")).toBeUndefined();
  expect(await db.deletions.count()).toBe(0);
});

test("adoptUnowned gives every signed-out row to the owner as dirty and leaves other owners alone", async () => {
  await artworkService.createArtwork(input);
  await artworkService.createArtwork(input);
  await syncStore.putFromRemote("u2", remote("theirs", 4000), undefined);
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
  await syncStore.markTooLarge(big.id, 1000);
  const gone = await artworkService.createArtwork(input);
  await syncStore.markSynced(gone.id, 1000);
  at(3000);
  await artworkService.deleteArtwork(gone.id); // tombstone
  await syncStore.putFromRemote("u2", remote("theirs", 4000), undefined);
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

const synced = (ownerId: string, updatedAt: number) => ({ ownerId, updatedAt, state: "synced" as const });

test("putFromRemote writes over a row that still matches and over an absent row", async () => {
  expect(await syncStore.putFromRemote("u1", remote("a", 100), undefined)).toBe(true);
  expect(await syncStore.putFromRemote("u1", remote("a", 200), synced("u1", 100))).toBe(true);
  expect((await db.artworks.get("a"))?.updatedAt).toBe(200);
});

test("putFromRemote does not overwrite a row edited, re-owned or created since it was read", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  await syncStore.markSynced(art.id, 1000);
  at(2000);
  await artworkService.saveArtwork(art); // edited after the decision was made on the synced row
  expect(await syncStore.putFromRemote("u1", { ...remote(art.id, 5000), title: "Drive" }, synced("u1", 1000))).toBe(false);
  expect(await db.artworks.get(art.id)).toMatchObject({ title: "Cat", updatedAt: 2000, sync: { state: "dirty" } });

  expect(await syncStore.putFromRemote("u1", remote(art.id, 5000), undefined)).toBe(false); // row appeared
  expect(await syncStore.putFromRemote("u9", remote(art.id, 5000), { ownerId: "u9", updatedAt: 2000, state: "dirty" })).toBe(false); // other owner
  expect(await syncStore.putFromRemote("u1", remote("gone", 5000), synced("u1", 1))).toBe(false); // row vanished
  expect(await db.artworks.get("gone")).toBeUndefined();
});

test("removeLocal keeps a row that changed since it was read, or no longer exists", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  await syncStore.markSynced(art.id, 1000);
  at(2000);
  await artworkService.saveArtwork(art);
  expect(await syncStore.removeLocal(art.id, synced("u1", 1000))).toBe(false);
  expect(await db.artworks.get(art.id)).toBeDefined();
  expect(await syncStore.removeLocal("missing", synced("u1", 1))).toBe(false);
});

test("markTooLarge only marks the version that was pushed", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  at(2000);
  await artworkService.saveArtwork(art);
  expect(await syncStore.markTooLarge(art.id, 1000)).toBe(false);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("dirty");
  expect(await syncStore.markTooLarge(art.id, 2000)).toBe(true);
  expect((await db.artworks.get(art.id))?.sync.state).toBe("tooLarge");
  expect(await syncStore.markTooLarge("missing", 1)).toBe(false);
});
