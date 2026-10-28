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
import type {
  IArtworkDeletion,
  IRemovedArtwork,
  ISyncExpectedRow,
  IStoredArtwork,
} from "@/features/shared/artwork/artworkSync.type";
import { hydrateArtwork } from "@/features/shared/artwork/artworkService";
import { planOtherOwnerWipe } from "@/features/shared/artwork/otherOwnerWipe";
import type { IOwnedRowBrief } from "@/features/shared/artwork/otherOwnerWipe.type";
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

/** Stays dirty when the row was edited after the pushed version (the new version may fit). */
export async function markTooLarge(id: string, pushedUpdatedAt: number): Promise<boolean> {
  return db.transaction("rw", db.artworks, async () => {
    const row = await db.artworks.get(id);
    if (!row || row.updatedAt !== pushedUpdatedAt) return false;
    await db.artworks.update(id, {
      sync: { state: "tooLarge", syncedUpdatedAt: row.sync.syncedUpdatedAt },
    });
    return true;
  });
}

/** True when the row in IndexedDB still is the one `expected` describes (`undefined`: still absent). */
function stillMatches(
  row: IStoredArtwork | undefined,
  expected: ISyncExpectedRow | undefined,
): boolean {
  if (!row) return expected === undefined;
  return (
    expected !== undefined &&
    row.ownerId === expected.ownerId &&
    row.updatedAt === expected.updatedAt &&
    row.sync.state === expected.state
  );
}

/**
 * Stores a Drive copy as synced, keeping the remote `updatedAt`, only while the local row is still
 * the one the decision was made on (`expected`; `undefined` = there was no row). The check and the
 * write share one transaction, so an edit that landed during the download is never overwritten.
 * `conflictCopy` (the local version being replaced, under a new id) is saved by the same transaction.
 * Returns whether it wrote.
 */
export async function putFromRemote(
  ownerId: string,
  artwork: IArtwork,
  expected: ISyncExpectedRow | undefined,
  conflictCopy?: IStoredArtwork,
): Promise<boolean> {
  return db.transaction("rw", db.artworks, async () => {
    if (!stillMatches(await db.artworks.get(artwork.id), expected)) return false;
    // The row this write replaces is kept first, in the same transaction: both land or neither does.
    if (conflictCopy) await db.artworks.put(conflictCopy);
    await db.artworks.put({
      ...artwork,
      layers: artwork.layers.map((layer) => ({
        ...layer,
        pixelData: clonePixelBuffer(layer.pixelData),
      })),
      ownerId,
      sync: { state: "synced", syncedUpdatedAt: artwork.updatedAt },
    });
    return true;
  });
}

/**
 * Takes a row out of the gallery without leaving a tombstone (the deletion came from Drive), only
 * while it is still the one the decision was made on. The row is not destroyed: it moves into the
 * removed table (stamped `removedAt`) so `restoreRemoved` can bring it back until `purgeRemoved`
 * drops it. Returns whether it moved.
 */
export async function removeLocal(
  id: string,
  expected: ISyncExpectedRow,
  removedAt: number,
): Promise<boolean> {
  return db.transaction("rw", db.artworks, db.removedArtworks, async () => {
    const row = await db.artworks.get(id);
    if (!row || !stillMatches(row, expected)) return false;
    await db.removedArtworks.put({ ...row, removedAt });
    await db.artworks.delete(id);
    return true;
  });
}

/** One owner's removed rows, most recently removed first. */
export async function listRemoved(ownerId: string): Promise<IRemovedArtwork[]> {
  const rows = await db.removedArtworks.where("ownerId").equals(ownerId).toArray();
  return rows.sort((a, b) => b.removedAt - a.removedAt);
}

/**
 * Puts a removed row back in the gallery as `dirty` (Drive no longer has it, so it must be uploaded
 * again). Does nothing, and resolves false, for another owner's row, a missing row, or an id that is
 * live again.
 */
export async function restoreRemoved(id: string, ownerId: string): Promise<boolean> {
  return db.transaction("rw", db.artworks, db.removedArtworks, async () => {
    const removed = await db.removedArtworks.get(id);
    if (!removed || removed.ownerId !== ownerId || (await db.artworks.get(id))) return false;
    const row: IStoredArtwork & { removedAt?: number } = { ...removed };
    delete row.removedAt;
    await db.artworks.put({ ...row, sync: { state: "dirty", syncedUpdatedAt: null } });
    await db.removedArtworks.delete(id);
    return true;
  });
}

/** Drops every removed row removed before `cutoff` (any owner); resolves with how many. */
export function purgeRemoved(cutoff: number): Promise<number> {
  return db.removedArtworks.where("removedAt").below(cutoff).delete();
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
  await db.transaction("rw", db.artworks, db.deletions, db.removedArtworks, async () => {
    await db.artworks.where("ownerId").equals(ownerId).delete();
    await db.deletions.where("ownerId").equals(ownerId).delete();
    await db.removedArtworks.where("ownerId").equals(ownerId).delete();
  });
}

/**
 * Removes the `synced` rows of every owner except `currentOwnerId` (see `planOtherOwnerWipe`),
 * planning and deleting in one transaction so a row edited meanwhile is never deleted. Tombstones
 * and every other row stay. Resolves with the number of rows removed.
 */
export async function wipeSyncedRowsOfOtherOwners(currentOwnerId: string): Promise<number> {
  return db.transaction("rw", db.artworks, db.deletions, db.removedArtworks, async () => {
    // Residue of another account's removals goes with its rows; this is a privacy sweep.
    await db.removedArtworks.where("ownerId").notEqual(currentOwnerId).delete();
    // Index-only pre-check: with no other owner on disk (the usual case) no row is read at all.
    const otherIds = await db.artworks.where("ownerId").notEqual(currentOwnerId).primaryKeys();
    if (otherIds.length === 0) return 0;
    const briefs: IOwnedRowBrief[] = [];
    for (const row of await db.artworks.bulkGet(otherIds)) {
      if (row) briefs.push({ id: row.id, ownerId: row.ownerId, state: row.sync.state });
    }
    const tombstonedIds = new Set(await db.deletions.toCollection().primaryKeys());
    const ids = planOtherOwnerWipe(currentOwnerId, briefs, tombstonedIds);
    await db.artworks.bulkDelete(ids);
    return ids.length;
  });
}
