/**
 * Purpose:
 * IndexedDB access for the Drive sync engine and sign-out: sync bookkeeping, tombstones and
 * per-owner queries. Not scoped to the active owner, and never emits `onArtworkChanged`.
 *
 * Notes:
 * Signed-out rows have `ownerId: null`, which IndexedDB cannot index, so owner queries use string
 * owners only and `adoptUnowned` filters instead.
 */
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IArtworkDeletion, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import { hydrateArtwork } from "@/features/shared/artwork/artworkService";
import { db } from "@/features/shared/db/dexie.config";
import { clonePixelBuffer } from "@/features/shared/utils/binaryHelpers";

export async function getStored(id: string): Promise<IStoredArtwork | undefined> {
  const row = await db.artworks.get(id);
  return row ? hydrateArtwork(row) : undefined;
}

export async function listOwned(ownerId: string): Promise<IStoredArtwork[]> {
  const rows = await db.artworks.where("ownerId").equals(ownerId).toArray();
  return rows.map(hydrateArtwork);
}

/** Dirty rows of one owner, oldest `updatedAt` first. */
export async function listDirty(ownerId: string): Promise<IStoredArtwork[]> {
  const rows = await db.artworks
    .where("ownerId")
    .equals(ownerId)
    .filter((row) => row.sync.state === "dirty")
    .toArray();
  return rows.sort((a, b) => a.updatedAt - b.updatedAt).map(hydrateArtwork);
}

/** Stays dirty when the row was edited after the uploaded version. */
export async function markSynced(id: string, syncedUpdatedAt: number): Promise<void> {
  await db.transaction("rw", db.artworks, async () => {
    const row = await db.artworks.get(id);
    if (!row) return;
    await db.artworks.update(id, {
      sync: {
        state: row.updatedAt === syncedUpdatedAt ? "synced" : "dirty",
        syncedUpdatedAt,
      },
    });
  });
}

export async function markTooLarge(id: string): Promise<void> {
  await db.transaction("rw", db.artworks, async () => {
    const row = await db.artworks.get(id);
    if (!row) return;
    await db.artworks.update(id, {
      sync: { state: "tooLarge", syncedUpdatedAt: row.sync.syncedUpdatedAt },
    });
  });
}

/** Stores a Drive copy as synced, keeping the remote `updatedAt`. */
export async function putFromRemote(ownerId: string, artwork: IArtwork): Promise<void> {
  await db.artworks.put({
    ...artwork,
    layers: artwork.layers.map((layer) => ({
      ...layer,
      pixelData: clonePixelBuffer(layer.pixelData),
    })),
    ownerId,
    sync: { state: "synced", syncedUpdatedAt: artwork.updatedAt },
  });
}

/** Deletes a row without leaving a tombstone (the deletion came from Drive or sign-out). */
export async function removeLocal(id: string): Promise<void> {
  await db.artworks.delete(id);
}

export function listDeletions(ownerId: string): Promise<IArtworkDeletion[]> {
  return db.deletions.where("ownerId").equals(ownerId).toArray();
}

export async function dropDeletion(id: string): Promise<void> {
  await db.deletions.delete(id);
}

/** Gives every signed-out row to `ownerId` as dirty; returns how many moved. */
export function adoptUnowned(ownerId: string): Promise<number> {
  return db.artworks
    .filter((row) => row.ownerId === null)
    .modify((row) => {
      row.ownerId = ownerId;
      row.sync = { state: "dirty", syncedUpdatedAt: null };
    });
}

/** Dirty and too-large rows plus pending deletions. */
export function countUnsynced(ownerId: string): Promise<number> {
  return db.transaction("r", db.artworks, db.deletions, async () => {
    const rows = await db.artworks
      .where("ownerId")
      .equals(ownerId)
      .filter((row) => row.sync.state === "dirty" || row.sync.state === "tooLarge")
      .count();
    return rows + (await db.deletions.where("ownerId").equals(ownerId).count());
  });
}

export async function wipeOwner(ownerId: string): Promise<void> {
  await db.transaction("rw", db.artworks, db.deletions, async () => {
    await db.artworks.where("ownerId").equals(ownerId).delete();
    await db.deletions.where("ownerId").equals(ownerId).delete();
  });
}
