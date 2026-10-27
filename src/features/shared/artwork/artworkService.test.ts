import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "@/features/shared/db/dexie.config";
import * as artworkService from "./artworkService";
import * as syncStore from "./artworkSyncStore";

const input = { title: "Cat", width: 2, height: 2, backgroundColor: "#1A1C2C" };
const at = (ms: number) => vi.spyOn(Date, "now").mockReturnValue(ms);

beforeEach(async () => {
  artworkService.setActiveOwner(null);
  await db.artworks.clear();
  await db.deletions.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("signed out (no owner)", () => {
  test("new art is local, listed, stays local on save, and deleting leaves no tombstone", async () => {
    const art = await artworkService.createArtwork(input);
    expect(await db.artworks.get(art.id)).toMatchObject({
      ownerId: null,
      sync: { state: "local", syncedUpdatedAt: null },
    });
    expect(await artworkService.listArtworkSummaries()).toEqual([
      expect.objectContaining({ id: art.id, syncState: "local" }),
    ]);
    await artworkService.saveArtwork(art);
    expect((await db.artworks.get(art.id))?.sync.state).toBe("local");
    await artworkService.deleteArtwork(art.id);
    expect(await db.artworks.count()).toBe(0);
    expect(await db.deletions.count()).toBe(0);
  });

  test("summaries are newest first and carry no pixel data", async () => {
    at(1000);
    const older = await artworkService.createArtwork(input);
    at(2000);
    const newer = await artworkService.createArtwork(input);
    const summaries = await artworkService.listArtworkSummaries();
    expect(summaries.map((s) => s.id)).toEqual([newer.id, older.id]);
    expect(summaries[0]).not.toHaveProperty("layers");
    expect(summaries[0]).not.toHaveProperty("palette");
  });
});

describe("with an active owner", () => {
  test("each owner sees only their own art", async () => {
    const unowned = await artworkService.createArtwork(input);
    artworkService.setActiveOwner("u1");
    const mine = await artworkService.createArtwork(input);
    expect((await artworkService.listArtworkSummaries()).map((s) => s.id)).toEqual([mine.id]);
    expect(await artworkService.getArtwork(unowned.id)).toBeUndefined();
    artworkService.setActiveOwner("u2");
    expect(await artworkService.listArtworkSummaries()).toEqual([]);
  });

  test("writes mark the row dirty, bump updatedAt and keep the last synced version", async () => {
    artworkService.setActiveOwner("u1");
    at(1000);
    const art = await artworkService.createArtwork(input);
    expect(await db.artworks.get(art.id)).toMatchObject({
      ownerId: "u1",
      sync: { state: "dirty", syncedUpdatedAt: null },
    });
    await syncStore.markSynced(art.id, 1000);
    at(5000);
    await artworkService.saveArtwork(art);
    expect(await db.artworks.get(art.id)).toMatchObject({
      updatedAt: 5000,
      sync: { state: "dirty", syncedUpdatedAt: 1000 },
    });
    await syncStore.markSynced(art.id, 5000);
    at(6000);
    await artworkService.renameArtwork(art.id, "Dog");
    expect(await db.artworks.get(art.id)).toMatchObject({
      title: "Dog",
      updatedAt: 6000,
      sync: { state: "dirty", syncedUpdatedAt: 5000 },
    });
  });

  test("saveThumbnail neither bumps updatedAt nor marks dirty", async () => {
    artworkService.setActiveOwner("u1");
    at(1000);
    const art = await artworkService.createArtwork(input);
    await syncStore.markSynced(art.id, 1000);
    at(9000);
    await artworkService.saveThumbnail(art.id, "data:image/png;base64,NEW");
    expect(await db.artworks.get(art.id)).toMatchObject({
      updatedAt: 1000,
      thumbnail: "data:image/png;base64,NEW",
      sync: { state: "synced", syncedUpdatedAt: 1000 },
    });
  });

  test("deleting a synced row leaves a tombstone; a never-synced row does not", async () => {
    artworkService.setActiveOwner("u1");
    at(1000);
    const synced = await artworkService.createArtwork(input);
    await syncStore.markSynced(synced.id, 1000);
    const fresh = await artworkService.createArtwork(input);
    at(7000);
    await artworkService.deleteArtwork(synced.id);
    await artworkService.deleteArtwork(fresh.id);
    expect(await db.artworks.count()).toBe(0);
    expect(await db.deletions.toArray()).toEqual([{ id: synced.id, ownerId: "u1", deletedAt: 7000 }]);
  });

  test("writes never touch another owner's row and never resurrect a removed one", async () => {
    at(1000);
    const unowned = await artworkService.createArtwork(input);
    artworkService.setActiveOwner("u1");
    const removed = await artworkService.createArtwork(input);
    await syncStore.removeLocal(removed.id);
    at(2000);
    await artworkService.saveArtwork({ ...unowned, title: "Hijack" });
    await artworkService.renameArtwork(unowned.id, "Hijack");
    await artworkService.deleteArtwork(unowned.id);
    await artworkService.saveArtwork(removed);
    expect(await db.artworks.get(unowned.id)).toMatchObject({
      ownerId: null,
      title: "Cat",
      updatedAt: 1000,
    });
    expect(await db.artworks.get(removed.id)).toBeUndefined();
  });
});

test("onArtworkChanged fires for service writes only, until unsubscribed", async () => {
  artworkService.setActiveOwner("u1");
  const listener = vi.fn();
  const off = artworkService.onArtworkChanged(listener);
  const art = await artworkService.createArtwork(input);
  await artworkService.saveArtwork(art);
  await artworkService.renameArtwork(art.id, "Dog");
  await artworkService.saveThumbnail(art.id, "data:image/png;base64,X");
  await syncStore.markSynced(art.id, Date.now());
  await artworkService.deleteArtwork(art.id);
  expect(listener.mock.calls).toEqual([[art.id], [art.id], [art.id], [art.id]]);
  off();
  await artworkService.createArtwork(input);
  expect(listener).toHaveBeenCalledTimes(4);
});
