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
  await db.removedArtworks.clear();
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
    expect(await db.deletions.toArray()).toEqual([
      { id: synced.id, ownerId: "u1", deletedAt: 7000 },
    ]);
  });

  test("writes never touch another owner's row and never resurrect a removed one", async () => {
    at(1000);
    const unowned = await artworkService.createArtwork(input);
    artworkService.setActiveOwner("u1");
    const removed = await artworkService.createArtwork(input);
    await db.artworks.delete(removed.id);
    at(2000);
    expect(await artworkService.saveArtwork({ ...unowned, title: "Hijack" })).toBe(false);
    expect(await artworkService.renameArtwork(unowned.id, "Hijack")).toBe(false);
    expect(await artworkService.deleteArtwork(unowned.id)).toBe(false);
    expect(await artworkService.saveArtwork(removed)).toBe(false);
    expect(await db.artworks.get(unowned.id)).toMatchObject({
      ownerId: null,
      title: "Cat",
      updatedAt: 1000,
    });
    expect(await db.artworks.get(removed.id)).toBeUndefined();
  });
});

test("save, rename and delete report true when the row was written", async () => {
  artworkService.setActiveOwner("u1");
  const art = await artworkService.createArtwork(input);
  expect(await artworkService.saveArtwork(art)).toBe(true);
  expect(await artworkService.renameArtwork(art.id, "Dog")).toBe(true);
  expect(await artworkService.deleteArtwork(art.id)).toBe(true);
  expect(await artworkService.deleteArtwork(art.id)).toBe(false);
});

test("an owner that changed to null mid-edit makes save report false and leaves the row", async () => {
  artworkService.setActiveOwner("u1");
  const art = await artworkService.createArtwork(input);
  artworkService.setActiveOwner(null);
  expect(await artworkService.saveArtwork({ ...art, title: "Late" })).toBe(false);
  expect(await db.artworks.get(art.id)).toMatchObject({ ownerId: "u1", title: "Cat" });
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

test("a throwing listener neither rejects the write nor blocks other listeners", async () => {
  const bad = artworkService.onArtworkChanged(() => {
    throw new Error("boom");
  });
  const good = vi.fn();
  const off = artworkService.onArtworkChanged(good);
  const art = await artworkService.createArtwork(input);
  expect(await db.artworks.get(art.id)).toBeDefined();
  expect(good).toHaveBeenCalledWith(art.id);
  bad();
  off();
});

test("save, rename and delete of a missing or foreign row emit no event", async () => {
  const unowned = await artworkService.createArtwork(input);
  artworkService.setActiveOwner("u1");
  const listener = vi.fn();
  const off = artworkService.onArtworkChanged(listener);
  await artworkService.saveArtwork({ ...unowned, title: "X" });
  await artworkService.renameArtwork(unowned.id, "X");
  await artworkService.deleteArtwork(unowned.id);
  await artworkService.saveArtwork({ ...unowned, id: "missing" });
  await artworkService.renameArtwork("missing", "X");
  await artworkService.deleteArtwork("missing");
  expect(listener).not.toHaveBeenCalled();
  off();
});

describe("clock safety", () => {
  const MINUTE = 60_000;

  test("a save never stamps an artwork at or below its stored updatedAt, even when the clock stepped back", async () => {
    artworkService.setActiveOwner("u1");
    at(10_000_000);
    const art = await artworkService.createArtwork(input);
    at(9_900_000);
    await artworkService.saveArtwork(art);
    expect((await db.artworks.get(art.id))?.updatedAt).toBe(10_000_001);
    await artworkService.saveArtwork(art);
    expect((await db.artworks.get(art.id))?.updatedAt).toBe(10_000_002);
  });

  test("a save uses the wall clock when it is ahead of the stored stamp", async () => {
    artworkService.setActiveOwner("u1");
    at(1000);
    const art = await artworkService.createArtwork(input);
    at(5000);
    await artworkService.saveArtwork(art);
    expect((await db.artworks.get(art.id))?.updatedAt).toBe(5000);
  });

  test("a rename is monotonic too", async () => {
    artworkService.setActiveOwner("u1");
    at(10_000_000);
    const art = await artworkService.createArtwork(input);
    at(9_900_000);
    await artworkService.renameArtwork(art.id, "Dog");
    expect((await db.artworks.get(art.id))?.updatedAt).toBe(10_000_001);
  });

  test("an edit after a clock correction restarts from the clock when Drive never accepted the future stamp", async () => {
    artworkService.setActiveOwner("u1");
    const year = 365 * 24 * 60 * MINUTE;
    at(1_000_000 + year); // wrong clock, a year ahead
    const art = await artworkService.createArtwork(input);
    at(1_000_000); // clock corrected
    await artworkService.saveArtwork(art);
    expect((await db.artworks.get(art.id))?.updatedAt).toBe(1_000_000);
  });

  test("an edit still outranks a future stamp Drive already holds", async () => {
    artworkService.setActiveOwner("u1");
    const future = 1_000_000 + 365 * 24 * 60 * MINUTE;
    await syncStore.putFromRemote("u1", { ...(await seed()), updatedAt: future }, undefined);
    at(1_000_000);
    const stored = (await db.artworks.toArray())[0];
    await artworkService.saveArtwork(stored);
    expect((await db.artworks.get(stored.id))?.updatedAt).toBe(future + 1);
  });

  test("a delete's tombstone is not older than the version Drive holds", async () => {
    artworkService.setActiveOwner("u1");
    const future = 1_000_000 + 10 * MINUTE;
    await syncStore.putFromRemote("u1", { ...(await seed()), updatedAt: future }, undefined);
    at(1_000_000);
    const stored = (await db.artworks.toArray())[0];
    await artworkService.deleteArtwork(stored.id);
    expect(await db.deletions.toArray()).toEqual([{ id: stored.id, ownerId: "u1", deletedAt: future }]);
  });

  async function seed() {
    artworkService.setActiveOwner(null);
    const art = await artworkService.createArtwork(input);
    await db.artworks.clear();
    artworkService.setActiveOwner("u1");
    return art;
  }
});
