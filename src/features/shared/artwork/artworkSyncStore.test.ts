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
  await db.removedArtworks.clear();
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

test("removeLocal moves the row into the removed table without a tombstone", async () => {
  await syncStore.putFromRemote("u1", remote("r1", 4000), undefined);
  const before = await db.artworks.get("r1");
  expect(
    await syncStore.removeLocal("r1", { ownerId: "u1", updatedAt: 4000, state: "synced" }, 7000),
  ).toBe(true);
  expect(await db.artworks.get("r1")).toBeUndefined();
  expect(await db.deletions.count()).toBe(0);
  expect(await db.removedArtworks.get("r1")).toEqual({ ...before, removedAt: 7000 });
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
  expect(await syncStore.listDeletions("u1")).toEqual([
    { id: gone.id, ownerId: "u1", deletedAt: 3000 },
  ]);
  await syncStore.dropDeletion(gone.id);
  expect(await syncStore.listDeletions("u1")).toEqual([]);

  await syncStore.wipeOwner("u2");
  expect(await db.artworks.get("theirs")).toBeUndefined();
  expect(await db.deletions.get("x")).toBeUndefined();
  expect(await syncStore.listOwned("u1")).toHaveLength(2);
});

const synced = (ownerId: string, updatedAt: number) => ({
  ownerId,
  updatedAt,
  state: "synced" as const,
});

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
  expect(
    await syncStore.putFromRemote(
      "u1",
      { ...remote(art.id, 5000), title: "Drive" },
      synced("u1", 1000),
    ),
  ).toBe(false);
  expect(await db.artworks.get(art.id)).toMatchObject({
    title: "Cat",
    updatedAt: 2000,
    sync: { state: "dirty" },
  });

  expect(await syncStore.putFromRemote("u1", remote(art.id, 5000), undefined)).toBe(false); // row appeared
  expect(
    await syncStore.putFromRemote("u9", remote(art.id, 5000), {
      ownerId: "u9",
      updatedAt: 2000,
      state: "dirty",
    }),
  ).toBe(false); // other owner
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
  expect(await syncStore.removeLocal(art.id, synced("u1", 1000), 5000)).toBe(false);
  expect(await db.artworks.get(art.id)).toBeDefined();
  expect(await syncStore.removeLocal("missing", synced("u1", 1), 5000)).toBe(false);
  expect(await db.removedArtworks.count()).toBe(0);
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

test("wipeSyncedRowsOfOtherOwners removes other owners' synced rows only, and keeps their tombstones", async () => {
  const put = (
    id: string,
    ownerId: string | null,
    state: "synced" | "dirty" | "tooLarge" | "local",
  ) =>
    db.artworks.put({
      ...remote(id, 100),
      ownerId,
      sync: { state, syncedUpdatedAt: state === "local" ? null : 100 },
    });
  await put("mine", "u1", "synced");
  await put("mine-dirty", "u1", "dirty");
  await put("theirs", "u2", "synced");
  await put("theirs-other", "u3", "synced");
  await put("theirs-dirty", "u2", "dirty");
  await put("theirs-big", "u2", "tooLarge");
  await put("unowned", null, "local");
  await put("tombstoned", "u2", "synced");
  await db.deletions.bulkPut([
    { id: "tombstoned", ownerId: "u2", deletedAt: 5 },
    { id: "gone", ownerId: "u2", deletedAt: 6 },
  ]);

  expect(await syncStore.wipeSyncedRowsOfOtherOwners("u1")).toBe(2);

  const left = (await db.artworks.toArray()).map((row) => row.id).sort();
  expect(left).toEqual([
    "mine",
    "mine-dirty",
    "theirs-big",
    "theirs-dirty",
    "tombstoned",
    "unowned",
  ]);
  expect(await db.deletions.count()).toBe(2);
  expect(await syncStore.wipeSyncedRowsOfOtherOwners("u1")).toBe(0);
});

test("wipeSyncedRowsOfOtherOwners reads no row when no other owner is on disk", async () => {
  await db.artworks.put({
    ...remote("mine", 100),
    ownerId: "u1",
    sync: { state: "synced", syncedUpdatedAt: 100 },
  });
  await db.artworks.put({
    ...remote("unowned", 100),
    ownerId: null,
    sync: { state: "local", syncedUpdatedAt: null },
  });
  const bulkGet = vi.spyOn(db.artworks, "bulkGet");
  const each = vi.spyOn(db.artworks, "each");
  expect(await syncStore.wipeSyncedRowsOfOtherOwners("u1")).toBe(0);
  expect(bulkGet).not.toHaveBeenCalled();
  expect(each).not.toHaveBeenCalled();
  expect(await db.artworks.count()).toBe(2);
});

const removeSynced = async (id: string, ownerId: string, removedAt: number) => {
  await syncStore.putFromRemote(ownerId, remote(id, 100), undefined);
  await syncStore.removeLocal(id, { ownerId, updatedAt: 100, state: "synced" }, removedAt);
};

test("listRemoved lists one owner's removed rows, newest removal first", async () => {
  await removeSynced("a", "u1", 1000);
  await removeSynced("b", "u1", 3000);
  await removeSynced("c", "u1", 2000);
  await removeSynced("theirs", "u2", 9000);
  expect((await syncStore.listRemoved("u1")).map((row) => [row.id, row.removedAt])).toEqual([
    ["b", 3000],
    ["c", 2000],
    ["a", 1000],
  ]);
  expect(await syncStore.listRemoved("nobody")).toEqual([]);
});

test("restoreRemoved puts the row back as dirty so Drive gets it again, and drops the removed copy", async () => {
  await removeSynced("a", "u1", 1000);
  expect(await syncStore.restoreRemoved("a", "u1")).toBe(true);
  expect(await db.removedArtworks.count()).toBe(0);
  expect(await db.artworks.get("a")).toMatchObject({
    id: "a",
    ownerId: "u1",
    updatedAt: 100,
    sync: { state: "dirty", syncedUpdatedAt: null },
  });
  expect(await db.artworks.get("a")).not.toHaveProperty("removedAt");
});

test("restoreRemoved leaves everything alone for another owner, a missing id, or a live row with that id", async () => {
  await removeSynced("a", "u1", 1000);
  expect(await syncStore.restoreRemoved("a", "u2")).toBe(false);
  expect(await syncStore.restoreRemoved("missing", "u1")).toBe(false);
  await syncStore.putFromRemote("u1", remote("a", 500), undefined);
  expect(await syncStore.restoreRemoved("a", "u1")).toBe(false);
  expect((await db.artworks.get("a"))?.updatedAt).toBe(500);
  expect(await db.removedArtworks.count()).toBe(1);
});

test("purgeRemoved drops rows removed before the cutoff, for every owner, and returns how many", async () => {
  await removeSynced("old", "u1", 1000);
  await removeSynced("old2", "u2", 1999);
  await removeSynced("edge", "u1", 2000);
  await removeSynced("new", "u1", 3000);
  expect(await syncStore.purgeRemoved(2000)).toBe(2);
  expect((await db.removedArtworks.toArray()).map((row) => row.id).sort()).toEqual(["edge", "new"]);
});

test("wipeOwner also clears that owner's removed rows and no one else's", async () => {
  await removeSynced("mine", "u1", 1000);
  await removeSynced("theirs", "u2", 1000);
  await syncStore.wipeOwner("u1");
  expect((await db.removedArtworks.toArray()).map((row) => row.id)).toEqual(["theirs"]);
});

test("wipeSyncedRowsOfOtherOwners also clears other owners' removed rows", async () => {
  await removeSynced("mine", "u1", 1000);
  await removeSynced("theirs", "u2", 1000);
  await syncStore.wipeSyncedRowsOfOtherOwners("u1");
  expect((await db.removedArtworks.toArray()).map((row) => row.id)).toEqual(["mine"]);
});

test("putFromRemote saves the conflict copy in the same transaction as the Drive copy", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  const local = (await syncStore.getStored(art.id))!;
  const copy = { ...local, id: "copy", title: "Cat (conflict copy)" };
  expect(
    await syncStore.putFromRemote("u1", remote(art.id, 5000), { ownerId: "u1", updatedAt: 1000, state: "dirty" }, copy),
  ).toBe(true);
  expect(await db.artworks.get(art.id)).toMatchObject({ title: "Remote", updatedAt: 5000, sync: { state: "synced" } });
  expect(await db.artworks.get("copy")).toMatchObject({ title: "Cat (conflict copy)", sync: { state: "dirty" } });
});

test("putFromRemote saves no conflict copy when the row changed since it was read", async () => {
  artworkService.setActiveOwner("u1");
  at(1000);
  const art = await artworkService.createArtwork(input);
  const local = (await syncStore.getStored(art.id))!;
  at(2000);
  await artworkService.saveArtwork(art);
  expect(
    await syncStore.putFromRemote("u1", remote(art.id, 5000), { ownerId: "u1", updatedAt: 1000, state: "dirty" }, { ...local, id: "copy" }),
  ).toBe(false);
  expect(await db.artworks.get("copy")).toBeUndefined();
  expect((await db.artworks.get(art.id))?.updatedAt).toBe(2000);
});
